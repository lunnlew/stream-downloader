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
            {
                option: 'help',
                alias: 'h',
                type: 'Boolean',
                default: false,
                description: 'Help and usage instructions'
            },
            {
                option: 'version',
                alias: 'V',
                type: 'Boolean',
                default: false,
                description: 'Version number'
            },
            {
                option: 'info-only',
                alias: 'i',
                type: 'Boolean',
                default: false,
                description: 'Info Only output'
            },
            {
                option: 'ffmpeg',
                alias: 'f',
                type: 'String',
                default: "ffmpeg",
                description: 'ffmpeg path'
            },
            {
                option: 'concurrency',
                alias: 'cn',
                type: 'Int',
                description: 'download concurrency num'
            },
            {
                option: 'output',
                alias: 'o',
                type: 'String',
                default: "",
                description: 'ffmpeg output filepath, example: output.mp4'
            },
            {
                option: 'http-proxy',
                type: 'String',
                default: "",
                description: 'http proxy, example: --http-proxy http://127.0.0.1:1080'
            },
            {
                option: 'stream-id',
                alias: 'F',
                type: 'String',
                default: "",
                description: 'Video Fmt:4k,BD,TD,TD_H265,HD,HD_H265,SD,LD'
            },
            {
                option: 'manual',
                alias: 'M',
                type: 'Boolean',
                default: false,
                description: 'manual selected video fmt'
            },
            {
                option: 'player',
                alias: 'p',
                type: 'String',
                default: "",
                description: 'Stream extracted URL to a PLAYER'
            },
            {
                option: 'play-num',
                alias: 'pn',
                type: 'Int',
                description: 'play video num'
            },
            {
                option: 'verbose',
                alias: 'v',
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
exports = module.exports = { parsePackageInfo, optsParser }