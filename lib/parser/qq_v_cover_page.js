'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
const { mapToRequestStr } = require(path.join(__dirname, '../utils'))
const { getCkeyV91, createGUID } = require(path.join(__dirname, '../encrypt/qq_video_encrypt_9.1'))

const ids = ['SD', 'HD', 'SHD', 'FHD']
// const vd_2_id = {10703: 'SD', 10712: 'HD', 10701:'SHD'}
const vd_2_id = { 321001: 'SD', 321002: 'HD', 321003: 'SHD', 321004: 'FHD' }
const id_2_profile = { 'SD': '标清;(270P)', 'HD': '高清;(480P)', 'SHD': '超清;(720P)', 'FHD': '蓝光;(1080P)' }

var getvinfoparam = function (option, opts) {
    // 从cookies中解析参数
    let cookies_str = opts.httpCookies || ''
    let cookies = cookies_str.split("; ")
    let cps = {}
    cookies.forEach(function (item) {
        let s = item.split("=")
        cps[s[0]] = s[1]
    })

    let logintoken = {
        "main_login": cps['main_login'],
        "openid": cps['vqq_openid'],
        "appid": cps['vqq_appid'],
        "access_token": cps['vqq_access_token'],
        "vuserid": cps['vqq_vuserid'],
        "vusession": cps['vqq_vusession']
    }
    let t = Math.round(new Date().getTime() / 1000)
    let platform = 10201
    let sdtfrom = 'v1010'
    let encryptVer = '9.1'
    let appVer = '3.5.57'
    let guid = createGUID()
    let flowid = createGUID() + '_' + platform

    let params = {
        'charge': '0',
        'defaultfmt': 'auto',
        'otype': 'ojson',
        'guid': guid,
        'flowid': flowid,
        'platform': platform.toString(),
        'sdtfrom': sdtfrom,
        'defnpayver': '1',
        'appVer': appVer,
        'host': 'v.qq.com',
        'ehost': option['url'],
        'refer': 'v.qq.com',
        'sphttps': '1',
        'tm': t.toString(),
        'spwm': '4',
        'logintoken': cps['vqq_openid'] ? JSON.stringify(logintoken) : '',
        'vid': option['vid'],
        'defn': option['streamFormat'].toLowerCase(),
        'fhdswitch': '1',
        'show1080p': '1',
        'isHLS': '1',
        'onlyGetinfo': 'true',
        'dtype': '3',
        'sphls': '2',
        'spgzip': '1',
        'dlver': '2',
        'drm': '32',
        'hdcp': '0',
        'spau': '1',
        'spaudio': '15',
        'defsrc': '2',
        'encryptVer': encryptVer,
        'cKey': getCkeyV91(platform, appVer, option['vid'], "", guid, t),
        'fp2p': '1',
        'spadseg': '1',
        'adsid': '',
        'adpinfo': ''
    }
    return params
}

var getckeyparam = function (option, opts) {
    // 从cookies中解析参数
    let cookies_str = opts.httpCookies || ''
    let cookies = cookies_str.split("; ")
    let cps = {}
    cookies.forEach(function (item) {
        let s = item.split("=")
        cps[s[0]] = s[1]
    })

    let logintoken = {
        "main_login": cps['main_login'],
        "openid": cps['vqq_openid'],
        "appid": cps['vqq_appid'],
        "access_token": cps['vqq_access_token'],
        "vuserid": cps['vqq_vuserid'],
        "vusession": cps['vqq_vusession']
    }
    let t = Math.round(new Date().getTime() / 1000)
    let platform = 10201
    let sdtfrom = 'v1010'
    let encryptVer = '9.1'
    let appVer = '3.5.57'
    let guid = createGUID()
    let flowid = createGUID() + '_' + platform

    let params = {
        'otype': 'ojson',
        'platform': platform.toString(),
        'appVer': appVer,
        'sdtfrom': sdtfrom,
        'charge': '0',
        'linkver': '2',
        'encryptVer': encryptVer,
        'format': option['format'],
        'vid': option['vid'],
        'filename': '',
        'vt': '',
        'guid': guid,
        'flowid': flowid,
        'lnk': '',
        'tm': '',
        'refer': option['url'],
        'ehost': option['url'],
        'logintoken': cps['vqq_openid'] ? JSON.stringify(logintoken) : '',
        'cKey': ''
    }
    return params
}


