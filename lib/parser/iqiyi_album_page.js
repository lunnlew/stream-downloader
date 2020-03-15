'use strict';
const path = require('path')
var request = require(path.join(__dirname, '../rq'));
const request1 = require(path.join(__dirname, '../util/request'))
const { mapToRequestStr } = require(path.join(__dirname, '../utils'))
var cheerio = require('cheerio');
var obtain_all_play_url = async function(params, opts) {
    logger.info("matching albumlist info ")
    var body = await request.get(params.url);
    var $ = cheerio.load(body)
    let urls = []
    if ($('.albumSubTab-container .title-update-num').length) {
        var l = $('.albumSubTab-container .title-update-num').text();
        var aid = $('.J_collect_data').data('sub-key')
        let agent = request1.agent({
            'referer': params.url,
            'cookieDomain': 'iqiyi.com'
        }, opts)

        let rparams = {
            aid: aid,
            size: l,
            page: 1
        }

        let request_str = "/albums/album/avlistinfo?" + mapToRequestStr(rparams, true)
        let apiurl = `https://pcw-api.iqiyi.com${request_str}`
        body = await agent.get(apiurl)
            .buffer(true)
            .parse(function(res, fn) {
                res.text = ""
                res.setEncoding("utf-8");
                res.on("data", function(chunk) {
                    res.text += chunk.toString()
                })
                res.on("end", function() {
                    fn(null, res)
                })
            })
            .proxy(opts['httpProxy'])
        let data = JSON.parse(body.text)
        if (data['code'] == 'A00000') {
            for (let item of data['data']['epsodelist']) {
                urls.push(item['playUrl'])
            }
        }
    } else {
        $(".site-piclist").find('li[data-albumlist-elem|="playItem"]').each(function(index, item) {
            let $this = $(this);
            let url = $this.find('a.site-piclist_pic_link').attr("href")
            var http_index = url.indexOf('//');
            if (http_index == 0) {
                url = 'http:' + url
            }
            urls.push(url)
        })
    }
    logger.info("matching albumlist completed ")
    return urls
}
exports = module.exports = { obtain_all_play_url, vp: false }