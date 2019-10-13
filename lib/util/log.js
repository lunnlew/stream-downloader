'use strict';
const logger = require('pino')({
	base:null,
	prettyPrint:true,
	timestamp: () => { return `"time":${Math.round(Date.now() / 1000.0)}` }
},{
   write : (str) => { process.stdout.write(str) }
})
var getLogger = function(opts){
	logger.level = (silent>-1)?'silent':'debug'
	return logger
}
exports = module.exports = {getLogger}