'use strict'
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 
var agent = function(params, opts){
	console.log('debug: referer ' + params.referer)
	let superagent = require('superagent')
	require('superagent-proxy')(superagent)

	let agent = superagent.agent()

	let referer = new URL(params.referer);
	var cookies_str = opts.httpCookies || ''
    var cookies = cookies_str.split("; ")
    cookies.forEach(function(item){
        agent.jar.setCookie(item, referer.hostname, "/")
    })

    return agent.set('referer', params.referer || '')
        .set('accept', params.accept||'text/html; charset=utf8')
        .set('user-agent', params.userAgent||UserAgent)
}
exports = module.exports = {agent}