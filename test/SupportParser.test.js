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
'https://y.qq.com/n/yqq/song/003njByH10fleu.html'

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