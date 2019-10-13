'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
const { getUrlExt, streamsSort } = require(path.join(__dirname, '../utils'))
const ids = ['hls', 'lowChapters', 'chapters', 'chapters2', '4000', 'chapters3', '8000', 'chapters4']
const id_2_profile = { 'hls': 'simple', 'lowChapters': '320x180_200kb/s', 'chapters': '480x270_450kb/s', 'chapters2': '640x360_850kb/s', '4000': '720p', 'chapters3': '1280x720_1200kb/s', '8000': '1080p', 'chapters4': '1280x720_2000kb/s' }

var exec = async function(params, opts) {
    logger.info("matching info")
    let body = await request.agent({ 'referer': params.url }, opts).get(params.url).proxy(opts['httpProxy'])

    // 普通
    let match = body.text.match(/videoCenterId","(\w+)"/iu)

    let videoCenterId = ''
    if (match) {
        videoCenterId = match[1]
    }

    let videoType = 'simple'
    if (!videoCenterId) {
        // 4k
        match = body.text.match(/guid\s*=\s*"(\w+)"/iu)
        if (match) {
            videoCenterId = match[1]
        }
    }
    logger.info('videoCenterId ' + videoCenterId)

    match = body.text.match(/videoType\s*=\s*"(\w+)"/iu)
    if (match) {
        videoType = match[1]
    }
    logger.info('videoType ' + videoType)

    let url = `http://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid=${videoCenterId}`
    body = await request.agent({ 'referer': url }, opts).get(url).proxy(opts['httpProxy'])
    let v_json = JSON.parse(body.text)


    let title = v_json['title']
    let duration = v_json['video']['totalLength']
    let streams = {}
    let audio_streams = {}

    if (videoType == 'cctv4k') {
        let def = ['4000', '8000']
        for (let stream_id of def) {
            streams[stream_id] = {
                "id": stream_id,
                'duration': duration,
                'container': 'm3u8',
                'type': 'video',
                'format': 'mp4',
                'isRemote': true,
                'video_profile': '4k' + '_hls' + stream_id,
                'src': [v_json['hls_url'].replace(/main/g, stream_id)],
                "merge": true,
                'size': 0
            }
        }
    } else {
        streams['hls'] = {
            "id": 'hls',
            'duration': duration,
            'container': 'm3u8',
            'type': 'video',
            'format': 'mp4',
            'isRemote': true,
            'video_profile': id_2_profile['hls'],
            'src': [v_json['hls_url']],
            "merge": true,
            'size': 0
        }
    }

    // audio_streams['hls'] = {
    // 	"id":'hls',
    // 	'duration':duration,
    // 	'container': getUrlExt(v_json['manifest']['audio_mp3']), 
    // 	'type':'audio',
    // 	'format':getUrlExt(v_json['manifest']['audio_mp3']),
    //        'isRemote':true,
    //        'video_profile':id_2_profile['hls'],
    // 	'src': [v_json['manifest']['audio_mp3']],
    // 	'size':0
    // }
    for (let stream_id of ids) {
        if (stream_id in v_json['video']) {
            let vs = v_json['video'][stream_id]
            let urls = []
            let ext = getUrlExt(vs[0]['url'])
            for (let v of vs) {
                urls.push(v['url'])
            }
            streams[stream_id] = {
                "id": stream_id,
                'duration': duration,
                'container': ext,
                'type': 'video',
                'format': ext,
                'isRemote': true,
                'video_profile': id_2_profile[stream_id],
                'src': urls,
                "merge": true,
                'size': 0
            }
        }
    }

    return [{
        "title": title,
        "url": params.url,
        "streams": streamsSort(streams, ids)
    }]
}
exports = module.exports = { exec, vp: true }