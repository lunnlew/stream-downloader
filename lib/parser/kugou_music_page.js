'use strict';
const path = require('path')
var request = require(path.join(__dirname, '../rq'));
const superagent = require('superagent')
const { md5 } = require(path.join(__dirname, '../utils'))
var cheerio = require('cheerio');
const { gunzip } = require(path.join(__dirname, '../utils'))
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"

var exec = async function(params, opts) {
    logger.info("matching audio info ")
    let url_macth = params.url.match(/www\.kugou\.com\/song\/([a-zA-Z0-9=]+).html/iu)
    let sid = url_macth[1]
    logger.info("sid " + sid)

    let body = await request.get(params.url, null, {
        "referer": params.url,
        'Accept-Encoding': 'gzip'
    })
    body = await gunzip(body)
    let hash_match = body.match(/"hash":"([A-Z0-9]+)"/iu);
    let hash = hash_match[1]
    logger.info("hash " + hash)

    let album_id_match = body.match(/"album_id":([A-Z0-9]+)/iu);
    let album_id = album_id_match[1]
    logger.info("album_id " + album_id)

    var $ = cheerio.load(body)
    let song_name = $('.songContent').find('.audioName').text().trim()
    logger.info("song_name " + song_name)

    let t = (new Date()).getTime().toString()

    let dfid = md5(t)
    let mid = md5(t)

    let info_url = `https://wwwapiretry.kugou.com/yy/index.php?r=play/getdata&callback=jQuery19109282733087710577_${t}&hash=${hash}&album_id=${album_id}&dfid=${dfid}&mid=${mid}&platid=4&_=${t}`
    let agent = superagent.agent()
    let content = await agent
        .post(info_url)
        .set('referer', params.url)
        .set('User-Agent', UserAgent)
        .set('accept', 'text/html;charset=utf-8')

    content = content.text.replace(`jQuery19109282733087710577_${t}(`, '').replace(');', '')
    let json = JSON.parse(content)

    let urls = []
    let stream_id = "mp3"
    let streams = {}

    if (json['err_code'] == 0) {
        urls.push(json['data']['play_url'])
        streams[stream_id] = {
            "id": stream_id,
            'container': "mp3",
            'type': 'audio',
            'size': json['data']['filesize'],
            'format': 'mp3',
            'isRemote': true,
            'src': urls
        }
    }

    let streams_sorted = streams
    logger.info("matching audio completeed ")
    return [{
        "title": song_name,
        "url": params.url,
        "streams": streams_sorted
    }]
}
exports = module.exports = { exec, vp: true }