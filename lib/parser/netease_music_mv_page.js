'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
const {gunzip} = require(path.join(__dirname,'../utils'))
const {asrsea, ecnonasr, buildMvDetailParams, buildMvParams} = require(path.join(__dirname,'../encrypt/netease_encrypt'))
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 
const superagent = require('superagent')

const vd_2_id = {240: 'SD', 480: 'HD', 720:'SHD', 1080: 'FHD'}
const id_2_profile = {'SD':'标清;(270P)', 'HD': '高清;(480P)','SHD': '超清;(720P)', 'FHD': '蓝光;(1080P)'}

var exec = async function(params, opts){
    console.log("debug: matching audio info ")
    let url_macth = params.url.match(/music\.163\.com\/[#/]{0,2}mv\?id=([a-zA-Z0-9=]+)/iu)
    let sid = url_macth[1]
    console.log("debug: sid " + sid)

    let payload = buildMvDetailParams(sid)

    var cookies_str = opts.httpCookies || ''
    var agent = superagent.agent()
    var cookies = cookies_str.split("; ")
    cookies.forEach(function(item){
        agent.jar.setCookie(item, "music.163.com","/")
    })

    let info_api = `https://music.163.com/weapi/v1/mv/detail?csrf_token=`
    let content = await agent
        .post(info_api)
        .set('referer', params.url)
        .set('User-Agent', UserAgent)
        .set('accept', 'application/json; charset=utf8')
        .type('form')
        .send(payload) 
    let v_json = JSON.parse(content.text)
    let mv = v_json['data']
    let title = mv.name
    let streams = {}
    for (let part_format_id in vd_2_id) {
        let stream_id = vd_2_id[part_format_id]
        if(stream_id in streams){
            continue
        }
        if(opts.streamFormat && opts.streamFormat.toUpperCase()!=stream_id){
            continue
        }
        payload = buildMvParams(sid, part_format_id)
        info_api = `https://music.163.com/weapi/song/enhance/play/mv/url?csrf_token=`
        content = await agent
            .post(info_api)
            .set('referer', params.url)
            .set('User-Agent', UserAgent)
            .set('accept', 'application/json; charset=utf8')
            .type('form')
            .send(payload) 
        v_json = JSON.parse(content.text)
        let urls = []
        if(v_json['code']==200){
            urls.push(v_json['data']['url'])
        }
        streams[stream_id] = {
            "id":stream_id,
            'container': "mp4", 
            'type':'video',
            'size': v_json['data']['size'], 
            'format':'mp4', 
            'isRemote':true,
            'src': urls
        }
    }

    let streams_sorted = streams
    console.log("debug: matching audio completeed ")
    return [{
        "title":title,
        "url":params.url,
        "streams":streams_sorted
    }]
}
exports = module.exports = {exec, vp:true}