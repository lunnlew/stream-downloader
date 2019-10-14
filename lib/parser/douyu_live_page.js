'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
const { streamsSort, requestStrToMap, md5, getUrlExt } = require(path.join(__dirname, '../utils'))
const { sign } = require(path.join(__dirname, '../encrypt/douyu_encrypt'))

const vd_2_id = { 0: '10000', 1: '550', 2: '1200', 3: '2000', 4: '4000' }
const ids = ['550', '1200', '2000', '4000', '10000']
const id_2_profile = { '550': '流畅', '1200': '高清', '2000': '超清', '4000': '蓝光4M', '10000': '蓝光10M' }

var exec = async function(params, opts) {
    logger.info("matching info")
    let url_macth = params.url.match(/douyu.com\/([0-9]+)/iu)
    let roomid = url_macth[1]
    logger.info("roomid " + roomid)

    let agent = request.agent({
        'referer': params.url,
        'cookieDomain': 'douyu.com'
    }, opts)

    let info_url = `https://www.douyu.com/betard/${roomid}`
    let content_s = await agent
        .post(info_url)
        .set('referer', params.url)
    let json
    try {
        json = JSON.parse(content_s.text)
    } catch (err) {
        logger.info('fetch info error!')
        return []
    }
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
    }

    let signstr = sign(roomid, did, t)
    let pas = requestStrToMap(signstr)
    let streams = []
    for (let rate in vd_2_id) {
        let payload = {
            v: pas['v'],
            did: did,
            tt: t,
            sign: pas['sign'],
            cdn: 'gwbn',
            rate: rate,
            ver: 'Douyu_219101405',
            iar: 0,
            ive: 1
        }

        let info_api = `https://www.douyu.com/lapi/live/getH5Play/${roomid}`
        let content = await agent
            .post(info_api)
            .set('referer', params.url)
            .type('form')
            .send(payload)
        let vjson = JSON.parse(content.text)

        if (vjson['error'] != 0) {
            logger.debug(vjson['msg'])
            break;
        }

        let stream_id = vd_2_id[rate]
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