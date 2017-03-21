'use strict';

/**
 * [读取配置文件]
 * 根据运行环境读取配置文件
 * 支持三种环境：
 * 1. production   生产环境
 * 2. development  开发环境
 * 3. test         测试环境
 * 
 * 配置环境设置可以通过以下方式：
 * windows: SET NODE_ENV=production
 * unix:    export NODE_ENV=production 
 */

var Common = require('confit/dist/lib/common');
var Config = require('confit/dist/lib/config');
var Provider = require('confit/dist/lib/provider');
var path = require('path');
var fs = require('fs');
var shush = require('shush');
var currentEnv = Provider.convenience();

// 读取默认配置
var defaultConfig = path.join(__dirname, 'config.json');
var envConfig = path.join(__dirname, currentEnv.env.env + '.json');
var store = Common.merge(Provider.env(), {});

store = Common.merge(currentEnv, store);

if(fs.existsSync(defaultConfig)){
	store = Common.merge(shush(defaultConfig), store);
}

if(fs.existsSync(envConfig)){
	store = Common.merge(shush(envConfig), store);
}

// 命令行的参数权重最大
store = Common.merge(Provider.argv(), store);

module.exports = new Config(store);