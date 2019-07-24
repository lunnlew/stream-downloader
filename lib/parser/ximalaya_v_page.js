'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));

const ids = ['64','32', '']

var exec = async function(params, opts){
	console.log("debug: matching audio info ")

	var url_match = params.url.match(/www\.ximalaya\.com\/([a-zA-Z0-9]+)\/([0-9]+)\/([0-9]+)/iu);
    
    var audio_id = url_match[3]
    console.log("debug: audio_id " + audio_id)

    let url = `http://m.ximalaya.com/tracks/${audio_id}.json`
	let content = await request.get(url)
	let audio_json = JSON.parse(content)

	let streams = []

	for(let i in ids){
		let stream_id = ids[i]?['play_path',ids[i]].join("_"):'play_path'
		streams[stream_id] = Object.assign({'id':stream_id},{
			'audio_profile': stream_id, 
			'container': 'm4a', 
			'src': [audio_json[stream_id]], 
			'format' : 'm4a', 
			'size' : 0, 
			'screenSize': ""
		})
	}

	let streams_sorted = streams

	return [{
		"title":audio_json['title'],
		"url":params.url,
		"merge":false,
		"streams":streams_sorted
	}]
}

exports = module.exports = {exec,vp:true}