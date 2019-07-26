'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
const {sleep} = require(path.join(__dirname,'../utils'))

var stream_types = [
        {'id': 'hd3',      'container': 'flv', 'video_profile': '1080P'},
        {'id': 'hd3v2',    'container': 'flv', 'video_profile': '1080P'},
        {'id': 'mp4hd3',   'container': 'mp4', 'video_profile': '1080P'},
        {'id': 'mp4hd3v2', 'container': 'mp4', 'video_profile': '1080P'},
        {'id': 'hd2',      'container': 'flv', 'video_profile': '超清'},
        {'id': 'hd2v2',    'container': 'flv', 'video_profile': '超清'},
        {'id': 'mp4hd2',   'container': 'mp4', 'video_profile': '超清'},
        {'id': 'mp4hd2v2', 'container': 'mp4', 'video_profile': '超清'},
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

var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 
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

	let ccode = "0521"
	console.log("debug ccode " + ccode)

	let t =  (new Date()).getTime().toString()

	let ckey = 'DIl58SLFxFNndSV1GFNnMQVYkx1PP5tKe1siZu/86PR1u/Wh1Ptd+WOZsHHWxysSfAOhNJpdVWsdVJNsfJ8Sxd8WKVvNfAS8aS8fAOzYARzPyPc3JvtnPHjTdKfESTdnuTW6ZPvk2pNDh4uFzotgdMEFkzQ5wZVXl2Pf1/Y6hLK0OnCNxBj3+nb0v72gZ6b0td+WOZsHHWxysSo/0y9D2K42SaB8Y/+aD2K42SaB8Y/+ahU+WOZsHcrxysooUeND'

	let url = `https://ups.youku.com/ups/get.json?vid=${vid}&ccode=${ccode}`
    url += '&client_ip=192.168.1.1'
    url += '&utid=' + encodeURIComponent(cna)
    url += '&client_ts=' + t
    url += '&ckey=' + encodeURIComponent(ckey)

    let vcontent = await request.get(url,false,{
		"referer":"https://v.youku.com",
		"User-Agent":UserAgent,
	},{
		"cookies":[{
		    key: "cna",
		    value: cna,
		    domain: '.youku.com',
		    httpOnly: true,
		    maxAge: 31536000
			},
			{
		    key: "__ysuid",
		    value: getUID(),
		    domain: '.youku.com',
		    httpOnly: true,
		    maxAge: 31536000
			},
			{
		    key: "xreferrer",
		    value: 'https://www.youku.com',
		    domain: '.youku.com',
		    httpOnly: true,
		    maxAge: 31536000
			}
		],
		"url":"https://v.youku.com"
	})

	let v_json = JSON.parse(vcontent)
	let streams = {}
	if(v_json['data']['error']){
		console.log("debug: "+v_json['data']['error']['note'])
		return []
	}

	let vdata = v_json['data']
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
		urls.push(stream['m3u8_url'])

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