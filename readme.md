## Stream Downloader
`Stream Downloader`是一个用于从网络下载媒体资源(视频，音频，图片等)的工具。
这里有个使用的案例

	$ stream-dl 'https://v.qq.com/x/cover/mzc00200f995x6t/b0032n9h1lp.html'
	stream-downloader - One stream downloader
	debug: urls total 1
	debug: matching video info
	debug: Requesting https://v.qq.com/x/cover/mzc00200f995x6t/b0032n9h1lp.html
	debug: vid b0032n9h1lp
	debug: title 外交风云_05
	debug: matching video completed
	================================================
	-- title:外交风云_05
	-- url:https://v.qq.com/x/cover/mzc00200f995x6t/b0032n9h1lp.html
	debug: auto selected SD
	================================================
	Downloading streaming content with Request, press ctrl + c to stop recording...
	debug: will downloading 1,2,3,4,5,6,7,8,9
	debug: downloading url http://211.162.173.149/vlive.qqvideo.tc.qq.com/AeXmx_Lyf8NTKyranHW63b0gcNIqVYyXRNquS1JVP524/uwMROfz2r5zAoaQXGdGnC2dfKb8lyKS1sskNZcPDHZeE8qgJ/l00326604nv.p203.1.mp4?vkey=FD7D16544575547CAAB0AD8A13714F3CE9F237F177A52FC76FCB9FFA1226C6567AA28553FDE74B25EEBDFEC581D1E09F61537ACA7C2845A426633DECAB8088FF45FA8F9A277229D6F59FCF172F411CCA6A5B490888B0EA4AC1A7D27671F221B954631CB2B2E01D8ABF2E4BFE4ED973BA
	debug: statusCode 200 contentType video/mp4
	process: totalSize=14.28MB receivedSize=14.28MB percentage=100%
	........
	........
	debug: downloading url http://211.162.173.149/vlive.qqvideo.tc.qq.com/AeXmx_Lyf8NTKyranHW63b0gcNIqVYyXRNquS1JVP524/uwMROfz2r5zAoaQXGdGnC2dfKb8lyKS1sskNZcPDHZeE8qgJ/l00326604nv.p203.9.mp4?vkey=DB74F3326CCEC3AE09D4B2C7AE1B4A179229A54E25E77884C9390CAD4E01A408FBCF8F739A3CD2606DA8403D8A6A99AB23D861B670CFE1DCF330FA260168CAFC68B221920A14ED51BF3C1DA17412F2F41B13A8ADF5AF726280167ED7678F697D889E7DF8DE08D4DB9BA1C6A18074865D
	debug: statusCode 200 contentType video/mp4
	process: totalSize=10.35MB receivedSize=10.35MB percentage=100%
	debug: downloaded result true
	debug: ffmpegPath bin\ffmpeg.exe
	debug: starting merge video
	debug: Ffmpeg with command: ffmpeg -i concat:300ffa1f9cef71781b6fdfa78a0740cb/1.mp4.ts|....|300ffa1f9cef71781b6fdfa78a0740cb/9.mp4.ts -y -c copy -bsf:a aac_adtstoasc 外交风云_05.mp4
	debug: merge completed

## 安装
### 使用nodejs——npm安装
```sh
npm install -g stream-downloader
```
### 使用二进制包

|  操作系统  |         二进制包          |
| :----: | :-------------------: |
| winx64 |   [stream-downloader-winx64-v0.0.11](https://github.com/lunnlew/stream-downloader/releases/download/v0.0.11/stream-downloader-winx64.exe)   |


### 命令帮助

	stream-downloader - One stream downloader
	Usage: stream-downloader [options] <url>

	Miscellaneous:
	  -h, --help                          help and usage instructions
	  -v, --version                       print version information and exit
	  -d, --debug                         output debug information
	  -V, --verbose                       Verbose output
	  -i, --info-only                     Info Only output

	Extractor control:
	  --extractor-num, --en Int           Specify extractor number
	  --extractor-name, --ena String      Specify extractor name

	Download control:
	  --task-concurrency, --tc Int        Concurrent Number of Media Streaming Tasks - default: 1
	  --ffmpeg-path String                Specify ffmpeg path - default: ffmpeg
	  --enable-aria2                      enable aria2 downloader
	  --aria2-path String                 Specify aria2 path - default: aria2
	  --aria2-concurrency Int             Specify Number of concurrent for aria2 - default: 16
	  --http-cookies, --hc String         http cookies with request
	  --http-proxy, --hp String           http proxy with request, example: --http-proxy http://127.0.0.1:1080
	  --stream-format, --sf String        The media stream format to be downloaded
	  --stream-part-start, --sp-s Int     Start Number of Media Streaming Fragment, example:1 - default: 1
	  --stream-part-end, --sp-e Int       Media Streaming Fragment End Number, example:6
	  --stream-part-range, --sp-r String  Numbering Range of Media Streaming Fragments, example:1-4,5,7,10-12
	  -m, --stream-manual                 Manual selection of media stream number for download
	  --only-merge, --om                  Merge downloaded videos only without downloading actions
	  --only-download, --od               download videos only without merging actions
	  --d-episode-num, --dn Int           Specify the number of media streams to download
	  --playlist                          playlist to download

	Player control:
	  -p, --player String                 Stream extracted URL to a PLAYER
	  --p-episode-num, --pn Int           Specify the number of media streams to play - default: 1

	Merge control:

	Output control:
	  -o, --output String                 ffmpeg output filepath, example: output

### 使用指南

## 下载视频
当你想下载某个站点页面的视频时,可以简单使用如下的方式来下载
```sh
stream-dl 'https://v.qq.com/x/cover/mzc00200f995x6t/b0032n9h1lp.html'
```

## 支持站点

|  站点  |         地址          | 视频 | 音频 | 图片 |
| :----: | :-------------------: | :--: | :--: | :--: |
| 腾讯视频 |   http://v.qq.com/    |  ✓   |      |      |
|  优酷  | http://www.youku.com/ |  ✓   |      |      |
|  土豆  | http://www.tudou.com/ |  ✓   |      |      |
| 爱奇艺 | http://www.iqiyi.com/ |  ✓   |      |      |
| 喜马拉雅 | http://www.ximalaya.com/ |     |   ✓   |      |
| 腾讯音乐 | http://music.qq.com/ |     |   ✓   |      |
| Bilibili | http://www.bilibili.com/ |  ✓   |   ✓   |      |
| 网易云音乐 | https://music.163.com/ |  ✓   |   ✓   |      |
| 酷狗音乐 | https://www.kugou.com/ |      |   ✓   |      |
| 企鹅直播 | http://live.qq.com/ |  ✓   |      |      |
| 斗鱼直播 | https://www.douyu.com/ |  ✓   |      |      |
| 央视网 | http://www.cctv.com |  ✓   |      |      |
| 中新网 | http://www.chinanews.com |  ✓   |      |      |
| 凤凰网 | http://www.ifeng.com |  ✓   |      |      |
| 中国网 | http://www.china.com.cn |  ✓   |      |      |