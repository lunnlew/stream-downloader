'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
const { streamsSort, requestStrToMap, md5, getUrlExt } = require(path.join(__dirname, '../utils'))
const { sign } = require(path.join(__dirname, '../encrypt/douyu_encrypt_topic'))

const ids = ['2', '0']
const id_2_profile = { '2': '高清', '0': '蓝光10M' }

var exec = async function(params, opts) {
    logger.info("matching info")
    let url_macth = params.url.match(/douyu.com\/topic\/([a-zA-Z]+)\?rid=([0-9]+)/iu)
    let roomid = url_macth[2]
    logger.info("roomid " + roomid)

    let agent = request.agent({ 'referer': params.url }, opts)

    let info_url = `https://www.douyu.com/betard/${roomid}`
    let content_s = await agent
        .post(info_url)
        .set('referer', params.url)
    let json
    try {
        json = JSON.parse(content_s.text)
    } catch (err) {
        logger.error('fetch info error!')
        return []
    }

    let disables = ['0']

    let title = json['room']['room_name']
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
        disables = []
    }

    let signstr = sign(roomid, did, t)
    let pas = requestStrToMap(signstr)
    let streams = []
    for (let rate of ids) {
        let payload = {
            v: pas['v'],
            did: did,
            tt: t,
            sign: pas['sign'],
            cdn: '',
            rate: rate,
            ver: 'Douyu_219101405',
            iar: 1,
            ive: 1
        }

        let info_api = `https://www.douyu.com/lapi/live/getH5Play/${roomid}`
        let content = await agent
            .post(info_api)
            .set('accept', 'application/json; charset=utf-8')
            .type('form')
            .send(payload)
        let vjson = JSON.parse(content.text)
        let stream_id = rate
        if (vjson['data']['rate'] != rate) {
            logger.debug(`rate：${id_2_profile[stream_id]}, 需要登陆cookie才有效`)
            continue
        }
        if (vjson['error'] == 0) {
            let ext = getUrlExt(vjson['data']['rtmp_live'])
            streams[stream_id] = {
                'id': stream_id,
                'video_profile': id_2_profile[stream_id],
                'type': 'video',
                'container': ext,
                'src': [`${vjson['data']['rtmp_url']}/${vjson['data']['rtmp_live']}`],
                'format': ext,
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