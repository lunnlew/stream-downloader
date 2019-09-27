'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))

var exec = async function(params, opts){
	console.log("debug: matching info")
	let url_macth = params.url.match(/live.qq.com\/directory\/match\/([0-9]+)/iu)
	let game_id = url_macth[1]
	console.log("debug: game_id " + game_id)
	let api_endpoint = `https://live.qq.com/game/game_details/get_game_details_info/${game_id}`
	let content = await request.agent(Object.assign({},params,{'url':api_endpoint}), opts)
		.post(api_endpoint)
    let v_json = JSON.parse(content.text)
    let room_id
	let title=''
    if(v_json['error']==0){
	    let rooms = v_json['data']['anchor_data']
	    for(let i in rooms){
	    	if(rooms[i]['is_use_room']){
	    		room_id = rooms[i]['room_id']
	    		title = rooms[i]['room_name']
	    		break
	    	}
	    }
	}
	if(!room_id){
		return []
	}
	console.log("debug: room_id " + room_id)
	api_endpoint = `http://www.qie.tv/api/v1/room/${room_id}`
	content = await request.agent(Object.assign({},params,{'url':api_endpoint}), opts)
		.post(api_endpoint)
    v_json = JSON.parse(content.text)
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