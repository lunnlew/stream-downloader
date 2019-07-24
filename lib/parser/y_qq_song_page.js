'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var iconv = require('iconv-lite')

var FORMATS = {
        'mp3-320': {'prefix': 'M800', 'ext': 'mp3', 'preference': 40, 'abr': 320},
        'mp3-128': {'prefix': 'M500', 'ext': 'mp3', 'preference': 30, 'abr': 128},
        'm4a-400': {'prefix': 'C400', 'ext': 'm4a', 'preference': 10},
        'm4a': {'prefix': 'C200', 'ext': 'm4a', 'preference': 10}
    }

var m_r_get_ruin = function(){
    var curMs = (new Date()).getTime() / 1000
    return parseInt(parseInt(Math.random() * 2147483647) * curMs % 1E10)
}
var exec = async function(params, opts){
	console.log("debug: matching audio info ")
	var body = await request.get(params.url)
	var songmid_match = body.match(/"songmid":"([a-zA-Z0-9]+)"/iu);
    var songmid = songmid_match[1]
    console.log("debug: songmid " + songmid)

    let url = `http://s.plcloud.music.qq.com/fcgi-bin/fcg_yqq_song_detail_info.fcg?songmid=${songmid}&play=0`
	let content = await request.get(url, null)
	content = iconv.decode(content, 'gb2312').toString()

	let json_match = content.match(/g_SongData =([^/]*);\//iu)
	let song_json = json_match[1]

	var songname_match = song_json.match(/songname:\s*'([^']+)'/iu);
    var songname = songname_match[1]
    console.log("debug: songname " + songname)

    // var publish_time_match = content.match(/发行时间：(\d{4}-\d{2}-\d{2})/iu);
    // var publish_time = publish_time_match[1]
    // console.log("debug: publish_time  " + publish_time)

    // var singer_match = song_json.match(/singer:\s*'([^']+)'/iu);
    // var singer = singer_match[1]
    // console.log("debug: singer  " + singer)

    // var lrc_content_match = content.match(/<div class="content" id="lrc_content"[^<>]*>([^<>]+)<\/div>/iu);
    // var lrc_content = lrc_content_match[1].replace('\\n','\n')
    // console.log("debug: lrc_content  " + lrc_content)

    // var albummid_match = song_json.match(/albummid:\s*'([^']+)'/iu);
    // var albummid = albummid_match[1]
    // console.log("debug: albummid " + albummid)

    // let thumbnail_url = `http://i.gtimg.cn/music/photo/mid_album_500/${albummid.slice(-2,-1)}/${albummid.slice(-1)}/${albummid}.jpg`
    // console.log("debug: thumbnail_url " + thumbnail_url)

  
    let streams = []
    let guid = m_r_get_ruin()

    let p_data = encodeURI(`{"req":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"guid":"${guid}","songmid":["${songmid}"],"songtype":[0],"uin":"0","loginflag":1,"platform":"20"}},"comm":{"uin":0,"format":"json","ct":24,"cv":0}}`)
    let dataurl = `https://u.y.qq.com/cgi-bin/musicu.fcg?-=getplaysongvkey1831442842044022&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&data=${p_data}`
	let musicdata = await request.get(dataurl)
	musicdata=JSON.parse(musicdata)
	if(musicdata['code']!=0){
		return []
	}

 // 	let keyurl = `http://base.music.qq.com/fcgi-bin/fcg_musicexpress.fcg?json=3&guid=${guid}`
	// let keycontent = await request.get(keyurl)
	// keycontent = keycontent.replace("jsonCallback(","").replace(');',"")
	// keycontent=JSON.parse(keycontent)
 //    let vkey = keycontent['key']
 //    console.log("debug: vkey " + vkey)
 //    for(let stream_id in FORMATS){
 //    	let stream = FORMATS[stream_id]
	// 	// let vkey_url = `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=${songmid}&filename=${stream['prefix']}${songmid}.${stream['ext']}&guid=${guid}`
	// 	// let vkey_content = await request.get(vkey_url)
	// 	// let vkey_json=JSON.parse(vkey_content)
	// 	// let vkey = vkey_json['data']['items'][0]['key']
 //    	streams[stream_id] = Object.assign({'id':stream_id},{
	// 		'audio_profile': stream_id, 
	// 		'container': stream['ext'], 
	// 		'src': [`http://dl.stream.qqmusic.qq.com/${stream['prefix']}${songmid}.${stream['ext']}?vkey=${vkey}&guid=${guid}&uin=0&fromtag=66`], 
	// 		'size' : 0,
	// 		'format' : stream_id, 
	// 		'preference' :stream['preference'],
	// 		'abr': stream['abr']
	// 	})
 //    }
    
 	let stream_id = 'm4a-400'
 	let stream = FORMATS[stream_id]
 	let vkey = musicdata['req']['data']['midurlinfo'][0]['vkey']
 	if(!vkey){
 		return []
 	}
 	streams[stream_id] = Object.assign({'id':stream_id},{
		'audio_profile': stream_id, 
		'container': stream['ext'], 
		'src': [`http://dl.stream.qqmusic.qq.com/${musicdata['req']['data']['midurlinfo'][0]['purl']}?vkey=${vkey}&guid=${guid}&uin=0&fromtag=66`], 
		'size' : 0,
		'format' : stream['ext'], 
		'preference' :stream['preference'],
		'abr': stream['abr']
	})
    var streams_sorted = [];
	for(let stream_id in FORMATS){
		if (stream_id in streams){
			streams_sorted[stream_id] = Object.assign({'id':stream_id},streams[stream_id])
		}
	}
    return [{
		"title":songname,
		"url":params.url,
		"merge":false,
		"streams":streams_sorted
	}]
}
exports = module.exports = {exec,vp:true}