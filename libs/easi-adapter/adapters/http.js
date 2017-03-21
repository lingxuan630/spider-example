/**
 * http adapter
 * 通过调用http服务实现数据调用
 * 核心入口：HttpServiceCaller
 * By linson
 */

'use strict';
var Request = require('request');
var _ = require('lodash');
var JJV = require('jjv');
var Q = require('q');
var deepExtend = require('deep-extend');

var ClassBase = require('../libs/class');
var Utils = require('../libs/utils');
var Errors = require('../libs/error');

/**
 * [HttpServiceCaller description]
 * @param {string} actionName [调用的名称]
 * @param {params} params     [参数]
 * @param {options} schema    [其他设置]
 */
var HttpServiceCaller = ClassBase.extend({
  apis: {},
  options: {
    locals: {}, // 注入一些全局数据
    request: {
      baseUrl: '',
      headers: {
        "Content-Type": 'application/json'
      },
      json: true
    }
  },
  initialize: function(apis, options) {
    // 注意deepExtend事实上会改变引用数据
    this.options = deepExtend(_.cloneDeep(this.options), options);
    this.apis = apis;
    return this;
  },
  request: function(actionName, params, options) {

    var deferred = Q.defer();
    var ts = (new Date()).getTime();
    var vm = this;
    var thisOptions = _.cloneDeep(this.options); // * cloneDeep 为了防止引用被修改
    var apis = this.apis;

    if (!_.isEmpty(options)) {
      thisOptions = deepExtend(thisOptions, options);
    }

    // 当发现api信息不存在时返回400报错
    if (!_.has(apis, actionName)) {
      return Q.fcall(function() {
        throw new Errors.HTTPError('API "' + actionName + '" is not found', 400);
      });
    }

    var requestOptions = thisOptions.request;
    var thisAPI = apis[actionName];

    // 合并单个请求的自定义配置进来
    if (!_.isEmpty(thisAPI.options)) {
      thisOptions = deepExtend(thisOptions, thisAPI.options);
    }

    // 当url为http时，设置baseUrl为空
    if(Utils.isHttp(thisAPI.url)){
      requestOptions.baseUrl = '';
    }

    params = _.isFunction(params) ? params(thisAPI, thisOptions) : params;
    requestOptions.uri = Utils.parseRestUrl(thisAPI.url, _.extend(thisOptions.locals, params));

    requestOptions.method = thisAPI.method;

    // 拼接参数
    if (!_.isEmpty(params)) {
      if (thisAPI.method === 'GET' || thisAPI.method === 'DELETE') {
        requestOptions.qs = params
      }

      if (thisAPI.method === 'POST' || thisAPI.method === 'PUT') {
        if (requestOptions.headers['Content-Type'] === 'application/json') {
          requestOptions.body = params;
        } else {
          requestOptions.form = params;
        }
      }
    }

    //特殊处理的扩展 --start
    var extentions = {};
    extentions.errorHandler = thisAPI.errorHandler ? thisAPI.errorHandler : function(error) { return error };
    extentions.checkBody    = thisAPI.checkBody    ? thisAPI.checkBody : false;
    //特殊处理的扩展 --end

    Request(requestOptions, function(error, response, body) {
      console.log('=================start ' + actionName + ' request========================');
      console.log('options', JSON.stringify(requestOptions));
      console.log('response', JSON.stringify(response));
      console.log('error', JSON.stringify(error));
      console.log('=================end ' + actionName + ' request========================');
      
      // 特殊处理 --start      
      if (error || response.statusCode !== 200) {
        
        var errorMessage = error ? error : body;      
        errorMessage = extentions.errorHandler(errorMessage);
        deferred.reject(errorMessage);
        return false;
      }

      if(extentions.checkBody === true){

        if(body.statusCode !== 200){

          var errorMessage = error ? error : body;      
          errorMessage = extentions.errorHandler(errorMessage);
          deferred.reject(errorMessage);
          return false;
        }
      }

      // 特殊处理 --end


      // 此处考虑通过中间件方式重写
      if (!_.isFunction(thisOptions.filter)) {
        var respData = thisAPI.parse ? thisAPI.parse(body, response, thisOptions.locals) : body;
        parseResp(respData, thisOptions.schema, response, deferred);
      } else {
        thisOptions.filter(body, response)
          .then(
            function(resp) {
              // console.log(actionName, resp);
              var respData = thisAPI.parse ? thisAPI.parse(resp, response, thisOptions.locals) : resp;
              // console.log(actionName, respData, '----------------------');
              parseResp(respData, thisOptions.schema, response, deferred);
            },
            function(filterError) {
              deferred.reject(filterError);
            }
          )
      }

    });

    return deferred.promise;
  }
})

/**
 * [parseResp 格式化返回的数据]
 */
function parseResp(respData, schema, response, deferred) {
  var validateResult = validateResp(respData, schema);
  if (validateResult.status === 'success') {
    deferred.resolve(validateResult.resp, response);
  } else {
    deferred.reject(validateResult.errors);
  }
}

/**
 * [validateResp 校验返回的数据格式]
 * @param  {[obj]} resp   
 * @param  {[obj]} schema 
 */
function validateResp(resp, schema) {
  if (_.isEmpty(schema)) {
    return { status: 'success', resp: resp };
  }
  var validator = new JJV();
  var options = {
    removeAdditional: false
  };
  if (!!schema.removeAdditional) {
    options.removeAdditional = true;
  }
  var errors = validator.validate(schema, resp, options);
  if (!errors) {
    return { status: 'success', resp: resp };
  } else {
    return { status: 'fail', errors: '[validate][fail]validate response Fail, for: ' + JSON.stringify(errors) };
  }
}

module.exports = HttpServiceCaller;
