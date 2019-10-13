'use strict';

const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const crypto = require('crypto');

const ids = ['4k','BD', 'TD', 'HD', 'SD', 'LD']
const vd_2_id = {10: '4k', 19: '4k', 5:'BD', 18: 'BD', 21: 'HD_H265', 2: 'HD', 4: 'TD', 17: 'TD_H265', 96: 'LD', 1: 'SD', 14: 'TD'}

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
    logger.info("matching video info ")

    let agent  = request.agent({
        'referer':params.url,
        'cookieDomain':'iqiyi.com'
    }, opts)

	let body = await agent.get(params.url)
    	
	let tvid_match = body.text.match(/"tvId":([a-z0-9]+)/iu)
    let tvid = tvid_match[1]
    logger.info("tvid " + tvid)

    let vid_match = body.text.match(/"vid":"([a-z0-9]+)"/iu)
    let vid = vid_match[1]
    logger.info("vid " + vid)

    let title_match = body.text.match(/"tvName":"([^"]*)"/iu)
    let title = title_match[1]
    logger.info("title " + title)

    let t =  (new Date()).getTime().toString()

    let rparams = `/vps?tvid=${tvid}&vid=${vid}&v=0&qypid=${tvid}_12&src=01012001010000000000&t=${t}&k_tag=1&k_uid=${getMacID()}&rs=1`
    let vf = getVF(rparams)
    let url = `http://cache.video.qiyi.com${rparams}&vf=${vf}`
    logger.info(url)
    let content = await agent.get(url)
    let re_json = JSON.parse(content.text)
    let urlPrefix = re_json['data']['vp']['du']
    if(re_json['data']['vp']['tkl'] == ''){
    	logger.info('video not found')
    	return []
    }
    let streams = {}
    for (let i in re_json['data']['vp']['tkl'][0]['vs']) {
    	let video = re_json['data']['vp']['tkl'][0]['vs'][i]
    	let urls = []
    	let stream_id = video['bid'].toString()

	    if(stream_id in streams){
			continue
		}

		if(opts.streamFormat&&opts.streamFormat.toUpperCase()!=stream_id){
			continue
		}

	    for (let j in video['fs']) {
	    	let v = video['fs'][j]
	    	let url = urlPrefix+v.l
	    	logger.info(url)
	    	let v_content = await agent.get(url)
    		let v_json = JSON.parse(v_content.text)
	    	urls.push(v_json['l'])
	    }
		streams[stream_id] = {
			"id":stream_id,
			'video_profile':vd_2_id[stream_id],
			'container': 'f4v', 
			'src': urls, 
			'type':'video',
			'resolution': video['scrsz'],
			'duration': video['duration'],
			'size' : video['vsize'], 
			'format' : 'mp4', 
            'isRemote':true
		}
    }
    let streams_sorted = streams

	logger.info("matching video completed ")
	return [{
		"title":title,
		"url":params.url,
		"merge":true,
		"streams":streams_sorted
	}]
}
exports = module.exports = {exec,vp:true}