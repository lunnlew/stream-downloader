'use strict';
const path = require('path')
var request = require(path.join(__dirname, '../rq'));
const { gunzip } = require(path.join(__dirname, '../utils'))
const { asrsea, ecnonasr, buildMusicDetailParams, buildMusicParams } = require(path.join(__dirname, '../encrypt/netease_encrypt'))
let UserAgent = require(path.join(__dirname, '../util/userAgents')).get()
const superagent = require('superagent')

var exec = async function(params, opts) {
    logger.info("matching audio info ")
    let url_macth = params.url.match(/music\.163\.com\/[#/]{0,2}[dj|program]+\?id=([a-zA-Z0-9=]+)/iu)
    let sid = url_macth[1]
    logger.info("sid " + sid)

    let payload = buildMusicDetailParams(sid)

    var cookies_str = opts.httpCookies || ''
    var agent = superagent.agent()
    var cookies = cookies_str.split("; ")
    cookies.forEach(function(item) {
        agent.jar.setCookie(item, "music.163.com", "/")
    })

    let info_api = `https://music.163.com/weapi/dj/program/detail?csrf_token=`
    let content = await agent
        .post(info_api)
        .set('referer', params.url)
        .set('User-Agent', UserAgent)
        .set('accept', 'application/json; charset=utf8')
        .type('form')
        .send(payload)
    let v_json = JSON.parse(content.text)
    let dj = v_json['program']['dj']
    let title = dj.signature

    let mainSong = v_json['program']['mainSong']

    payload = buildMusicParams(mainSong.id)
    info_api = `https://music.163.com/weapi/song/enhance/player/url/v1?csrf_token=`
    content = await agent
        .post(info_api)
        .set('referer', params.url)
        .set('User-Agent', UserAgent)
        .set('accept', 'application/json; charset=utf8')
        .type('form')
        .send(payload)
    v_json = JSON.parse(content.text)

    let urls = []
    let stream_id = "m4a"
    let streams = {}

    if (v_json['code'] == 200) {
        urls.push(v_json['data'][0]['url'])
        streams[stream_id] = {
            "id": stream_id,
            'container': "m4a",
            'type': 'audio',
            'size': v_json['data'][0]['size'],
            'format': 'm4a',
            'isRemote': true,
            'src': urls
        }
    }

    let streams_sorted = streams
    logger.info("matching audio completeed ")
    return [{
        "title": title,
        "url": params.url,
        "streams": streams_sorted
    }]
}
exports = module.exports = { exec, vp: true }