/**
 * commom http adapter
 */
var Q  = require('q');
var EasiAdapter = require('../libs/easi-adapter/index');
var Errors = require('../libs/easi-adapter/libs/error');
var Actions = require('../actions/index');
var Apis = require('../apis/index');

// 输出App-Adapter
var HttpAdapter = new EasiAdapter({
	actions: Actions,
	http: {
		apis: Apis,
		options: {
			request: {
				headers: {
	        'Content-Type': 'application/x-www-form-urlencoded',
	      },
	      json: true
			}
		}
	}
})
module.exports = HttpAdapter;