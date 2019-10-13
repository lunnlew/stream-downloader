#!/usr/bin/env node

'use strict';
const path = require('path')
const usage = require(path.join(__dirname, './lib/usage'))
const streamdl = require(path.join(__dirname, './lib/stream-dl'))

streamdl.exec(usage.optsParser(process.argv, usage.parsePackageInfo()))