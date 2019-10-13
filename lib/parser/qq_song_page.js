'use strict';
const path = require('path')
var request = require(path.join(__dirname, '../rq'));
var iconv = require('iconv-lite')

var FORMATS = {
    'mp3-128': { 'prefix': 'M500', 'ext': 'mp3', 'preference': 30, 'abr': 128 },
    'mp3-320': { 'prefix': 'M800', 'ext': 'mp3', 'preference': 40, 'abr': 320 },
    'm4a': { 'prefix': 'C200', 'ext': 'm4a', 'preference': 10 },
    'm4a-400': { 'prefix': 'C400', 'ext': 'm4a', 'preference': 10 }
}

var m_r_get_ruin = function() {
    var curMs = (new Date()).getTime() / 1000
    return parseInt(parseInt(Math.random() * 2147483647) * curMs % 1E10)
}
var exec = async function(params, opts) {
    logger.info("matching audio info ")
    var body = await request.get(params.url)
    var songmid_match = body.match(/"songmid":"([a-zA-Z0-9]+)"/iu);
    var songmid = songmid_match[1]
    logger.info("songmid " + songmid)

    let url = `http://s.plcloud.music.qq.com/fcgi-bin/fcg_yqq_song_detail_info.fcg?songmid=${songmid}&play=0`
    let content = await request.get(url, null)
    content = iconv.decode(content, 'gb2312').toString()

    let json_match = content.match(/g_SongData =([^/]*);\//iu)
    let song_json = json_match[1]

    var songname_match = song_json.match(/songname:\s*'([^']+)'/iu);
    var songname = songname_match[1]
    logger.info("songname " + songname)

    let streams = []
    let guid = m_r_get_ruin()

    let p_data = encodeURI(`{"req":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"guid":"${guid}","songmid":["${songmid}"],"songtype":[0],"uin":"0","loginflag":1,"platform":"20"}},"comm":{"uin":0,"format":"json","ct":24,"cv":0}}`)
    let dataurl = `https://u.y.qq.com/cgi-bin/musicu.fcg?-=getplaysongvkey1831442842044022&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&data=${p_data}`
    let musicdata = await request.get(dataurl, false, {
        "referer": params.url
    })
    musicdata = JSON.parse(musicdata)
    if (musicdata['code'] != 0) {
        logger.info('request error')
        return []
    }

    for (let stream_id in FORMATS) {
        let stream = FORMATS[stream_id]
        let vkey_url = `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=${songmid}&filename=${stream['prefix']}${songmid}.${stream['ext']}&guid=${guid}`
        let vkey_content = await request.get(vkey_url, false, {
            "referer": params.url
        })
        let vkey_json = JSON.parse(vkey_content)
        let music = vkey_json['data']['items'][0]
        if (music['subcode'] == 0) {
            streams[stream_id] = {
                'id': stream_id,
                'audio_profile': stream_id,
                'type': 'audio',
                'container': stream['ext'],
                'src': [`http://dl.stream.qqmusic.qq.com/${music['filename']}?vkey=${music['vkey']}&guid=${guid}&uin=0&fromtag=66`],
                'format': stream['ext'],
                'isRemote': true
            }
        }
    }
    return [{
        "title": songname,
        "url": params.url,
        "merge": false,
        "streams": streams
    }]
}
exports = module.exports = { exec, vp: true }