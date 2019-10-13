'use strict';
const path = require('path')
var request = require(path.join(__dirname, '../rq'));
var cheerio = require('cheerio');
const { gunzip } = require(path.join(__dirname, '../utils'))

var obtain_all_play_url = async function(params, opts) {
    logger.info("matching albumlist info ")
    let total = 0
    let urls = []
    let page = 1
    let pagesize = 100
    do {
        let offset = (page - 1) * pagesize
        let content = await request.get(params.url.replace('/#/', '/') + '&order=1&_hash=programlist&limit=' + pagesize + '&offset=' + offset, null, {
            "referer": params.url,
            'Accept-Encoding': 'gzip'
        })
        content = await gunzip(content)
        var $ = cheerio.load(content)
        let items = $('.m-table-program').find('.f-thide')
        if (!total) {
            let total_macth = $('.u-title').find('.sub.s-fc4').text().match(/([0-9]+)/iu)
            total = total_macth[1]
        }
        items.each(function(index, item) {
            let $this = $(this);
            let url = $this.find('a').attr("href")
            var http_index = url.indexOf('http');
            if (http_index !== 0) {
                url = 'https://music.163.com' + url
            }
            urls.push(url)
        })
        page++
    } while (total > urls.length)

    logger.info("matching albumlist completed ")
    return urls
}
exports = module.exports = { obtain_all_play_url, vp: false }