const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36'
]

var get = function(){
	return userAgents[parseInt(Math.random() * userAgents.length)]
}

exports = module.exports = { userAgents, get }