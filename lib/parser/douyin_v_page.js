'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
var cheerio = require('cheerio')
const { getUrlExt, streamsSort } = require(path.join(__dirname, '../utils'))

var exec = async function(params, opts) {
    logger.info("matching info")
    let body = await request.agent({ 'referer': params.url }, opts).get(params.url).proxy(opts['httpProxy'])
    let match = body.text.match(/playAddr:\s*"([^"].*?)"/iu)
    let url = match[1]

    var $ = cheerio.load(body.text)

    let title = $('.container').find('p.name').text()

    let stream_id = 'default'
    let streams = []

    streams[stream_id] = {
        "id": stream_id,
        'container': "mp4",
        'type': 'video',
        'format': 'mp4',
        'isRemote': true,
        'src': [url]
    }

    return [{
        "title": title,
        "url": params.url,
        "merge": true,
        "streams": streams
    }]

    return []
}
exports = module.exports = { exec, vp: true }