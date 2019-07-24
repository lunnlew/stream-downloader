'use strict';
// 下载速度较慢

const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var crypto = require('crypto');
const stream_types = [
        {'id': '4k', 'container': 'm3u8', 'video_profile': '4k'},
        {'id': 'BD', 'container': 'm3u8', 'video_profile': '1080p'},
        {'id': 'TD', 'container': 'm3u8', 'video_profile': '720p'},
        {'id': 'TD_H265', 'container': 'm3u8', 'video_profile': '720p H265'},
        {'id': 'HD', 'container': 'm3u8', 'video_profile': '540p'},
        {'id': 'HD_H265', 'container': 'm3u8', 'video_profile': '540p H265'},
        {'id': 'SD', 'container': 'm3u8', 'video_profile': '360p'},
        {'id': 'LD', 'container': 'm3u8', 'video_profile': '210p'},
    ]
const ids = ['4k','BD', 'TD', 'HD', 'SD', 'LD']
const vd_2_id = {10: '4k', 19: '4k', 5:'BD', 18: 'BD', 21: 'HD_H265', 2: 'HD', 4: 'TD', 17: 'TD_H265', 96: 'LD', 1: 'SD', 14: 'TD'}
const id_2_profile = {'4k':'4k', 'BD': '1080p','TD': '720p', 'HD': '540p', 'SD': '360p', 'LD': '210p', 'HD_H265': '540p H265', 'TD_H265': '720p H265'}

var getVMS = async function(tvid, vid){
    console.log("debug: compute sc")
	var t =  (new Date()).getTime().toString()
	var src = '76f90cbd92f94a2e925d83e8ccd22cb7'
    var key = 'd5fb4bd9d50c4be6948c97edd7254b0e'
    var md5 = crypto.createHash('md5')
    var sc = md5.update(t + key  + vid).digest('hex')
    var url = `http://cache.m.iqiyi.com/tmts/${tvid}/${vid}/?t=${t}&sc=${sc}&src=${src}`
    var content = await request.get(url)
	return JSON.parse(content)
}
var exec = async function(params, opts){
    console.log("debug: matching video info ")
	let body = await request.get(params.url)
	let tvid_match = body.match(/"tvId":([a-z0-9]+)/iu)
    let tvid = tvid_match[1]
    console.log("debug: tvid " + tvid)

    let vid_match = body.match(/"vid":"([a-z0-9]+)"/iu)
    let vid = vid_match[1]
    console.log("debug: vid " + vid)


    let url = 'http://pcw-api.iqiyi.com/video/video/playervideoinfo?tvid=' + tvid
    let content = await request.get(url)
	let info_u = JSON.parse(content)
	let info = await getVMS(tvid, vid)
	let streams = {}
	if(info['code']!="A00000"){
		console.log("debug: error "+info['ctl']['msg'])
		return []
	}

	for(let i in info['data']['vidl']){
		let item = info['data']['vidl'][i]
		let stream_id = vd_2_id[item['vd']]
		if(stream_id in streams){
			continue
		}
		if(opts.streamId&&opts.streamId.toUpperCase()!=stream_id){
			continue
		}
		let stream_profile = id_2_profile[stream_id]
		streams[stream_id] = {
			'video_profile': stream_profile, 
			'container': 'm3u8', 
			'src': [item['m3utx']], 
			'size' : 0, 
			'format' : 'mp4', 
			'screenSize': item['screenSize']
		}
	}
	
	let streams_sorted = []
	for(let index in stream_types){
		let stream_id = stream_types[index]['id']
		if (stream_id in streams){
			streams_sorted[stream_id] = Object.assign({'id':stream_id},streams[stream_id])
		}
	}
	console.log("debug: matching video completed ")
	return [{
		"title":info_u['data']['vn'],
		"url":params.url,
		"merge":false,
		"streams":streams_sorted
	}]
}
exports = module.exports = {exec,vp:true}