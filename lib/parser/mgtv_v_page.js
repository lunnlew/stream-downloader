'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
const { getUrlExt, streamsSort, mapToRequestStr } = require(path.join(__dirname, '../utils'))
const g = require(path.join(__dirname, '../encrypt/mgtv_encrypt'))
const ids = ['1', '2', '3', '4']
const id_2_profile = { '1': '标清', '2': '高清', '3': '超清', '4': '蓝光' }

var obtain_all_play_url = async function(params, opts) {
    logger.info("matching playlist info ")
    let url_macth = params.url.match(/mgtv.com\/b\/([0-9]+)\/([0-9]+).html/iu)
    let vid = url_macth[2]
    logger.info("vid " + vid)

    let agent = request.agent({
        'referer': params.url,
        'cookieDomain': 'mgtv.com'
    }, opts)

    let info_url = `https://pcweb3.api.mgtv.com/episode/list?video_id=${vid}`
    console.log(info_url)
    let content_s = await agent
        .get(info_url)
        .set('referer', params.url)
    let json
    try {
        json = JSON.parse(content_s.text)
    } catch (err) {
        logger.info('fetch info error!')
        return []
    }

    let urls = []
    for (let v of json['data']['list']) {
        urls.push('https://www.mgtv.com' + v['url'])
    }
    logger.info("matching playlist completed ")
    return urls
}

var exec = async function(params, opts) {
    logger.info("matching info")
    let url_macth = params.url.match(/mgtv.com\/b\/([0-9]+)\/([0-9]+).html/iu)
    let vid = url_macth[2]
    logger.info("vid " + vid)
    let hid = url_macth[1]
    logger.info("hid " + hid)

    let agent = request.agent({ 'referer': params.url }, opts)

    let body = await agent.get(params.url).proxy(opts['httpProxy'])
    let match = body.text.match(/window\.VIDEOINFO\s*=\s*\{([^}]*?)\}/iu)

    let rid_match = match[1].match(/rid\s*:\s*"([^"]*)"/iu)
    let rid = rid_match[1]
    logger.info("rid " + rid)

    let title_match = match[1].match(/title\s*:\s*"([^"]*)"/iu)
    let title = title_match[1]
    logger.info("title " + title)

    let e = 1030
    let did = g.v4()
    let suuid = g.v4()
    let l = ~~(+new Date / 1e3)
    let tk2 = btoa("did=" + did + "|pno=" + e + "|ver=0.3.0301|clit=" + l).replace(/\+/g, "_").replace(/\//g, "~").replace(/=/g, "-").split("").reverse().join("")

    let rp1 = {
        did: did,
        suuid: suuid,
        cxid: '',
        tk2: tk2,
        video_id: vid,
        type: 'pch5',
        _support: 10000000
    }

    logger.info("tk2 " + tk2)

    let vurl = `https://pcweb.api.mgtv.com/player/video?` + mapToRequestStr(rp1)

    let content = await agent.get(vurl)
        .proxy(opts['httpProxy'])
    let json = JSON.parse(content.text)

    let pm2 = json['data']['atc']['pm2']
    logger.info("pm2 " + pm2)

    let rparams = {
        _support: 10000000,
        tk2: tk2,
        pm2: pm2,
        video_id: vid,
        type: 'pch5'
    }

    let surl = `https://pcweb.api.mgtv.com/player/getSource?` + mapToRequestStr(rparams)


    content = await agent.get(surl)
        .proxy(opts['httpProxy'])
    json = JSON.parse(content.text)
    let lu = json['data']['stream_domain'][0]

    let streams = []
    for (let sctl of json['data']['stream']) {
        if (sctl['url'] != '') {
            content = await agent.get(lu + sctl['url'])
                .proxy(opts['httpProxy'])
            json = JSON.parse(content.text)
            let stream_id = sctl['def']

            let parts = json['info'].split('?')[0].split('/')
            parts.pop()
            let preurl = parts.join('/')

            streams[stream_id] = {
                'id': stream_id,
                'video_profile': id_2_profile[stream_id],
                'container': 'm3u8',
                'src': [json['info']],
                'preurl': preurl,
                'enablePlain': true,
                'headers': {
                    'Referer': params.url
                },
                'type': 'video',
                'format': 'mp4',
                'isRemote': true
            }
        }
    }

    return [{
        "title": title,
        "url": params.url,
        "merge": true,
        "streams": streamsSort(streams, ids)
    }]

}
exports = module.exports = { obtain_all_play_url, exec, vp: true }