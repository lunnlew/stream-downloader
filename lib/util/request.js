'use strict'
const path = require('path')
const psl = require('psl')
let UserAgent = require(path.join(__dirname, '../util/userAgents')).get()
var agent = function(params, opts) {
    logger.info('referer ' + params.referer)
    let superagent = require('superagent')
    require('superagent-proxy')(superagent)

    let agent = superagent.agent()

    let referer = new URL(params.referer)
    let domain_parsed = psl.parse(referer.hostname)
    var cookies_str = opts.httpCookies || ''
    var cookies = cookies_str.split("; ")
    cookies.forEach(function(item) {
        let domain = params.cookieDomain || domain_parsed['domain']
        let path = "/"
        // 仅对不含中文的cookie进行处理
        if (!/.*[\u4e00-\u9fa5]+.*$/.test(item)) {
            agent.jar.setCookie(`${item};domain=${domain};path=${path}`, domain, path)
        }
    })
    if (params.referer) {
        let url_part = new URL(params.referer)
        agent = agent.set('referer', params.referer)
    }
    return agent
        .set('accept', params.accept || 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3; charset=utf8')
        .set('user-agent', params.userAgent || UserAgent)
}
exports = module.exports = { agent }