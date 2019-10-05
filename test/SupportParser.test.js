'use strict'
/*
* 已支持平台链接识别测试
*/

const {should, expect, assert} = require('chai')
const path = require('path')
const {urlMatchToParser} = require(path.join(__dirname,'../lib/utils'))

// 预定义变量区
let opts = {
	verbose: false
}
// 待测链接
let urls = [
// iqiyi
'https://www.iqiyi.com/v_19rsgtgwiw.html',
'https://www.iqiyi.com/a_19rrh39t35.html',
'https://live.iqiyi.com/s/19rskjpk4n.html',

// 腾讯视频
'https://v.qq.com/x/cover/mzc00200f995x6t/i0032g19159.html',
'https://v.qq.com/detail/m/mzc00200f995x6t.html',
'https://v.qq.com/x/cover/mzc00200l3l5rxb/s0032mob2qm.html',

// 企鹅直播
'https://live.qq.com/directory/match/38468',
'https://live.qq.com/10053497',
'https://live.qq.com/video/v/1118658',

// qq音乐
'https://y.qq.com/n/yqq/playsquare/7178708417.html#stat=y_new.index.playlist.pic',
'https://y.qq.com/n/yqq/song/003njByH10fleu.html',

//bilibili
'https://www.bilibili.com/bangumi/play/ep268061',
'https://www.bilibili.com/bangumi/play/ss26960',
'https://www.bilibili.com/video/av15123338/',
'https://www.bilibili.com/video/av15123338/?p=6',
'https://www.bilibili.com/audio/am29285596',
'https://www.bilibili.com/audio/au411153',

// 央视网
'http://tv.cctv.com/live/cctv2/',
'http://livechina.cctv.com/zby/index.shtml?spm=C04362.PAup3mg36SVX.ETYxjxdiAIXp.3&id=INTEiWHzY1jkfn8RpJu6ZhKX190222',
'http://news.cctv.com/2019/10/01/ARTIflXtiEOtStMBX8fonGSB191001.shtml?spm=C96370.PsikHJQ1ICOX.EVghq5Nl0TnK.1',

// 中国网
'http://www.china.com.cn/zhibo/content_75143106.htm',

// 中新网
'http://www.chinanews.com/gn/shipin/cns-d/2019/10-05/news833712.shtml',

// 斗鱼
'https://www.douyu.com/2267291',

// 凤凰网
'https://v.ifeng.com/c/7qWDb2vlSOe',
'https://zhibo.ifeng.com/video.html?liveid=129669',

// 酷狗
'https://www.kugou.com/song/gfnut61.html',
'https://www.kugou.com/song/#hash=A087D74450F29514876959F699E60324&album_id=29089049',
'https://www.kugou.com/yy/rank/home/1-6666.html?from=rank',
'https://www.kugou.com/yy/special/single/547134.html',

// 网易
'https://music.163.com/playlist?id=2966413699',
'https://music.163.com/song?id=550031935',
'https://music.163.com/#/program?id=2063397076',
'https://music.163.com/#/djradio?id=791758454',

// 土豆
'https://video.tudou.com/v/XNDM3NTQxNTY3Ng==.html?spm=a2h28.8313475.main.dvideo&from=s1.8-1-1.2',

// 喜马拉雅
'https://www.ximalaya.com/toutiao/24004983/189849377',
'https://www.ximalaya.com/youshengshu/24004983/',

// 优酷
'https://v.youku.com/v_show/id_XNDI3OTcxODg4MA==.html?spm=a2h0j.11185381.listitem_page1.5!6~A&&s=affcc7c9cf2849e8bbd0',
'https://list.youku.com/show/id_zaffcc7c9cf2849e8bbd0.html?spm=a2h0j.11185381.bpmodule-playpage-lefttitle.5~5~H1~8!2~A',

// youtube
'https://www.youtube.com/watch?v=HK7SPnGSxLM'

]

describe('Parser', function() {
	for(let url of urls){
		let streams_params = {"url":url,"verbose":opts.verbose}
		let parser = urlMatchToParser(streams_params, opts)
		describe('#isSupportFor ['+ url +']', function() {
			it('hasSupported', function() {
				assert.typeOf(parser, 'object');
			})
		})
	}
})