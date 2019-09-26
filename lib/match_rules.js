'use strict';
exports = module.exports = {
	"iqiyi_v_page" : /www\.iqiyi\.com\/[vw]_([a-z0-9].*)\.html/iu,
	"iqiyi_album_page" : /www\.iqiyi\.com\/a_([a-z0-9].*)\.html/iu,
	"qq_v_cover_page" : /v\.qq\.com\/x\/cover\/([a-zA-Z0-9].*)\.html/iu,
	"qq_v_page" : /v\.qq\.com\/x\/page\/([a-zA-Z0-9].*)\.html/iu,
	"qq_video_album_page" : /v\.qq\.com\/detail\/[a-zA-Z0-9]{1}\/([a-zA-Z0-9].*)\.html/iu,
	"qq_song_page" : /y\.qq\.com\/n\/yqq\/song\/([a-zA-Z0-9].*)\.html/iu,
	"qq_song_playsquare_page" : /y\.qq\.com\/n\/yqq\/playsquare\/([a-zA-Z0-9].*)\.html/iu,
	"ximalaya_v_page":/www\.ximalaya\.com\/([a-zA-Z0-9]+)\/([0-9].*)\/([0-9].*)/iu,
	"ximalaya_album_page":/www\.ximalaya\.com\/([a-zA-Z0-9]+)\/([0-9].*)\//iu,
	"bilibili_v_page":/www\.bilibili\.com\/video\/av([a-zA-Z0-9]+)/iu,
	"bilibili_bangumi_page":/www\.bilibili\.com\/bangumi\/play\/([a-zA-Z]{2})([0-9]+)/iu,
	"bilibili_bangumi_album_page":/www\.bilibili\.com\/bangumi\/media\/md([a-zA-Z0-9]+)/iu,
	"bilibili_audio_page":/www\.bilibili\.com\/audio\/au([a-zA-Z0-9]+)/iu,
	"bilibili_audio_album_page":/www\.bilibili\.com\/audio\/am([a-zA-Z0-9]+)/iu,
	"youku_video_page":/v\.youku\.com\/v_show\/id_([a-zA-Z0-9=]+)\.html/iu,
	"youku_video_album_page":/list\.youku\.com\/show\/id_([a-zA-Z0-9=]+)\.html/iu,
	"netease_music_page":/music\.163\.com\/[#/]{0,2}song\?id=([a-zA-Z0-9=]+)/iu,
	"netease_music_mv_page":/music\.163\.com\/[#/]{0,2}mv\?id=([a-zA-Z0-9=]+)/iu,
	"netease_music_playlist_page":/music\.163\.com\/[#/]{0,2}playlist\?id=([a-zA-Z0-9=]+)/iu,
	"netease_music_dj_page":/music\.163\.com\/[#/]{0,2}dj\?id=([a-zA-Z0-9=]+)/iu
}