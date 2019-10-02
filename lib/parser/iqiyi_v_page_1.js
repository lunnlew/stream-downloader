'use strict';

const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
var crypto = require('crypto');
const {parse_vf} = require(path.join(__dirname,'../encrypt/iqiyi_encrypt_1'))
const {getUrlExt, streamsSort, mapToRequestStr} = require(path.join(__dirname,'../utils'))
const ids = ['100', '200', '300', '500', '600']
const id_2_profile = {'100':'急速', '200':'流畅', '300':'高清', '500': '720p', '600':'1080p'}

var getMacID = function() {
	let macID = ""
	let chars = [ "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "n", "m", "o", "p", "q", "r", "s", "t", "u", "v","w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
	for(let i = 0; i < 32; i++){
		macID += chars[Math.floor(Math.random()*chars.length)]
	}
	return macID
}

var exec = async function(params, opts){
    console.log("debug: matching video info ")
    let agent  = request.agent({
        'referer':params.url,
        'cookieDomain':'iqiyi.com'
    }, opts)

	let body = await agent.get(params.url)
    	.proxy(opts['httpProxy'])
	body = body.text
	let tvid_match = body.match(/"tvId":([a-z0-9]+)/iu)
    let tvid = tvid_match[1]
    console.log("debug: tvid " + tvid)

    let vid_match = body.match(/"vid":"([a-z0-9]+)"/iu)
    let vid = vid_match[1]
    console.log("debug: vid " + vid)

    let title_match = body.match(/"tvName":"([^"]*)"/iu)
    let title = title_match[1]
    console.log("debug: title " + title)

    let t =  ((new Date()).getTime()).toString()

    // h5tmtsUrl: "//cache.m.iqiyi.com/jp/tmts/",
    // vmsUrl: "//cache.video.iqiyi.com/dash",

    let dfp = 'a1a6712eb7e37c4ffeba469971df3ea2faa630587fa0ac02af48ca4a0154ff330d'
    let dfp_cookie = agent.jar.getCookie('__dfp', {
    	'domain':'iqiyi.com',
    	'path': '/',
    	'noscript':false,
    	'secure':false
    })
    if(dfp_cookie){
    	dfp = dfp_cookie['value'].split('@')[0]
    }
    console.log('debug: dfp '+ dfp)

    let uid = ''
    let uid_cookie = agent.jar.getCookie('P00003', {
    	'domain':'iqiyi.com',
    	'path': '/',
    	'noscript':false,
    	'secure':false
    })
    if(uid_cookie){
    	uid = uid_cookie['value']
    }

    uid_cookie = agent.jar.getCookie('P00PRU', {
    	'domain':'iqiyi.com',
    	'path': '/',
    	'noscript':false,
    	'secure':false
    })
    if(uid_cookie){
    	uid = uid_cookie['value']
    }
    console.log('debug: uid '+ uid)

    let pck = '72Vd7KVLOqm2m1m2Hm2Ylm2XBXHdMcuNm25a62N70NbkWom32erxQU4AApd4GxSMm1vvm3R0uhpc9'
    let pck_cookie = agent.jar.getCookie('P00001', {
    	'domain':'iqiyi.com',
    	'path': '/',
    	'noscript':false,
    	'secure':false
    })
    if(pck_cookie){
    	pck = pck_cookie['value']
    }

    console.log('debug: pck '+ pck)

    let k_uid = getMacID()
    let k_uid_cookie = agent.jar.getCookie('QC005', {
    	'domain':'iqiyi.com',
    	'path': '/',
    	'noscript':false,
    	'secure':false
    })
    if(k_uid_cookie){
    	k_uid = k_uid_cookie['value']
    }

    console.log('debug: k_uid '+ k_uid)

    let src = "01010031010000000000"
    let streams = {}
    for(let bid of ids){
	    let rparams = {
	    	"tvid":tvid,
			"bid":bid,
			"vid":vid,
			"src":src,
			"vt":"0",
			"rs":"1",
			"uid":uid,
			"ori":"pcw",
			"ps":"0",
			"k_uid":k_uid,
			"pt":"0",
			"d":"0",
			"s":"",
			"lid":"",
			"cf":"",
			"ct":"",
			"authKey":"466a54d14cb116cd0df44648c78baed7",
			"k_tag":"1",
			"ost":"0",
			"ppt":"0",
			"dfp":dfp,
			"locale":"zh_cn",
			"prio":'{"ff":"f4v","code":2}',
			"pck":pck,
			"k_err_retries":"0",
			"up":"",
			"qd_v":"2",
			"tm":t,
			"qdy":"a",
			"qds":"0",
			"k_ft1":"143486267424772",
			"k_ft4":"1581060",
			"k_ft5":"1",
			"bop":'{"version":"10.0","dfp":"'+dfp+'"}',
			"ut":"1"
	    }

	    let request_str = "/dash?" + mapToRequestStr(rparams, true)
	    request_str = parse_vf(request_str)
	    let apiurl = `http://cache.video.iqiyi.com${request_str}`
	    // console.log(apiurl)
	    body = await agent.get(apiurl)
	    .set('accept','text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
	    .buffer(true)
	    .parse(function(res, fn){
			res.text = ""
			res.setEncoding("utf-8");
			res.on("data",function(chunk){
				res.text += chunk.toString()
			})
			res.on("end",function(){
				fn(null, res)
			})
		})
	    .proxy(opts['httpProxy'])

	    let data = JSON.parse(body.text)
	    if(data['data']['boss_ts']['code'] != 'A00000'){
	    	console.log('debug: boss_ts ' + data['data']['boss_ts']['msg'])
	    	continue
	    }
	    let videos = data['data']['program']['video']
	    // see
	    // https://static.iqiyi.com/js/player_v2/wonder.data.pc.645e50a2.js
	    // 可能需要参考 31762 key: "pump" 来取得正确数据

	    for(let video of videos){
	    	let vid = video['vid']
	    	// 对应bid的才有m3u8数据
	    	if(video['m3u8'] && video['bid']==bid){
		    	if(video['drmType']){
		    		console.log('debug: video drmType ' + video['drmType'])
		    	}
	    		streams[bid] = {
					"id":bid,
					'container': 'm3u8', 
					'src': [video['m3u8']], 
					'video_profile':id_2_profile[bid],
					'type':'video',
					'enablePlain':true,
					'resolution': video['scrsz'],
					'duration': video['duration'],
					'size' : video['vsize'], 
					// 'suffix': '&pv=0.1&cross-domain=1&stauto=1',
					'format' : 'mp4', 
		            'isRemote':false
				}
				// let dataurls = await require(path.join(__dirname,'../util/UrlExtractorFromM3U8')).parse(video['m3u8'], streams[bid])
				// let urls = []
				// for(let url of dataurls){
				// 	body = await agent.get(url)
				// 	    .set('accept','text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
				// 	    .buffer(true)
				// 	    .parse(function(res, fn){
				// 			res.text = ""
				// 			res.setEncoding("utf-8");
				// 			res.on("data",function(chunk){
				// 				res.text += chunk.toString()
				// 			})
				// 			res.on("end",function(){
				// 				fn(null, res)
				// 			})
				// 		})
				// 	    .proxy(opts['httpProxy'])
				// 	let json = JSON.parse(body.text)
				// 	urls.push(json['l'])
				// }
				// streams[bid]['src'] = urls
				// streams[bid]['enablePlain'] = false
				// streams[bid]['isRemote'] = true
	    	}
	    }
	}

	// console.log(streams)
	// return []

	console.log("debug: matching video completed ")
	return [{
		"title":title,
		"url":params.url,
		"merge":true,
		"streams":streamsSort(streams,ids)
	}]
}
exports = module.exports = {exec,vp:true}