var get_all_vkey = async function (ckeyparam, filenames, preurl, vts, opts) {

    let t = Math.round(new Date().getTime() / 1000)
    let vkeys = []
    for (let i in filenames) {
        let new_ckeyparam = {
            'format': ckeyparam['format'],
            'vid': ckeyparam['vid'],
            'filename': filenames[i],
            'vt': vts[i],
            'guid': ckeyparam['guid'],
            'flowid': ckeyparam['guid'],
            'lnk': ckeyparam['lnk'],
            'tm': t,
            'refer': preurl + filenames[i],
            'ehost': preurl + filenames[i],
            'logintoken': ckeyparam['logintoken'],
            'cKey': getCkeyV91(ckeyparam['platform'], ckeyparam['appVer'], ckeyparam['vid'], "", ckeyparam['guid'], t)
        }
        new_ckeyparam = Object.assign({}, ckeyparam, new_ckeyparam)

        let agent = request.agent({
            'referer': new_ckeyparam.refer,
            'cookieDomain': 'qq.com'
        }, opts)

        let payload = {
            'buid': 'onlyvkey',
            'vkeyparam': mapToRequestStr(new_ckeyparam)
        }
        let content = await agent
            .post('https://vd.l.qq.com/proxyhttp')
            .set('referer', new_ckeyparam.refer)
            .set('accept', 'application/json; charset=utf8')
            .send(JSON.stringify(payload))
            .buffer(true).parse(function (res, fn) {
                res.text = ""
                res.setEncoding("utf-8");
                res.on("data", function (chunk) {
                    res.text += chunk.toString()
                })
                res.on("end", function () {
                    fn(null, res)
                })
            })
            .proxy(opts['httpProxy'])
        let video_json = JSON.parse(content.text)
        let vkey_json = JSON.parse(video_json['vkey'])
        let vkey = vkey_json['key']
        vkeys.push(vkey)
    }
    return vkeys
}

