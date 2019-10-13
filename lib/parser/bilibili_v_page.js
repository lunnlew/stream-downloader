'use strict';

const path = require('path')
var request = require(path.join(__dirname, '../rq'));
const { streamsSort } = require(path.join(__dirname, '../utils'))
var crypto = require('crypto');
var zlib = require('zlib');
var stream_types = [
    { 'id': 'mp4', 'container': 'FLV', 'quality': 0 },
    { 'id': 'flv360', 'quality': 16, 'audio_quality': 30216, 'container': 'FLV', 'video_profile': '360p', 'desc': '流畅 360P' },
    { 'id': 'flv480', 'quality': 32, 'audio_quality': 30280, 'container': 'FLV', 'video_profile': '480p', 'desc': '清晰 480P' },
    { 'id': 'hdmp4', 'quality': 48, 'audio_quality': 30280, 'container': 'MP4', 'video_profile': '720p', 'desc': '高清 720P (MP4)' },
    { 'id': 'flv720', 'quality': 64, 'audio_quality': 30280, 'container': 'FLV', 'video_profile': '720p', 'desc': '高清 720P' },
    { 'id': 'flv720_p60', 'quality': 74, 'audio_quality': 30280, 'container': 'FLV', 'video_profile': '720p', 'desc': '高清 720P60' },
    { 'id': 'flv', 'quality': 80, 'audio_quality': 30280, 'container': 'FLV', 'video_profile': '1080p', 'desc': '高清 1080P' },
    { 'id': 'hdflv2', 'quality': 112, 'audio_quality': 30280, 'container': 'FLV', 'video_profile': '1080p', 'desc': '高清 1080P+' },
    { 'id': 'flv_p60', 'quality': 116, 'audio_quality': 30280, 'container': 'FLV', 'video_profile': '1080p', 'desc': '高清 1080P60' }
]
var APPKEY = 'iVGUTjsxvpLeuDCf'
var SECRETKEY = 'aHRmhWMLkdeMuILqORnYZocwMBpMEOdt'
var api_url = 'https://interface.bilibili.com/v2/playurl'



var gunzip = function(content) {
    return new Promise((resolve, reject) => {
        zlib.gunzip(content, function(err, dezipped) {
            resolve(dezipped.toString())
        })
    })
}
var get_api_url = function(cid, qn) {
    let params_str = `appkey=${APPKEY}&cid=${cid}&otype=json&player=0&qn=${qn}`
    return sign_api_url(api_url, params_str, SECRETKEY)
}

var sign_api_url = function(api_url, params_str, skey) {
    var md5 = crypto.createHash('md5')
    let sign = md5.update(params_str + skey).digest('hex')
    return `${api_url}?${params_str}&sign=${sign}`
}
var obtain_all_play_url = async function(params, opts) {
    logger.info("matching video info ")
    let content = await request.get(params.url, null, {
        "referer": params.url,
        "cookie": "CURRENT_FNVAL=16;",
        'Accept-Encoding': 'gzip'
    })
    content = await gunzip(content)
    let match = content.match(/__INITIAL_STATE__=(.*?);\(function\(\)\{var/iu)
    let v_json = JSON.parse(match[1])
    let pn = v_json['videoData']['videos']
    logger.info("pn " + pn)

    let title = v_json['videoData']['title']
    logger.info("title " + title)

    let i = 1
    let urls = []
    let streams = {}
    do {
        urls.push(params.url + '/?p=' + i)
        i++
    } while (i <= pn)

    return urls
}
var exec = async function(params, opts) {
    logger.info("matching video info ")

    let url_macth = params.url.match(/\?p=([0-9]+)/iu)
    let pageN = 1
    if (url_macth && url_macth[1]) {
        pageN = url_macth[1]
    }
    logger.info("debug pageN " + pageN)

    let content = await request.get(params.url, null, {
        "referer": params.url,
        "cookie": "CURRENT_FNVAL=16;",
        'Accept-Encoding': 'gzip'
    })
    content = await gunzip(content)
    let match = content.match(/__INITIAL_STATE__=(.*?);\(function\(\)\{var/iu)
    let v_json = JSON.parse(match[1])

    let title = v_json['videoData']['title']

    let avid = v_json['aid']
    logger.info("avid " + avid)

    let cid = v_json['videoData']['cid']

    for (let paged of v_json['videoData']['pages']) {
        if (paged['page'] == pageN) {
            title = paged['part']
            cid = paged['cid']
        }
    }

    logger.info("title " + title)
    logger.info("cid " + cid)

    let streams = {}
    for (let i in stream_types) {
        let st = stream_types[i]
        let stream_id = st['id']

        if (stream_id in streams) {
            continue
        }

        if (opts.streamFormat && opts.streamFormat.toUpperCase() != stream_id) {
            continue
        }

        let qn = st['quality']
        let api_url = get_api_url(cid, qn)
        let vcontent = await request.get(api_url, null, {
            "referer": "https://www.bilibili.com/",
            'Accept-Encoding': 'gzip'
        })
        vcontent = await gunzip(vcontent)
        let vp_json = JSON.parse(vcontent)

        stream_id = vp_json['format']
        qn = vp_json['quality']

        if (stream_id in streams) {
            continue
        }

        let urls = []
        for (let i in vp_json['durl']) {
            let v = vp_json['durl'][i]
            urls.push(v['url'])
        }

        streams[stream_id] = {
            "id": stream_id,
            "headers": {
                "referer": params.url,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
            },
            'container': "flv",
            'quality': qn,
            'type': 'video',
            'isRemote': true,
            'format': 'mp4',
            'src': urls
        }
    }
    //["流畅 360P", "清晰 480P", "高清 720P", "高清 1080P", "高清 1080P+"]
    let sids = [16, 32, 64, 80, 112]

    let streams_sorted = streamsSort(streams, sids)

    logger.info("matching video completed ")
    return [{
        "title": title,
        "url": params.url,
        "merge": false,
        "streams": streams_sorted
    }]
}

exports = module.exports = { obtain_all_play_url, exec, vp: true }