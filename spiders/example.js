var Http = require('../adapters/http');
var _  = require('lodash');

Http.dispatch('GET_WEATHER', {
	cityId: '101010100',
}).then(
	function(resp){
		console.log(resp);
	},
	function(error){
		console.log(error);
	}
)