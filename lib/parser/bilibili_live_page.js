'use strict';

const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {streamsSort} = require(path.join(__dirname,'../utils'))

const ids = ['150', '10000']
const id_2_profile = {'150':'高清', '10000':'原画'}

var exec = async function(params, opts){
	console.log("debug: matching video info ")

	let agent  = request.agent({
        'referer':params.url,
        'cookieDomain':'bilibili.com'
    }, opts)

	let body = await agent
		.get(params.url)
    	.proxy(opts['httpProxy'])

	let match = body.text.match(/<script>\s*window\.__NEPTUNE_IS_MY_WAIFU__=(.*?)<\/script>/iu)
	let data = JSON.parse(match[1])

	let title = data['baseInfoRes']['data']['title'];
    console.log('debug: title '+ title)

	let cid = data['baseInfoRes']['data']['room_id'];
    console.log('debug: cid '+ cid)

    let api = 'https://api.live.bilibili.com/room/v1/Room/playUrl'

    let streams = {}

    for(let sid of ids){
    	let url = api + `?cid=${cid}&qn=${sid}&platform=web`

    	if(sid in streams){
			continue
		}

		if(opts.streamFormat&&opts.streamFormat.toUpperCase()!=sid){
			continue
		}

    	body = await agent
			.get(url)
	    	.proxy(opts['httpProxy'])
		let vjson = JSON.parse(body.text)
		streams[sid] = {
			"id":sid,
			'container': 'flv', 
			'src': [vjson['data']['durl'][0]['url']], 
			'video_profile':id_2_profile[sid],
			'type':'video',
			'size' : 0, 
			'format' : 'mp4', 
            'isRemote':true
		}

    }
	
	console.log("debug: matching video completed ")
	return [{
		"title":title,
		"url":params.url,
		"streams":streamsSort(streams, ids)
	}]
}

exports = module.exports = {exec,vp:true}