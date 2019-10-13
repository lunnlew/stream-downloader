'use strict';

const path = require('path')
var request = require(path.join(__dirname, '../rq'));
const { gunzip } = require(path.join(__dirname, '../utils'))

var exec = async function(params, opts) {
    logger.info("matching audio info ")
    let url_macth = params.url.match(/www\.bilibili\.com\/audio\/au([a-zA-Z0-9]+)/iu)
    let sid = url_macth[1]
    logger.info("debug sid " + sid)

    let info_api = `https://www.bilibili.com/audio/music-service-c/web/song/info?sid=${sid}`
    let vcontent = await request.get(info_api, null, {
        "referer": params.url,
        'Accept-Encoding': 'gzip'
    })
    vcontent = await gunzip(vcontent)
    let vp_json = JSON.parse(vcontent)

    let title = vp_json['data']['title']

    let play_info_url = `https://www.bilibili.com/audio/music-service-c/web/url?sid=${sid}`

    let pcontent = await request.get(play_info_url, null, {
        "referer": params.url,
        'Accept-Encoding': 'gzip'
    })
    pcontent = await gunzip(pcontent)
    let p_json = JSON.parse(pcontent)

    let urls = []
    urls.push(p_json['data']['cdns'][0])

    let stream_id = "m4a"
    let streams = {}
    streams[stream_id] = {
        "id": stream_id,
        'container': "m4a",
        'type': 'audio',
        'size': p_json['data']['size'],
        'format': 'm4a',
        'isRemote': true,
        'src': urls
    }

    let streams_sorted = streams

    logger.info("matching audio completeed ")
    return [{
        "title": title,
        "url": params.url,
        "merge": true,
        "streams": streams_sorted
    }]
}
exports = module.exports = { exec, vp: true }