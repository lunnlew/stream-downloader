'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
const {gunzip} = require(path.join(__dirname,'../utils'))
const {asrsea, ecnonasr} = require(path.join(__dirname,'../encrypt/netease_encrypt'))
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 
const superagent = require('superagent')

var Iv3x = function(i2x, u2x) {
        try {
            u2x = u2x.toLowerCase();
            if (i2x === null)
                return u2x == "null";
            if (i2x === undefined)
                return u2x == "undefined";
            return {}.toString.call(i2x).toLowerCase() == "[object " + u2x + "]"
        } catch (e) {
            return !1
        }
    };
var Sj7c={}
Sj7c.emj = {
    "色": "00e0b",
    "流感": "509f6",
    "这边": "259df",
    "弱": "8642d",
    "嘴唇": "bc356",
    "亲": "62901",
    "开心": "477df",
    "呲牙": "22677",
    "憨笑": "ec152",
    "猫": "b5ff6",
    "皱眉": "8ace6",
    "幽灵": "15bb7",
    "蛋糕": "b7251",
    "发怒": "52b3a",
    "大哭": "b17a8",
    "兔子": "76aea",
    "星星": "8a5aa",
    "钟情": "76d2e",
    "牵手": "41762",
    "公鸡": "9ec4e",
    "爱意": "e341f",
    "禁止": "56135",
    "狗": "fccf6",
    "亲亲": "95280",
    "叉": "104e0",
    "礼物": "312ec",
    "晕": "bda92",
    "呆": "557c9",
    "生病": "38701",
    "钻石": "14af6",
    "拜": "c9d05",
    "怒": "c4f7f",
    "示爱": "0c368",
    "汗": "5b7a4",
    "小鸡": "6bee2",
    "痛苦": "55932",
    "撇嘴": "575cc",
    "惶恐": "e10b4",
    "口罩": "24d81",
    "吐舌": "3cfe4",
    "心碎": "875d3",
    "生气": "e8204",
    "可爱": "7b97d",
    "鬼脸": "def52",
    "跳舞": "741d5",
    "男孩": "46b8e",
    "奸笑": "289dc",
    "猪": "6935b",
    "圈": "3ece0",
    "便便": "462db",
    "外星": "0a22b",
    "圣诞": "8e7",
    "流泪": "01000",
    "强": "1",
    "爱心": "0CoJU",
    "女孩": "m6Qyw",
    "惊恐": "8W8ju",
    "大笑": "d"
};
Sj7c.md = ["色", "流感", "这边", "弱", "嘴唇", "亲", "开心", "呲牙", "憨笑", "猫", "皱眉", "幽灵", "蛋糕", "发怒", "大哭", "兔子", "星星", "钟情", "牵手", "公鸡", "爱意", "禁止", "狗", "亲亲", "叉", "礼物", "晕", "呆", "生病", "钻石", "拜", "怒", "示爱", "汗", "小鸡", "痛苦", "撇嘴", "惶恐", "口罩", "吐舌", "心碎", "生气", "可爱", "鬼脸", "跳舞", "男孩", "奸笑", "猪", "圈", "便便", "外星", "圣诞"]

var k2x = {}
k2x.gT5Y = function(i2x) {
    return Iv3x(i2x, "function")
}
k2x.be3x = function(j2x, cD3x, O2x) {
        if (!j2x || !j2x.length || !k2x.gT5Y(cD3x))
            return this;
        if (!!j2x.forEach) {
            j2x.forEach(cD3x, O2x);
            return this
        }
        for (var i = 0, l = j2x.length; i < l; i++)
            cD3x.call(O2x, j2x[i], i, j2x);
        return this
}
var bry5D = function(cxa0x) {
    var m2x = [];
    k2x.be3x(cxa0x, function(cwZ0x) {
        m2x.push(Sj7c.emj[cwZ0x])
    });
    return m2x.join("")
};

var buildParams = function(sid){
    let i2x = {
        csrf_token: "",
        encodeType: "aac",
        ids: '['+sid+']',
        level: "standard"
    }
    var bUS3x = asrsea(JSON.stringify(i2x), bry5D(["流泪", "强"]), bry5D(Sj7c.md), bry5D(["爱心", "女孩", "惊恐", "大笑"]));
    return {
        params: bUS3x.encText,
        encSecKey: bUS3x.encSecKey
    }
}


var buildDetailParams = function(sid){
    let i2x = {
        c: '[{"id":"'+sid+'"}]',
        csrf_token: "",
        id: sid.toString()
    }
    var bUS3x = asrsea(JSON.stringify(i2x), bry5D(["流泪", "强"]), bry5D(Sj7c.md), bry5D(["爱心", "女孩", "惊恐", "大笑"]));
    return {
        params: bUS3x.encText,
        encSecKey: bUS3x.encSecKey
    }
}

var exec = async function(params, opts){
    console.log("debug: matching audio info ")
    let url_macth = params.url.match(/music\.163\.com\/#\/song\?id=([a-zA-Z0-9=]+)/iu)
    let sid = url_macth[1]
    console.log("debug: sid " + sid)

    let payload = buildDetailParams(sid)

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

    payload = buildParams(sid)
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
            'quality': 0, 
            'size': v_json['data'][0]['size'], 
            'format':'m4a', 
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