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

const ids = ["SMOOTH", "HIGH_DEFINITION", "RESOLUTION_720P"]
var getMacID = function() {
	let macID = ""
	let chars = [ "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "n", "m", "o", "p", "q", "r", "s", "t", "u", "v","w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
	for(let i = 0; i < 32; i++){
		macID += chars[Math.floor(Math.random()*chars.length)]
	}
	return macID
}

var r = function r(e) {
    var t = 'player-9Se2bz2gdlMmp4oz'//o._player.getConfig().getEnvConfig("api").secKey
      , i = e;
    return i.sort(), c(i.join("|") + "|" + t)
}
function s(e, t, i, n, o, r) {
    return g(function a(e, t) {
        return e << t | e >>> 32 - t
    }(g(g(t, e), g(n, r)), o), i)
}
function f(e, t, i, n, o, r, a) {
    return s(t & i | ~t & n, e, t, o, r, a)
}
function p(e, t, i, n, o, r, a) {
    return s(t & n | i & ~n, e, t, o, r, a)
}
function h(e, t, i, n, o, r, a) {
    return s(t ^ i ^ n, e, t, o, r, a)
}
function _(e, t, i, n, o, r, a) {
    return s(i ^ (t | ~n), e, t, o, r, a)
}
function g(e, t) {
    var i = (65535 & e) + (65535 & t);
    return (e >> 16) + (t >> 16) + (i >> 16) << 16 | 65535 & i
}
var c = function(e) {
    return function o(e) {
        for (var t = "0123456789abcdef", i = "", n = 0; n < 4 * e.length; n++)
            i += t.charAt(e[n >> 2] >> n % 4 * 8 + 4 & 15) + t.charAt(e[n >> 2] >> n % 4 * 8 & 15);
        return i
    }(function d(e, t) {
        e[t >> 5] |= 128 << t % 32,
        e[14 + (t + 64 >>> 9 << 4)] = t;
        for (var i = 1732584193, n = -271733879, o = -1732584194, r = 271733878, a = 0; a < e.length; a += 16) {
            var s = i
              , l = n
              , u = o
              , c = r;
            n = _(n = _(n = _(n = _(n = h(n = h(n = h(n = h(n = p(n = p(n = p(n = p(n = f(n = f(n = f(n = f(n, o = f(o, r = f(r, i = f(i, n, o, r, e[a + 0], 7, -680876936), n, o, e[a + 1], 12, -389564586), i, n, e[a + 2], 17, 606105819), r, i, e[a + 3], 22, -1044525330), o = f(o, r = f(r, i = f(i, n, o, r, e[a + 4], 7, -176418897), n, o, e[a + 5], 12, 1200080426), i, n, e[a + 6], 17, -1473231341), r, i, e[a + 7], 22, -45705983), o = f(o, r = f(r, i = f(i, n, o, r, e[a + 8], 7, 1770035416), n, o, e[a + 9], 12, -1958414417), i, n, e[a + 10], 17, -42063), r, i, e[a + 11], 22, -1990404162), o = f(o, r = f(r, i = f(i, n, o, r, e[a + 12], 7, 1804603682), n, o, e[a + 13], 12, -40341101), i, n, e[a + 14], 17, -1502002290), r, i, e[a + 15], 22, 1236535329), o = p(o, r = p(r, i = p(i, n, o, r, e[a + 1], 5, -165796510), n, o, e[a + 6], 9, -1069501632), i, n, e[a + 11], 14, 643717713), r, i, e[a + 0], 20, -373897302), o = p(o, r = p(r, i = p(i, n, o, r, e[a + 5], 5, -701558691), n, o, e[a + 10], 9, 38016083), i, n, e[a + 15], 14, -660478335), r, i, e[a + 4], 20, -405537848), o = p(o, r = p(r, i = p(i, n, o, r, e[a + 9], 5, 568446438), n, o, e[a + 14], 9, -1019803690), i, n, e[a + 3], 14, -187363961), r, i, e[a + 8], 20, 1163531501), o = p(o, r = p(r, i = p(i, n, o, r, e[a + 13], 5, -1444681467), n, o, e[a + 2], 9, -51403784), i, n, e[a + 7], 14, 1735328473), r, i, e[a + 12], 20, -1926607734), o = h(o, r = h(r, i = h(i, n, o, r, e[a + 5], 4, -378558), n, o, e[a + 8], 11, -2022574463), i, n, e[a + 11], 16, 1839030562), r, i, e[a + 14], 23, -35309556), o = h(o, r = h(r, i = h(i, n, o, r, e[a + 1], 4, -1530992060), n, o, e[a + 4], 11, 1272893353), i, n, e[a + 7], 16, -155497632), r, i, e[a + 10], 23, -1094730640), o = h(o, r = h(r, i = h(i, n, o, r, e[a + 13], 4, 681279174), n, o, e[a + 0], 11, -358537222), i, n, e[a + 3], 16, -722521979), r, i, e[a + 6], 23, 76029189), o = h(o, r = h(r, i = h(i, n, o, r, e[a + 9], 4, -640364487), n, o, e[a + 12], 11, -421815835), i, n, e[a + 15], 16, 530742520), r, i, e[a + 2], 23, -995338651), o = _(o, r = _(r, i = _(i, n, o, r, e[a + 0], 6, -198630844), n, o, e[a + 7], 10, 1126891415), i, n, e[a + 14], 15, -1416354905), r, i, e[a + 5], 21, -57434055), o = _(o, r = _(r, i = _(i, n, o, r, e[a + 12], 6, 1700485571), n, o, e[a + 3], 10, -1894986606), i, n, e[a + 10], 15, -1051523), r, i, e[a + 1], 21, -2054922799), o = _(o, r = _(r, i = _(i, n, o, r, e[a + 8], 6, 1873313359), n, o, e[a + 15], 10, -30611744), i, n, e[a + 6], 15, -1560198380), r, i, e[a + 13], 21, 1309151649), o = _(o, r = _(r, i = _(i, n, o, r, e[a + 4], 6, -145523070), n, o, e[a + 11], 10, -1120210379), i, n, e[a + 2], 15, 718787259), r, i, e[a + 9], 21, -343485551),
            i = g(i, s),
            n = g(n, l),
            o = g(o, u),
            r = g(r, c)
        }
        return Array(i, n, o, r)
    }(function n(e) {
        for (var t = Array(), i = 0; i < 8 * e.length; i += 8)
            t[i >> 5] |= (255 & e.charCodeAt(i / 8)) << i % 32;
        return t
    }(e), 8 * e.length))
}

var exec = async function(params, opts){
	console.log("debug: matching info")

	var url_match = params.url.match(/live.iqiyi.com\/\w{1}\/([a-zA-Z0-9]+)/iu)
    var livid = url_match[1]
    console.log("debug: livid " + livid)

    // 特殊情况
    // https://live.iqiyi.com/s/19rskigozj.html
    let body = await request.agent({'referer':params.url}, opts).get(params.url).proxy(opts['httpProxy'])
    let qpIdmatch = body.text.match(/"qpId":([a-z0-9]+)/iu)
    let qpId=''
    if(qpIdmatch){
		qpId = qpIdmatch[1]
    }else{
    	// 通用直播间
    	// https://live.iqiyi.com/w/49484
    	let aparams = {
    		liveId: livid,
			tl: 'player',
			deviceId: 'a68bd91c5fbafcc7078bf72d88aa5739',
			platform: '1_10_101_1021',
			liveType: '1'
    	}

    	let t = []
        for (var i in aparams)
            aparams.hasOwnProperty(i) && t.push(i + "=" + aparams[i])

    	aparams.sn = r(t)
    	let content_s = await request.agent({'referer':params.url}, opts)
        .post("https://apis-live.iqiyi.com/v1/live/initial")
        .set('referer', params.url)
        .set('accept', 'application/json; charset=utf8')
        .type('form')
        .send(aparams) 
        let vjson = content_s.body
        qpId = vjson['data']['programInfo']['qipuId']
    }
    console.log("debug: qpId " + qpId)

    let t =  parseInt((new Date()).getTime()/1000).toString()
    let vf = "iloveiqiyi"
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

    body = await request.agent({
        'referer':params.url,
        'cookieDomain':'.iqiyi.com'
    }, opts)
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
			'format' : ext!='m3u8'?ext:'mp4',
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
exports = module.exports = {exec, vp:true}