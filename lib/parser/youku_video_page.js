'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
const {sleep} = require(path.join(__dirname,'../utils'))
var crypto = require('crypto');
var qrequest = require("request")
var stream_types = [
        {'id': 'hd3',      'container': 'flv', 'video_profile': '1080P'},
        {'id': 'hd3v2',    'container': 'flv', 'video_profile': '1080P'},
        {'id': 'mp4hd3',   'container': 'mp4', 'video_profile': '1080P'},
        {'id': 'mp4hd3v2', 'container': 'mp4', 'video_profile': '1080P'},
        {'id': 'hd2',      'container': 'flv', 'video_profile': '超清'},
        {'id': 'hd2v2',    'container': 'flv', 'video_profile': '超清'},
        {'id': 'mp4hd2',   'container': 'mp4', 'video_profile': '超清'},
        {'id': 'mp4hd2v2', 'container': 'mp4', 'video_profile': '超清'},
        {'id': 'mp4hd2v3', 'container': 'mp4', 'video_profile': '超清'},
        {'id': 'mp4hd',    'container': 'mp4', 'video_profile': '高清'},
        {'id': 'flvhd',    'container': 'flv', 'video_profile': '渣清'},
        {'id': '3gphd',    'container': 'mp4', 'video_profile': '渣清'},
        {'id': 'mp4sd',    'container': 'mp4', 'video_profile': '标清'},
        {'id': 'flv',      'container': 'flv', 'video_profile': '标清'},
        {'id': 'mp4',      'container': 'mp4', 'video_profile': '标清'},
    ]

