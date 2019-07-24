'use strict';
const path = require('path')

exports = module.exports = function(params){
	let match_rules = require(path.join(__dirname,'../match_rules'))
	let parser
	for (var rule in match_rules){
		if(match_rules[rule].test(params.url)){
			parser = require(path.join(__dirname,'../parser/'+rule));
			break
		}
	}
	if(!parser)
		console.log(`Not Supported For [${params.url}]`)
	return parser
}