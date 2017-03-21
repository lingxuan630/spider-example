/**
 * API列表
 */
var _ = require('lodash');

var commonApis = {
 	GET_WEATHER: {
 		url: 'http://www.weather.com.cn/data/sk/:cityId.html',
 		method: 'GET',
 		parse: function(resp){
 			return resp;
 		}
 	}	
}
module.exports = commonApis;