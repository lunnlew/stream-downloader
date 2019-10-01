'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {getUrlExt, streamsSort, mapToRequestStr} = require(path.join(__dirname,'../utils'))
var cheerio = require('cheerio')
var crypto = require('crypto')
const {cmd5x} = require(path.join(__dirname,'../encrypt/iqiyi_encrypt'))

// const ids = ["speed", "smooth", "high", "super", "720p", "1080p", "1080p_ppc", "1080p50", "1080p6m", "1080p8m", "2K", "4k", "720po", "1080po", "2Ko"]
// const vd_2_id = {
//                 "speed": ["极速", "极速"],
//                 "smooth": ["流畅 360P", "流畅"],
//                 "high": ["高清 480P", "高清"],
//                 "super": ["超清", "超清"],
//                 "720p": ["超清 720P", "超清"],
//                 "1080p": ["蓝光 4M", "蓝光 4M"],
//                 "1080p_ppc": ["蓝光 1080P", "蓝光"],
//                 "1080p50": ["蓝光 1080P50", "蓝光"],
//                 "1080p6m": ["蓝光 6M", "蓝光 6M"],
//                 "1080p8m": ["蓝光 8M", "蓝光 8M"],
//                 "2K": ["2K", "2K"],
//                 "4k": ["蓝光 4K", "蓝光 4K"],
//                 "720po": ["原画", "原画"],
//                 "1080po": ["原画", "原画"],
//                 "2Ko": ["原画", "原画"]
//             }

var getMacID = function() {
	let macID = ""
	let chars = [ "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "n", "m", "o", "p", "q", "r", "s", "t", "u", "v","w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
	for(let i = 0; i < 32; i++){
		macID += chars[Math.floor(Math.random()*chars.length)]
	}
	return macID
}

var exec = async function(params, opts){
	console.log("debug: matching info")

	var url_match = params.url.match(/live.iqiyi.com\/s\/([a-zA-Z0-9]+).html/iu)
    var vid = url_match[1]
    console.log("debug: vid " + vid)

    let t =  parseInt((new Date()).getTime()/1000).toString()

    let vf = "iloveiqiyi"
    let qpId = "2613109523"
    let src = "01010031010000000000"
    let rparams = {
    	"lp":qpId,
    	"src":src,
    	"uid":"",
    	"rateVers":"PC_QIYI_3",
    	"k_uid":'b7e37c4ffeba469971df3ea2',
    	"qdx":"n",
    	"qdv":"3",
    	"dfp":"a1a6712eb7e37c4ffeba469971df3ea2faa630587fa0ac02af48ca4a0154ff330d",
    	"qd_v":"1",
    	"k_ft2":"0",
    	"ve":getMacID(),

    	// is_pc
    	"k_ft1":"141287244169216",
    	"k_ft4":"1",

    	"ut":"1",
    	"v":"1",
    	"k_err_retries":"0",
    	"callback":"Q3fb4300cf7662ecddabf3475cc9cc574",
    	"tm": t
    }

    let request_str = "/jp/live?" + mapToRequestStr(rparams)

    vf = cmd5x(request_str)

    let apiurl = `https://live.video.iqiyi.com${request_str}&vf=${vf}`

    console.log(apiurl)

    let body = await request.agent({'url':params.url}, opts)
    .set('content-type','text/html; charset=utf-8')
    .get(apiurl)
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

    let match = body.text.match(/cc9cc574\(([^;]*)\);/iu)
	let json = JSON.parse(match[1])
	let title = json['data']['name']

	let streams = {}
	for(let stream of json['data']['streams']){
		if(stream['url'].indexOf('http:')!==0){
			continue
		}
		let stream_id = stream['steamType']
		let ext = getUrlExt(stream['url'])
    	streams[stream_id] = {
			'id':stream_id,
			'video_profile': stream['steamType'], 
			'type':'video',
			'container': ext, 
			'resolution': stream['screenSize'],
			'src': [stream['url']], 
			"merge":true,
			'format' : ext,
            'isRemote':true
		}
	}

	console.log("debug: matching video completed ")
	return [{
		"title":title,
		"url":params.url,
		"streams":streams
	}]
}
exports = module.exports = {exec, vp:true}