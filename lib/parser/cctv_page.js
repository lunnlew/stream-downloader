'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {getUrlExt, streamsSort} = require(path.join(__dirname,'../utils'))
const ids = ['lowChapters','chapters', 'chapters2', 'chapters3', 'chapters4']
const id_2_profile = {'lowChapters':'320x180_200kb/s', 'chapters':'480x270_450kb/s', 'chapters2': '640x360_850kb/s','chapters3': '1280x720_1200kb/s', 'chapters4': '1280x720_2000kb/s'}

var exec = async function(params, opts){
	console.log("debug: matching info")
	let body = await request.agent({'url':params.url}, opts).get(params.url).proxy(opts['httpProxy'])
	let match = body.text.match(/videoCenterId","(\w+)"/iu)
	let videoCenterId = match[1]
	console.log('debug: videoCenterId '+videoCenterId)

	let url = `http://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid=${videoCenterId}`
	body = await request.agent({'url':url}, opts).get(url).proxy(opts['httpProxy'])
	let v_json = JSON.parse(body.text)
	let title = v_json['title']
	let streams = {}
	for(let stream_id of ids){
		let duration = v_json['video']['totalLength']
		if(stream_id in v_json['video']){
			let vs = v_json['video'][stream_id]
			let urls = []
    		let ext = getUrlExt(vs[0]['url'])
			for(let v of vs){
				urls.push(v['url'])
			}
			streams[stream_id] = {
				"id":stream_id,
				'duration':duration,
				'container': ext, 
				'type':'video',
				'format':ext,
	            'isRemote':true,
	            'video_profile':id_2_profile[stream_id],
				'src': urls,
				"merge":true,
				'size':0
			}
		}
	}

    return [{
		"title":title,
		"url":params.url,
		"streams":streamsSort(streams, ids)
	}]
}
exports = module.exports = {exec, vp:true}