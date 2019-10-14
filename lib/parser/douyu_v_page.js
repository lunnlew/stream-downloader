'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
const { streamsSort, requestStrToMap, md5, getUrlExt } = require(path.join(__dirname, '../utils'))
const { sign } = require(path.join(__dirname, '../encrypt/douyu_encrypt_v'))

const ids = ['normal', 'high', 'super']
const id_2_profile = { 'normal': '高清', 'high': '超清', 'super': '原画' }

var exec = async function(params, opts) {
    logger.info("matching info")
    let agent = request.agent({
        'referer': params.url,
        'cookieDomain': 'douyu.com'
    }, opts)

    let body = await agent.get(params.url).proxy(opts['httpProxy'])

    let match = body.text.match(/\$ROOM\s*=\s*(.*?);\s*/iu)
    let v_json = JSON.parse(match[1])

    let point_id = v_json['point_id']
    logger.info("point_id " + point_id)

    let vid = v_json['vid']
    logger.info("vid " + vid)

    let title = v_json['name']
    logger.info("title " + title)

    let t = parseInt((new Date()).getTime() / 1000).toString()
    let did = md5(t)

    let did_cookie = agent.jar.getCookie('dy_did', {
        'domain': 'douyu.com',
        'path': '/',
        'noscript': false,
        'secure': false
    })
    if (did_cookie) {
        did = did_cookie['value']
    }

    let signstr = sign(point_id, did, t)
    let pas = requestStrToMap(signstr)

    let payload = {
        v: pas['v'],
        did: did,
        tt: t,
        sign: pas['sign'],
        vid: vid
    }

    let info_api = `https://v.douyu.com/api/stream/getStreamUrl`
    let content = await agent
        .post(info_api)
        .set('referer', params.url)
        .type('form')
        .send(payload)
    let vjson = JSON.parse(content.text)

    let streams = []

    for (let stream_id of ids) {
        if (stream_id in vjson['data']['thumb_video']) {
            let v = vjson['data']['thumb_video'][stream_id]
            let ext = getUrlExt(v['url'])
            streams[stream_id] = {
                'id': stream_id,
                'video_profile': id_2_profile[stream_id],
                'type': 'video',
                'container': ext,
                'src': [v['url']],
                'format': 'mp4',
                'isRemote': true
            }
        }
    }

    return [{
        "title": title,
        "url": params.url,
        "merge": false,
        "streams": streamsSort(streams, ids)
    }]
}
exports = module.exports = { exec, vp: true }