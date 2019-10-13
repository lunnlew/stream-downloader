'use strict'
const psl = require('psl')
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 
var agent = function(params, opts){
	logger.info('referer ' + params.referer)
	let superagent = require('superagent')
	require('superagent-proxy')(superagent)

	let agent = superagent.agent()

	let referer = new URL(params.referer)
    let domain_parsed = psl.parse(referer.hostname)
	var cookies_str = opts.httpCookies || ''
    var cookies = cookies_str.split("; ")
    cookies.forEach(function(item){
        let domain = params.cookieDomain||domain_parsed['domain']
        let path = "/"
        // 仅对不含中文的cookie进行处理
        if(!/.*[\u4e00-\u9fa5]+.*$/.test(item)) {
            agent.jar.setCookie(`${item};domain=${domain};path=${path}`, domain, path)
        }
    })
    if(params.referer){
        let url_part = new URL(params.referer)
        agent = agent.set('referer', params.referer)
    }
    return agent
        .set('accept', params.accept||'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3; charset=utf8')
        .set('user-agent', params.userAgent||UserAgent)
}
exports = module.exports = {agent}