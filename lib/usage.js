const optionator = require('optionator');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

var optsParser = function (argv, pkginfo) {
    console.log(`${pkginfo.name} - ${pkginfo.description}`);

    const _optsParser = optionator({
        prepend: `Usage: ${pkginfo.name} [options] <url>`,
        append: `Version ${pkginfo.version}`,
        options: [
            // Miscellaneous
            {heading: 'Miscellaneous'},
            {
                option: 'help',
                alias: 'h',
                type: 'Boolean',
                default: false,
                description: 'help and usage instructions'
            },
            {
                option: 'version',
                alias: 'v',
                type: 'Boolean',
                default: false,
                description: 'print version information and exit'
            },
            {
                option: 'debug',
                alias: 'd',
                type: 'Boolean',
                default: false,
                description: 'output debug information'
            },
            {
                option: 'info-only',
                alias: 'i',
                type: 'Boolean',
                default: false,
                description: 'Info Only output'
            },

            // Extractor control
            {heading: 'Extractor control'},
            {
                option: 'extractor-num',
                alias: 'EN',
                type: 'Int',
                description: 'Specify extractor number'
            },

            // Download control
            {heading: 'Download control'},
            {
                option: 'ffmpeg-path',
                type: 'String',
                default: "ffmpeg",
                description: 'Specify ffmpeg path'
            },
            {
                option: 'enable-aria2c',
                type: 'Boolean',
                default: false,
                description: 'enable aria2c downloader'
            },
            {
                option: 'aria2-path',
                type: 'String',
                default: "aria2",
                description: 'Specify aria2 path'
            },
            {
                option: 'download-concurrency',
                alias: 'dc',
                type: 'Int',
                default: '1',
                description: 'Number of concurrent Downloads'
            },
            {
                option: 'http-cookies',
                alias: 'hc',
                type: 'String',
                default: "",
                description: 'http cookies with request'
            },
            {
                option: 'http-proxy',
                alias: 'hp',
                type: 'String',
                default: "",
                description: 'http proxy with request, example: --http-proxy http://127.0.0.1:1080'
            },
            {
                option: 'stream-format',
                alias: 'sf',
                type: 'String',
                default: "",
                description: 'The media stream format to be downloaded'
            },
            {
                option: 'stream-part-start',
                alias: 'sp-s',
                type: 'Int',
                default: "1",
                description: 'Start Number of Media Streaming Fragment, example:1'
            },
            {
                option: 'stream-part-end',
                alias: 'sp-e',
                type: 'Int',
                description: 'Media Streaming Fragment End Number, example:6'
            },
            {
                option: 'stream-part-range',
                alias: 'sp-r',
                type: 'String',
                default: "",
                description: 'Numbering Range of Media Streaming Fragments, example:1-4,5,7,10-12'
            },
            {
                option: 'stream-manual',
                alias: 'm',
                type: 'Boolean',
                default: false,
                description: 'Manual selection of media stream number for download'
            },
            {
                option: 'only-merge',
                alias: 'om',
                type: 'Boolean',
                default: false,
                description: 'Merge downloaded videos only without downloading actions'
            },

            // Player control
            {heading: 'Player control'},
            {
                option: 'player',
                alias: 'p',
                type: 'String',
                description: 'Stream extracted URL to a PLAYER'
            },
            {
                option: 'p-episode-num',
                alias: 'pn',
                type: 'Int',
                default: "1",
                description: 'Specify the number of media streams to play'
            },

            // Merge control
            {heading: 'Merge control'},

            // Output control
            {heading: 'Output control'},
            {
                option: 'output',
                alias: 'o',
                type: 'String',
                default: "",
                description: 'ffmpeg output filepath, example: output.mp4'
            },
            {
                option: 'verbose',
                alias: 'V',
                type: 'Boolean',
                default: false,
                description: 'Verbose output, will print which file is currently being processed'
            }
        ]
    });



    let opts;
    try {
        opts = _optsParser.parse(argv);
    }
    catch (error) {
        console.error(error.message);
        process.exit(1);
    }


    if (opts.version) {
        console.log((opts.verbose ? pkginfo.name + ' v' : '') + pkginfo.version);
        process.exit();
    }


    if (opts.help || opts._.length === 0) {
        console.log(_optsParser.generateHelp());
    }

    return opts;
}

var parsePackageInfo = function () {
    let pkg;
    try {
        const packageJson = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8');
        pkg = JSON.parse(packageJson);
    }
    catch (error) {
        console.error('Cannot read or parse the file "package.json"');
        console.error(error);
        process.exit(1);
    }
    return pkg;
}

var promptOpts = async function(opts){
    const promptList = [{
        type: 'input',
        message: '请输入地址(必填):',
        name: 'url'
    },{
        type: 'input',
        message: '设定下载格式(可选):',
        name: 'streamFormat'
    },{
        type: 'input',
        message: '设定解析器序号',
        name: 'extractorNum',
        default:''
    },{
        type: 'confirm',
        message: '启用手动选择(可选):',
        name: 'streamManual',
        default:false
    },{
        type: 'input',
        message: '设定ffmpeg路径(可选):',
        name: 'ffmpegPath',
        default:'ffmpeg'
    },{
        type: 'input',
        message: '设定播放器(可选):',
        name: 'player'
    },{
        type: 'input',
        message: '设定播放的视频序号(可选):',
        name: 'pEpisodeNum'
    },{
        type: 'input',
        message: '设定代理(可选):',
        name: 'httpProxy'
    },{
        type: 'input',
        message: '设定cookies:',
        name: 'httpCookies'
    },{
        type: 'input',
        message: '是否启用aria2c下载器',
        name: 'enableAria2c',
        default:false
    }];
    let answers = await inquirer.prompt(promptList)
    if(answers['url']){
        opts._.push(answers['url'])
    }
    if(answers['streamFormat']){
        opts['streamFormat'] = answers['streamFormat']
    }
    if(answers['streamPartStart']){
        opts['streamPartStart'] = answers['streamPartStart']
    }
    if(answers['streamPartEnd']){
        opts['streamPartEnd'] = answers['streamPartEnd']
    }
    if(answers['streamPartRange']){
        opts['streamPartRange'] = answers['streamPartRange']
    }
    if(answers['downloadConcurrency']){
        opts['downloadConcurrency'] = parseInt(answers['downloadConcurrency'])
    }
    if(answers['pEpisodeNum']){
        opts['pEpisodeNum'] = parseInt(answers['pEpisodeNum'])
    }
    if(answers['ffmpegPath']){
        opts['ffmpegPath'] = answers['ffmpegPath']
    }
    if(answers['player']){
        opts['player'] = answers['player']
    }
    if(answers['httpProxy']){
        opts['httpProxy'] = answers['httpProxy']
    }
    if(answers['httpCookies']){
        opts['httpCookies'] = answers['httpCookies']
    }
    if(answers['streamManual']){
        opts['streamManual'] = answers['streamManual']
    }
    if(answers['enableAria2c']){
        opts['enableAria2c'] = answers['enableAria2c']
    }
    if(answers['extractorNum']){
        opts['extractorNum'] = answers['extractorNum']
    }
    return opts
}
exports = module.exports = { parsePackageInfo, optsParser, promptOpts}