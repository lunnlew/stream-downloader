'use strict';

const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
var crypto = require('crypto');
const {parse_vf} = require(path.join(__dirname,'../encrypt/iqiyi_encrypt_1'))
const {cmd5x} = require(path.join(__dirname,'../encrypt/iqiyi_encrypt'))
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

var getVF = function(params) {
	let suffix = ""
	for(let j = 0; j < 8; j++){
		for(let k = 0; k < 4; k++) {
			let v8 = 0
			let v4 = 13 * (66*k + 27*j) % 35
			if (v4 >= 10) {
				v8 = v4 + 88
			} else {
				v8 = v4 + 49
			}
			suffix += String.fromCharCode(v8)
		}
	}
	params += suffix

	var md5 = crypto.createHash('md5')
    return md5.update(params).digest('hex')
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

    let cookie = agent.jar.getCookie('__dfp', {
    	'domain':'iqiyi.com',
    	'path': '/',
    	'noscript':false,
    	'secure':false
    })

    let dfp = 'a1a6712eb7e37c4ffeba469971df3ea2faa630587fa0ac02af48ca4a0154ff330d'
    if(cookie){
    	dfp = cookie['value'].split('@')[0]
    }
    let src = "01010031010000000000"
    let streams = {}
    for(let bid of ids){
	    let rparams = {
	    	"tvid":tvid,
			"bid":bid,
			"vid":vid,
			"src":"01010031010000000000",
			"vt":"0",
			"rs":"1",
			"uid":"",
			"ori":"pcw",
			"ps":"0",
			"k_uid":"a68bd91c5fbaf2a7078bf72d88aa5739",
			"pt":"0",
			"d":"0",
			"s":"",
			"lid":"",
			"cf":"",
			"ct":"",
			"authKey":"6863f0663e735dfb9a28ffae6cc49675",
			"k_tag":"1",
			"ost":"0",
			"ppt":"0",
			"dfp":dfp,
			"locale":"zh_cn",
			"prio":'{"ff":"f4v","code":2}',
			"pck":"72Vd7KVLOqm2m1m2Hm2Ylm2XBXHdMcuNm25a62N70NbkWom32erxQU4AApd4GxSMm1vvm3R0uhpc9",
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
	    let videos = data['data']['program']['video']
	    for(let video of videos){
	    	let vid = video['vid']
	    	// 对应bid的才有m3u8数据
	    	if(video['m3u8'] && video['bid']==bid){
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
					'format' : 'mp4', 
		            'isRemote':false
				}
	    	}
	    }
	}

	console.log("debug: matching video completed ")
	return [{
		"title":title,
		"url":params.url,
		"merge":true,
		"streams":streamsSort(streams,ids)
	}]
}
exports = module.exports = {exec,vp:true}