'use strict';

const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {streamsSort} = require(path.join(__dirname,'../utils'))

const ids = ['150', '10000']
const id_2_profile = {'150':'高清', '10000':'原画'}

var getRandomString = function(e) {
    void 0 === e && (e = 36);
    for (var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz0123456789", i = t.length, n = [], o = 0; o < e; o++)
        n[o] = t.charAt(Math.floor(Math.random() * i));
    return 36 === e && (n[8] = n[13] = n[18] = n[23] = "-",
    n[14] = "4"),
    n.join("")
}

var exec = async function(params, opts){
	logger.info("matching video info ")

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
    logger.info('title '+ title)

	let cid = data['baseInfoRes']['data']['room_id'];
    logger.info('cid '+ cid)

    let api = 'https://api.live.bilibili.com/room/v1/Room/playUrl'

    let guid = getRandomString()
    logger.info('guid '+ guid)

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
		let l = vjson['data']['durl'][0]['url']
		if(sid == '10000'){
			l = l+'&pSession='+guid
		}
		streams[sid] = {
			"id":sid,
			'container': 'flv', 
			'src': [l], 
			'video_profile':id_2_profile[sid],
			'type':'video',
			'size' : 0, 
			'format' : 'mp4', 
            'isRemote':true
		}

    }
	
	logger.info("matching video completed ")
	return [{
		"title":title,
		"url":params.url,
		"streams":streamsSort(streams, ids)
	}]
}

exports = module.exports = {exec,vp:true}