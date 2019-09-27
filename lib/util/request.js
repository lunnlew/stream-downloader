'use strict'
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 
const superagent = require('superagent')
var agent = function(params, opts){
	console.log('debug: request url ' + params.url)
	return superagent.agent()
        .set('referer', params.url)
        .set('accept', params.accept||'text/html; charset=utf8')
        .set('user-agent', params.userAgent||UserAgent)
}
exports = module.exports = {agent}