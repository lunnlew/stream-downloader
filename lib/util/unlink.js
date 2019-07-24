'use strict';
const fs = require('fs-extra')
exports = module.exports = path =>
  	new Promise((resolve, reject) => {
	  	if(fs.statSync(path).isDirectory()){
	  		fs.emptyDirSync(path)
	  		fs.rmdir(path, err => (err ? reject(err) : resolve()))
	  	}else{
	  		fs.unlink(path, err => (err ? reject(err) : resolve()))
	  	}
	  }
	)