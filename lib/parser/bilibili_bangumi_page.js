'use strict';

const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
var crypto = require('crypto');
const { gunzip, mimeToExt, streamsSort } = require(path.join(__dirname, '../utils'))

const ids = ['mp4', 'flv360', 'flv480', 'hdmp4', 'flv720', 'flv720_p60', 'flv', 'hdflv2', 'flv_p60']
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

var APPKEY = '84956560bc028eb7'
var SECRETKEY = '94aba54af9065f71de72f5508f1cd42e'
var api_url = 'https://bangumi.bilibili.com/player/web_api/v2/playurl'

//https://www.bilibili.com/bangumi/play/ss26960
//https://api.bilibili.com/pgc/web/season/section?season_id=26960&season_type=1


var get_api_url = function(cid, qn, season_type) {
    let params_str = `appkey=${APPKEY}&cid=${cid}&module=bangumi&otype=json&player=0&qn=${qn}&season_type=${season_type}`
    return sign_api_url(api_url, params_str, SECRETKEY)
}

var sign_api_url = function(api_url, params_str, skey) {
    var md5 = crypto.createHash('md5')
    let sign = md5.update(params_str + skey).digest('hex')
    return `${api_url}?${params_str}&sign=${sign}`
}

var obtain_all_play_url = async function(params, opts) {
    logger.info("matching video info ")

    opts.httpCookies = opts.httpCookies || 'CURRENT_FNVAL=16'

    let content = await request.agent({ 'referer': params.url }, opts).get(params.url).proxy(opts['httpProxy'])
    let match = content.text.match(/__INITIAL_STATE__=(.*?);\(function\(\)\{var/iu)
    let v_json = JSON.parse(match[1])
    let epList = v_json['epList']
    logger.info("pn " + epList.length)

    let title = v_json['h1Title']
    logger.info("title " + title)

    let urls = []
    for (let item of epList) {
        urls.push('https://www.bilibili.com/bangumi/play/ep' + item['id'])
    }
    return urls
}
var exec = async function(params, opts) {
    logger.info("matching video info ")

    opts.httpCookies = opts.httpCookies || 'CURRENT_FNVAL=16'

    let content = await request.agent({ 'referer': params.url }, opts).get(params.url).proxy(opts['httpProxy'])
    let match = content.text.match(/__INITIAL_STATE__=(.*?);\(function\(\)\{var/iu)
    let v_json = JSON.parse(match[1])

    let title = v_json['h1Title']
    logger.info("title " + title)

    let cid = v_json['epInfo']['cid']
    logger.info("cid " + cid)
    if (cid == -1) {
        logger.info("please use --playlist to download list")
        return []
    }

    let userAgent = require(path.join(__dirname, '../util/userAgents')).get()

    match = content.text.match(/__playinfo__\s*=\s*(.*?)<\/script>/i)
    if (!match) {
        logger.info('fetch info fail')
        return []
    }
    v_json = JSON.parse(match[1])

    let streams = {}
    let audio_streams = {}
    if (v_json['data']['durl']) {
        let video = v_json['data']['durl'][0]
        let stream_id = 'all'
        let matched = video['url'].split('?')[0].match(/([^\.\/\\]+)\.([a-z]+)$/i)
        let ext = matched[2]
        streams[stream_id] = {
            "id": stream_id,
            "headers": {
                "referer": params.url,
                "user-agent": userAgent
            },
            'container': ext,
            'type': 'video',
            'format': ext,
            'isRemote': true,
            'src': [video['url']],
            'size': video['size']
        }
        return [{
            "title": title,
            "url": params.url,
            "streams": streamsSort(streams, ids)
        }]
    } else if (v_json['data']['dash']) {
        // when has cookie  CURRENT_FNVAL=16
        let audios = v_json['data']['dash']['audio']

        for (let audio of audios) {
            let stream_id = audio['id']
            audio_streams[stream_id] = {
                "id": stream_id,
                "headers": {
                    "referer": params.url,
                    "user-agent": userAgent
                },
                'container': mimeToExt(audio['mimeType'].split(';')[0]),
                'type': audio['mimeType'].split(';')[0].split('/')[0],
                'format': mimeToExt(audio['mimeType'].split(';')[0]),
                'isRemote': true,
                'src': [audio['base_url']]
            }
        }

        let videos = v_json['data']['dash']['video']
        for (let video of videos) {
            //+''+video['codecid'] // 存在重复id,但codecid不同
            let stream_id = video['id']
            streams[stream_id] = {
                "id": stream_id,
                "headers": {
                    "referer": params.url,
                    "user-agent": userAgent
                },
                'container': mimeToExt(video['mimeType'].split(';')[0]),
                'type': video['mimeType'].split(';')[0].split('/')[0],
                'format': mimeToExt(video['mimeType'].split(';')[0]),
                'resolution': video['width'] + 'x' + video['height'],
                'isRemote': true,
                'src': [video['base_url']]
            }
        }
        //["流畅 360P", "清晰 480P", "高清 720P", "高清 1080P", "高清 1080P+"]
        let sids = [16, 32, 64, 80, 112]
        return [{
            "title": title,
            "url": params.url,
            "streams": streamsSort(streams, sids),
            "audio_streams": audio_streams
        }]
    }


    // let mediaInfo = v_json['mediaInfo']
    //    let seasonType = mediaInfo['ssType']

    // for(let i in stream_types){
    // 	let st = stream_types[i]
    // 	let stream_id = st['id']

    // 	if(stream_id in streams){
    // 		continue
    // 	}

    // 	if(opts.streamFormat&&opts.streamFormat.toUpperCase()!=stream_id){
    // 		continue
    // 	}

    // 	let qn = st['quality']
    // 	let api_url = get_api_url(cid, qn, seasonType)

    // 	let vcontent = await request.agent({
    // 		'url':api_url,
    // 		'accept':'application/json; charset=utf8'
    // 	}, opts).get(api_url).proxy(opts['httpProxy'])

    // 	let vp_json = JSON.parse(vcontent.text)

    // 	logger.info(vp_json)
    // 	return []

    // 	stream_id = vp_json['format']
    // 	qn = vp_json['quality']

    // 	if(stream_id in streams){
    // 		continue
    // 	}

    // 	let urls = []
    // 	for(let i in vp_json['durl']){
    // 		let v = vp_json['durl'][i]
    // 		urls.push(v['url'])
    // 	}

    // 	streams[stream_id] = {
    // 		"id":stream_id,
    // 		"headers":{
    // 			"referer": params.url,
    // 			"user-agent": userAgent
    // 		},
    // 		'container': "flv", 
    // 		'quality': qn, 
    // 		'type':'video',
    // 		'format':'mp4', 
    //            'isRemote':true,
    // 		'src': urls
    // 	}
    // }

    // let streams_sorted = streams

    // logger.info("matching video completed ")
    // return [{
    // 	"title":title,
    // 	"url":params.url,
    // 	"merge":true,
    // 	"streams":streams_sorted
    // }]
}

exports = module.exports = { obtain_all_play_url, exec, vp: true }