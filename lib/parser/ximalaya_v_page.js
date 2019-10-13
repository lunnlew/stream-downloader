'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))

const ids = ['32', '64']

var exec = async function(params, opts){
	logger.info("matching audio info ")

	let agent  = request.agent({
        'referer':params.url,
        'cookieDomain':'ximalaya.com'
    }, opts)

	var url_match = params.url.match(/www\.ximalaya\.com\/([a-zA-Z0-9]+)\/([0-9]+)\/([0-9]+)/iu);
    
    var audio_id = url_match[3]
    logger.info("audio_id " + audio_id)

    let url = `http://m.ximalaya.com/tracks/${audio_id}.json`
	let content = await agent.get(url)
    	.proxy(opts['httpProxy'])
	let audio_json = JSON.parse(content.text)

	let streams = []

	for(let stream_id of ids){
		let id = ['play_path', stream_id].join("_")
		streams[stream_id] = {
			'id':stream_id,
			'audio_profile': stream_id, 
			'container': 'm4a', 
			'src': [audio_json[id]], 
			'duration':audio_json['duration'],
			'type':'audio',
			'format' : 'm4a', 
			'size' : 0, 
            'isRemote':true
		}
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