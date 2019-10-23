---
sidebar: auto
---

# 指南
## 介绍
Stream Downloader是一个以NodeJs驱动的网络媒体资源下载工具，为了支持更方便地从网络下载公开资源而创建并开源的。
当你浏览网页发现一个有趣的资源时，你就可以使用它下载该资源以用于学习和研究。

### 特性
### 路线图
## 起步
### 安装
#### npm安装

```sh
npm install -g stream-downloader
```
使用上面的命令安装好后，即可使用`stream-downloader`或者`stream-dl`命令了
```sh
## 查看命令帮助
stream-dl -h
```
#### 二进制文件

|  操作系统  |         二进制包          |
| :----: | :-------------------: |
| winx64 |   [stream-downloader-winx64-v0.0.16](https://github.com/lunnlew/stream-downloader/releases/download/v0.0.16/stream-downloader-winx64.exe)   |

### 使用
当你想下载某个站点页面的视频时,可以使用如下的方式

```sh
stream-dl 'https://v.qq.com/x/cover/mzc00200f995x6t/b0032n9h1lp.html'
```
结果

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

#### 手动选择清晰度
`-m`，`--stream-manual`表示在各个关键的步骤手动选择处理逻辑，例如手动选择清晰度格式下载。
#### 指定清晰度下载
`--sf`，`--stream-format`表示仅下载该参数指定的格式ID，根据不同站点的解析实现，该参数具体值不定。
#### 任务并发数
`--tc`，`--task-concurrency`表示同时进行的任务数，例如同时对两个url地址进行分析处理`--tc 2`，在默认使用`request`下载
视音频片段的情况下也会起作用。
#### 启用aria2下载
`--enable-aria2`表示在进行下载任务的时候使用aria2工具来下载。
#### 设定aria2工具路径
`--aria2-path`表示设定aria2工具所在的路径，一般情况不需要使用，`stream-dl`会自动检查及下载对应平台的aria2并使用。
#### 设定aria2下载并发数
`--aria2-concurrency`表示设定aria2工具下载任务的并发数，默认为16。
#### 播放列表下载
`--playlist`，在支持playlist的情况下下载播放列表中的媒体。
#### 播放器播放
`-p`，`--player`指定播放器播放媒体流

## 进阶
#### 指定播放列表中的某集媒体进行下载
```sh
## 下载第10集并指定为蓝光清晰度
## 参数--d-episode-num或者--dn
stream-dl 'https://v.qq.com/detail/m/mzc00200f995x6t.html' --playlist --pn 10 --sf fhd
```
#### 指定播放器播放媒体流
```sh
## 方式1
stream-dl 'https://v.qq.com/x/cover/mzc00200f995x6t/b0032n9h1lp.html' -p vlc
## 方式2
## 参数--out-stream或者-O  注意为大写字母O
stream-dl 'https://v.qq.com/x/cover/mzc00200f995x6t/b0032n9h1lp.html' -O | vlc -
```
#### 指定播放列表中的某集媒体进行播放
```sh
## 播放第10集
## 参数--p-episode-num或者--pn
stream-dl 'https://v.qq.com/detail/m/mzc00200f995x6t.html' --playlist --pn 10 -p vlc
```
#### 指定播放列表中的某些媒体进行下载
```sh
## 从第6集开始下载
stream-dl 'https://v.qq.com/detail/m/mzc00200f995x6t.html' --playlist --ss 6
```
```sh
## 下载到第23集结束
stream-dl 'https://v.qq.com/detail/m/mzc00200f995x6t.html' --playlist --se 23
```
```sh
## 下载第7集到18集
stream-dl 'https://v.qq.com/detail/m/mzc00200f995x6t.html' --playlist --ss 7 --se 18
```
```sh
## 下载第2,5-10,15-26集
stream-dl 'https://v.qq.com/detail/m/mzc00200f995x6t.html' --playlist --sr 2,5-10,15-26
```

## 限制
当前，不支持`加密的媒体片段`，例如drm加密版权视频等。

## 技术栈

## 开源许可
基于 [MIT license](https://opensource.org/licenses/MIT) 许可进行开源。