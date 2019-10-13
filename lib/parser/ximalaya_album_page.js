'use strict';
const path = require('path')
const request = require(path.join(__dirname, '../util/request'))
var cheerio = require('cheerio');
var obtain_all_play_url = async function(params, opts) {
    logger.info("matching albumlist info ")

    let agent = request.agent({
        'referer': params.url,
        'cookieDomain': 'ximalaya.com'
    }, opts)

    var body = await agent.get(params.url)
        .proxy(opts['httpProxy'])

    var info_match = body.text.match(/专辑里的声音\(([^\)]*)\)/iu)
    let urls = []

    if (info_match != null) {
        let num = parseInt(info_match[1].replace(/\D/g, ""))
        let p = 2
        do {
            let $ = cheerio.load(body.text)
            $("#anchor_sound_list .sound-list li").find('.text a').each(function(index, item) {
                let $this = $(this);
                let url = $this.attr("href")
                urls.push("https://www.ximalaya.com" + url)
            })
            if (urls.length < num) {
                var url = params.url + `p${p}/`
            } else {
                break
            }
            body = await agent.get(url).proxy(opts['httpProxy'])
            p += 1
        } while (true)
    } else {
        logger.info("try match album json ")
        let match = body.text.match(/__INITIAL_STATE__\s*=\s*(.*?);<\/script>/iu)
        let v_json = JSON.parse(match[1])
        let tracks = v_json['store']['AlbumDetailPage']['albumInfo']['tracksInfo']['tracks']
        for (let i in tracks) {
            urls.push("https://www.ximalaya.com" + tracks[i]['url'])
        }
    }

    logger.info("matching albumlist completed ")
    return urls
}
exports = module.exports = { obtain_all_play_url, vp: false }