var getUID = function() {
	let macID = ""
	let chars = [ "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "n", "m", "o", "p", "q", "r", "s", "t", "u", "v","w", "x", "y", "z"]
	for(let i = 0; i < 3; i++){
		macID += chars[Math.floor(Math.random()*chars.length)]
	}
	return (new Date()).getTime().toString()+macID
}

var a = function (e) {
    var t = [];
    for (var n in e)
        e[n] && t.push(n + "=" + encodeURIComponent(e[n]));
    return t.join("&")
}
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 

var req_cookie = function(nurl){
	return  new Promise((resolve, reject) => {
				var j = qrequest.jar()
				qrequest({url: nurl, jar: j}, function () {
				  resolve(j.getCookies(nurl))
			})
		 }
	)
}

var exec = async function(params, opts){
	console.log("debug: matching video info ")

	let url_macth = params.url.match(/v\.youku\.com\/v_show\/id_([a-zA-Z0-9=]+)\.html/iu)
	let vid = url_macth[1]
	console.log("debug vid " + vid)
	let body = await request.get("http://log.mmstat.com/eg.js",false,{
		"referer":"http://v.youku.com",
		"User-Agent":UserAgent,
	})
	let cna_macth = body.match(/Etag="([a-zA-Z0-9/+=]+)";goldlog/iu)
	let cna = cna_macth[1]
	console.log("debug cna " + cna)

	await sleep(1000)

	let ccode = "0502"
	console.log("debug ccode " + ccode)


	let appKey = "24679788"
	let t =  (new Date()).getTime().toString()


	// 尝试获得cookie
	let tp = {
		jsv: '2.4.16',
		appKey: '24679788',
		t: '1564124692755',
		sign: 'f9c2d62e22b5189bfac85335255a23e4',
		api: 'mtop.youku.playinfo.control.token.get',
		v: '1.0',
		type: 'jsonp',
		dataType: 'jsonp',
		callback: 'mtopjsonp2',
		data: '{"windowId":"2886585253_306","appkey":"H5_5004"}'
	}

	let turl = 'https://acs.youku.com/h5/mtop.youku.playinfo.control.token.get/1.0/'+ "?" + a(tp)
	let res_cookies = await req_cookie(turl)
	
	let tk_macth = res_cookies.toString().match(/_m_h5_tk=([^;]+);/iu)
	let h5_tk = tk_macth[1]
	console.log("debug h5_tk " + h5_tk)

	let token = h5_tk.split('_')[0]
	console.log("debug token " + token)

	let tk_enc_macth = res_cookies.toString().match(/_m_h5_tk_enc=([^;]+);/iu)
	let h5_tk_enc = tk_enc_macth[1]
	console.log("debug h5_tk_enc " + h5_tk_enc)


	// 实际请求
	let postdata = {
		data: `{"steal_params":"{\\"ccode\\":\\"${ccode}\\",\\"client_ip\\":\\"192.168.1.1\\",\\"utid\\":\\"${cna}\\",\\"client_ts\\":${t},\\"version\\":\\"1.7.2\\",\\"ckey\\":\\"118#ZVWZzwsgvg40lZCnReW3ZYquZYT4zHWzagC2NsTIiIJtbFSTyHRVWZZuusqhzeWZZgZZXoqVzeAuZZZh0HWWGcb/ZzqTqhZzZgZCcfq4zH2ZZZChXHWVZgZZusqhzeWZZgCuTOq4zH2ZZZZXeZW4Zg2+Cs0hoS2p/WA/L5iFTzFZA72gsmbJR2V+YdrwnwXSoVKdCpM/Ho9dDZQZuYPAPQqZZyjJZHpBcy2ZXGtCtF8Qm9N7R9eFEPP2cC/0IMKteluKysEtx12NrdNJ5zikyjkMxlzu2MA7fWF4JKZOUGd8EQ3B0ecFzvvqQsLESwU2jh223eWwtJJLPWvwoPlp7duKwn1hYt8Daf6z8Iu7MXVkwHBh2WoQV178dcV7XWxDfNwbpFxvInZHaI86e+rgxEeaxfkwRxE17C0rqFi9fuYZjG6WNUwOg9XdH6H9A6Dblypp+swHG719gLW61yIp/LqvV2JFqbNTUD9A26q/E1eIakCv+HqVBZ57UwB7WI1hsFboFKh0PTbRYScS76zw/XgMsg1CmxZuXd318gvXMm2abaZydF2lXeE6ORBZj57WJKrZfDAwcNw4nB0SJMvbU/XR+iu1L7A73T0Ife0OFxjjvtSMPPFQfbgtvHNWr+A2o+oR5PteDJ6to2B5K7GMsaZnsKMaPGeU874CuxEyFqCHD1dkWTsTCcUCWGxxyMzgO1fhjIbUokMQZgSUI9t1/QSZQiXf5yZWYZzEj4469WvxCHYk/jOYL/Svc7ZreyXatH==\\"}","biz_params":"{\\"vid\\":\\"${vid}\\",\\"play_ability\\":1280,\\"current_showid\\":\\"329508\\",\\"master_m3u8\\":1,\\"media_type\\":\\"standard,subtitle\\",\\"app_ver\\":\\"1.7.2\\"}","ad_params":"{\\"vs\\":\\"1.0\\",\\"pver\\":\\"1.7.2\\",\\"sver\\":\\"1.3\\",\\"site\\":1,\\"aw\\":\\"w\\",\\"fu\\":0,\\"d\\":\\"0\\",\\"bt\\":\\"pc\\",\\"os\\":\\"win\\",\\"osv\\":\\"10\\",\\"dq\\":\\"auto\\",\\"atm\\":\\"\\",\\"partnerid\\":\\"null\\",\\"wintype\\":\\"interior\\",\\"isvert\\":0,\\"vip\\":0,\\"emb\\":\\"AjkwMjM0OTE1OQJ2LnlvdWt1LmNvbQIvdl9zaG93L2lkX1hNelU1TXpneE9ERXhNZz09Lmh0bWw=\\",\\"p\\":1,\\"rst\\":\\"mp4\\",\\"needbf\\":2}"}`,
		ua: undefined
	}

	var md5 = crypto.createHash('md5')
    let sign = md5.update(token + "&" + t + "&" + appKey + "&" + postdata.data).digest('hex')

	let querystring = {
		AntiCreep: true,
		AntiFlood: true,
		YKLoginRequest: true,
		YKPid: "20160317PLF000211",
		api: "mtop.youku.play.ups.appinfo.get",
		appKey: appKey,
		callback: "mtopjsonp1",
		dataType: "jsonp",
		ecode: 0,
		jsv: "2.4.16",
		sign: sign,
		t: t,
		timeout: 20000,
		type: "jsonp",
		v: "1.1"
	}

	let url = "https://acs.youku.com/h5/mtop.youku.play.ups.appinfo.get/1.1/" + "?" + a(querystring) + "&" + a(postdata)

	let vcontent = await request.get(url,false,{
		"referer":"https://v.youku.com",
		"User-Agent":UserAgent,
	},{
		"cookies":[{
		    key: "_m_h5_tk",
		    value: h5_tk,
		    domain: '.youku.com',
		    httpOnly: true,
		    maxAge: 31536000
			},{
		    key: "_m_h5_tk_enc",
		    value: h5_tk_enc,
		    domain: '.youku.com',
		    httpOnly: true,
		    maxAge: 31536000
			}],
		"url":"https://v.youku.com"
	})
	let vcontent_macth = vcontent.match(/mtopjsonp1\(([^)]+)/iu)
	let vjson = JSON.parse(vcontent_macth[1])

	let streams = {}
	
	if(vjson['data']['error']){
		console.log("debug: "+v_json['data']['error']['note'])
		return []
	}

	let vdata = vjson['data']['data']
	let title = vdata['video']['title']
	for(let i in vdata['stream']){
		let stream = vdata['stream'][i]
		let stream_id = stream['stream_type']

		let urls = []
		if(stream_id in streams){
			continue
		}
		if(opts.streamId&&opts.streamId.toUpperCase()!=stream_id){
			continue
		}

		for(let j in stream['segs']){
			let seg = stream['segs'][j]
			urls.push(seg['cdn_url'])
		}

		streams[stream_id] = {
			"id":stream_id,
			"headers":{
				"referer":params.url,
				"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
			},
			'container': "m3u8", 
			'size': vdata['size'], 
			'format':'mp4', 
			'src': urls
		}
	}
	
	return [{
		"title":title,
		"url":params.url,
		"merge":false,
		"streams":streams
	}]
}

exports = module.exports = {exec,vp:true}