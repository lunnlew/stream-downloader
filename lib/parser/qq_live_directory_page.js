'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))

var exec = async function(params, opts) {
    logger.info("matching info")
    let url_macth = params.url.match(/live.qq.com\/directory\/match\/([0-9]+)/iu)
    let game_id = url_macth[1]
    logger.info("game_id " + game_id)
    let api_endpoint = `https://live.qq.com/game/game_details/get_game_details_info/${game_id}`
    let content = await request.agent(Object.assign({}, params, { 'url': api_endpoint }), opts)
        .post(api_endpoint)
    let v_json = JSON.parse(content.text)
    let room_id
    let title = ''
    if (v_json['error'] == 0) {
        let rooms = v_json['data']['anchor_data']
        for (let i in rooms) {
            room_id = rooms[i]['room_id']
            title = rooms[i]['room_name']
            break
        }
    }
    if (!room_id) {
        return []
    }
    logger.info("room_id " + room_id)
    api_endpoint = `http://www.qie.tv/api/v1/room/${room_id}`
    content = await request.agent(Object.assign({}, params, { 'url': api_endpoint }), opts)
        .post(api_endpoint)
    v_json = JSON.parse(content.text)
    let streams = []
    if (v_json['error'] == 0) {
        title = v_json['data']['room_name']
        let rtmp_url = v_json['data']['rtmp_url']
        if (rtmp_url != '') {
            streams['normal'] = {
                "id": 'normal',
                'container': "flv",
                'type': 'video',
                'format': 'flv',
                'isRemote': true,
                'src': [rtmp_url + '/' + v_json['data']['rtmp_live']]
            }
            for (let stream_id in v_json['data']['rtmp_multi_bitrate']) {
                let stream_url = v_json['data']['rtmp_multi_bitrate'][stream_id]
                streams[stream_id] = {
                    "id": stream_id,
                    'container': "flv",
                    'type': 'video',
                    'format': 'flv',
                    'isRemote': true,
                    'src': [rtmp_url + '/' + stream_url]
                }
            }
        } else {
            logger.info('not live try recent vod video')
            api_endpoint = `https://m.live.qq.com/${room_id}`
            content = await request.agent(Object.assign({}, params, { 'url': api_endpoint }), opts)
                .set('user-agent', 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Mobile Safari/537.36')
                .get(api_endpoint)
            let match = content.text.match(/window.\$ROOM_INFO\s*=\s*(.*?);/iu)
            v_json = JSON.parse(match[1])
            let room_videos = v_json['room_video']
            let video_url = 'https://live.qq.com/video/v'
            let urls = []
            // 取得最近的直播回放视频
            for (let i in room_videos) {
                let video = room_videos[i]
                urls.push(video_url + '/' + video.id)
                break
            }
            streams['all'] = {
                "id": 'all',
                'container': "flv",
                'type': 'video',
                'format': 'flv',
                'isDispatch': true,
                'src': urls
            }
        }
    }
    return [{
        "title": title,
        "url": params.url,
        "streams": streams
    }]
}
exports = module.exports = { exec, vp: true }