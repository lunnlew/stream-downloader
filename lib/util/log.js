'use strict';
const logger = require('pino')({
	base:null,
	prettyPrint:true
},{
   write : (str) => { process.stdout.write(str) }
})
var getLogger = function(opts){
	logger.level = silent?'silent':'debug'
	return logger
}
exports = module.exports = {getLogger}