'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
const {gunzip} = require(path.join(__dirname,'../utils'))
const {asrsea, ecnonasr, buildMusicDetailParams, buildMusicParams} = require(path.join(__dirname,'../encrypt/netease_encrypt'))
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 
const superagent = require('superagent')

var exec = async function(params, opts){
    console.log("debug: matching audio info ")
    let url_macth = params.url.match(/music\.163\.com\/[#/]{0,2}song\?id=([a-zA-Z0-9=]+)/iu)
    let sid = url_macth[1]
    console.log("debug: sid " + sid)

    let payload = buildMusicDetailParams(sid)

    var cookies_str = opts.httpCookies || ''
    var agent = superagent.agent()
    var cookies = cookies_str.split("; ")
    cookies.forEach(function(item){
        agent.jar.setCookie(item, "music.163.com","/")
    })

    let info_api = `https://music.163.com/weapi/v3/song/detail`
    let content = await agent
        .post(info_api)
        .set('referer', params.url)
        .set('User-Agent', UserAgent)
        .set('accept', 'application/json; charset=utf8')
        .type('form')
        .send(payload) 
    let v_json = JSON.parse(content.text)
    let music = v_json['songs'][0]
    let title = music.name

    payload = buildMusicParams(sid)
    info_api = `https://music.163.com/weapi/song/enhance/player/url/v1?csrf_token=`
    content = await agent
        .post(info_api)
        .set('referer', params.url)
        .set('User-Agent', UserAgent)
        .set('accept', 'application/json; charset=utf8')
        .type('form')
        .send(payload) 
    v_json = JSON.parse(content.text)

    let urls = []
    let stream_id = "m4a"
    let streams = {}
    
    if(v_json['code']==200){
        urls.push(v_json['data'][0]['url'])
        streams[stream_id] = {
            "id":stream_id,
            'container': "m4a", 
            'size': v_json['data'][0]['size'], 
            'format':'m4a', 
            'type':'audio',
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