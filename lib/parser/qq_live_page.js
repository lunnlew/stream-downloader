'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))

var exec = async function(params, opts){
	console.log("debug: matching info")
	let url_macth = params.url.match(/live.qq.com\/([a-zA-Z0-9]+)/iu)
	let room_id = url_macth[1]
	console.log("debug: room_id " + room_id)
	let api_endpoint = `http://www.qie.tv/api/v1/room/${room_id}`
	let content = await request.agent(params, opts)
		.post(api_endpoint)
    let v_json = JSON.parse(content.text)
	let title=''
    let streams=[]
	if(v_json['error']==0){
	    title = v_json['data']['room_name']
	    let rtmp_url = v_json['data']['rtmp_url']
	    streams['normal'] = {
	        "id":'normal',
	        'container': "flv", 
	        'quality': 0, 
	        'size': 0, 
	        'format':'flv', 
	        'isRemote':true,
	        'src': [rtmp_url + '/' + v_json['data']['rtmp_live']]
	    }
	    for(let stream_id in v_json['data']['rtmp_multi_bitrate']){
	    	let stream_url = v_json['data']['rtmp_multi_bitrate'][stream_id]
	    	streams[stream_id] = {
		        "id":stream_id,
		        'container': "flv", 
		        'quality': 0, 
		        'size': 0, 
		        'format':'flv', 
		        'isRemote':true,
		        'src': [rtmp_url + '/' + stream_url]
		    }
	    }
	}
    return [{
        "title":title,
        "url":params.url,
        "streams":streams
    }]
}
exports = module.exports = {exec, vp:true}