var exec = async function (params, opts) {
    logger.info("matching video info ")

    let agent = request.agent({
        'referer': params.url,
        'cookieDomain': 'qq.com'
    }, opts)


    var body = await agent.get(params.url)
        .proxy(opts['httpProxy'])

    var vid_match = body.text.match(/"vid":"([a-z0-9]+)"/iu);
    var vid = vid_match[1]
    logger.info("vid " + vid)

    var info_match = body.text.match(/VIDEO_INFO\s*=\s*\{(.*)video_uploadTime"/iu);

    var title_match = info_match[1].match(/"title":\s*"([^"]*)"/iu)
    var title = title_match[1]
    logger.info("title " + title)

    var streams = []
    var streams_sorted = []
    var can_download = false
    try {

        for (let part_format_id in vd_2_id) {
            logger.info('part_format_id ' + part_format_id)
            let stream_id = vd_2_id[part_format_id]
            if (stream_id in streams) {
                continue
            }
            if (opts.streamFormat && opts.streamFormat.toUpperCase() != stream_id) {
                continue
            }
            let payload = {
                'buid': 'onlyvinfo',
                'vinfoparam': mapToRequestStr(getvinfoparam({
                    'vid': vid,
                    'url': params.url,
                    'streamFormat': stream_id
                }, opts))
            }
            let content = await agent
                .post('https://vd.l.qq.com/proxyhttp')
                .set('referer', params.url)
                .set('accept', 'application/json; charset=utf8')
                .send(JSON.stringify(payload))
                .buffer(true).parse(function (res, fn) {
                    res.text = ""
                    res.setEncoding("utf-8");
                    res.on("data", function (chunk) {
                        res.text += chunk.toString()
                    })
                    res.on("end", function () {
                        fn(null, res)
                    })
                })
                .proxy(opts['httpProxy'])

            let video_json = JSON.parse(content.text)
            if (video_json.errCode == 0) {
                video_json = JSON.parse(video_json['vinfo'])
                // 视频是否可下载
                if (video_json['s'] == "f") {
                    logger.info("video " + video_json['msg'])
                    can_download = false
                } else {
                    can_download = true
                }
                if (can_download) {
                    title = video_json['vl']['vi'][0]['ti']
                    let fn_pre = video_json['vl']['vi'][0]['lnk']
                    let host = video_json['vl']['vi'][0]['ul']['ui'][0]['url']
                    let seg_cnt = video_json['vl']['vi'][0]['fc']
                    let filename = video_json['vl']['vi'][0]['fn']

                    let fc_cnt = seg_cnt

                    let magic_str = ""
                    let video_type = ""
                    let fparts = []
                    if (seg_cnt == 0) {
                        seg_cnt = 1
                    } else {
                        fparts = filename.split('.')
                        fn_pre = fparts[0]
                        magic_str = fparts[1]
                        video_type = fparts[2]
                    }

                    let keyid = video_json['vl']['vi'][0]['keyid'] || video_json['vl']['vi'][0]['cl']['keyid'] || video_json['vl']['vi'][0]['cl']['ci'][0]['keyid']
                    logger.info("keyid " + keyid)
                    let real_format_id = keyid.split('.')[1]

                    if (vd_2_id[real_format_id] in streams) {
                        continue
                    } else {
                        part_format_id = real_format_id
                    }
                    let drm = video_json['vl']['vi'][0]['drm']
                    if (drm) {
                        logger.error("drm " + drm)
                        break
                    }

                    if (video_json['vl']['vi'][0]['ul']['m3u8']) {
                        logger.info("has m3u8")
                        let vi = video_json['vl']['vi']
                        let preurl = vi[0]['ul']['ui'][0]['url']
                        let parts = preurl.split('/')
                        parts.pop()
                        preurl = parts.join('/')
                        streams[stream_id] = Object.assign({ 'id': stream_id }, {
                            'video_profile': id_2_profile[stream_id],
                            'container': 'm3u8',
                            'src': [vi[0]['ul']['m3u8']],
                            'preurl': preurl,
                            'isRemote': false,
                            'format': 'mp4',
                            'type': 'video'
                        })

                        if (vi[0]['ul']['m3u8'].indexOf('#EXT-X-STREAM-INF') > -1) {
                            let dataurls = await require(path.join(__dirname, '../util/UrlExtractorFromM3U8')).parseStreams(vi[0]['ul']['m3u8'], streams[stream_id])
                            streams[stream_id]['src'] = [dataurls[0]['url']]
                            streams[stream_id]['isRemote'] = true
                        }
                    } else if (video_json['vl']['vi'][0]['ul']['ui'][0]['hls']) {
                        logger.info("has hls")
                        let pt = video_json['vl']['vi'][0]['ul']['ui'][0]['hls']['pt']
                        if (pt == '') {
                            logger.info("not valid source")
                            continue
                        }
                        let vurl = `${host}${pt}`
                        logger.info("vurl " + vurl)

                        let vi = video_json['vl']['vi']
                        let preurl = vi[0]['ul']['ui'][0]['url']
                        let parts = preurl.split('/')
                        parts.pop()
                        preurl = parts.join('/')

                        streams[stream_id] = Object.assign({ 'id': stream_id }, {
                            'video_profile': id_2_profile[stream_id],
                            'container': 'm3u8',
                            'preurl': preurl,
                            'src': [vurl],
                            'format': 'mp4',
                            'type': 'video',
                            'isRemote': true
                        })
                    } else if (video_json['vl']['vi'][0]['ul']['ui'][0]['url']) {
                        logger.info("has url")
                        let vi = video_json['vl']['vi']
                        let preurl = vi[0]['ul']['ui'][0]['url']
                        let ci = vi[0]['cl']['ci']
                        let urls = []
                        let filenames = []
                        let vts = []
                        for (let i in ci) {
                            filenames.push([fn_pre, magic_str, (parseInt(i) + 1), video_type].join('.'))
                            vts.push(vi[0]['ul']['ui'][i]['vt'])
                        }
                        let vkeys = await get_all_vkey(
                            getckeyparam({
                                'vid': vid,
                                'format': part_format_id
                            }, opts),
                            filenames, preurl, vts, opts)

                        for (let i in ci) {
                            let vname = [fn_pre, magic_str, (parseInt(i) + 1), video_type].join('.')
                            vts.push(vi[0]['ul']['ui'][i]['vt'])
                            let vurl = preurl + vname + '?vkey=' + vkeys[i]
                            logger.info("vurl " + vurl)
                            urls.push(vurl)
                        }
                        streams[stream_id] = Object.assign({ 'id': stream_id }, {
                            'video_profile': id_2_profile[stream_id],
                            'container': 'mp4',
                            'src': urls,
                            'isRemote': true,
                            'format': video_type,
                            'type': 'video'
                        })
                    } else {
                        logger.info("not source")
                    }
                }
            }
        }
    } catch (err) {
        logger.info(err)
    }

    logger.info("matching video completed ")

    for (let index in ids) {
        let stream_id = ids[index]
        if (stream_id in streams) {
            streams_sorted[stream_id] = Object.assign({ 'id': stream_id }, streams[stream_id])
        }
    }

    return [{
        "title": title,
        "url": params.url,
        "merge": true,
        "streams": streams_sorted
    }]
}

exports = module.exports = { exec, vp: true }