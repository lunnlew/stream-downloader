'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
const { getUrlExt, streamsSort } = require(path.join(__dirname, '../utils'))
var cheerio = require('cheerio')

var exec = async function(params, opts) {
    logger.info("matching info")
    let body = await request.agent({ 'referer': params.url }, opts).get(params.url).proxy(opts['httpProxy'])

    let $ = cheerio.load(body.text)
    let infoapi = $('#content_data').attr('src')

    body = await request.agent({ 'referer': infoapi }, opts)
        .buffer(true)
        .set('content-type', 'application/javascript')
        .get(infoapi).proxy(opts['httpProxy'])

    let match = body.text.match(/video_url"\s*:\s*"([^"]*)"/iu)
    let video_url = match[1]
    let ext = getUrlExt(video_url)

    match = body.text.match(/title"\s*:\s*"([^"]*)"/iu)
    let title = match[1]

    let streams = {}
    streams[ext] = {
        "id": ext,
        'duration': 0,
        'container': ext,
        'type': 'video',
        'format': 'mp4',
        'isRemote': true,
        'video_profile': ext,
        'src': [video_url],
        "merge": true,
        'size': 0
    }

    return [{
        "title": title,
        "url": params.url,
        "streams": streams
    }]
}
exports = module.exports = { exec, vp: true }