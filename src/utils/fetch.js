const request = require('request');

const USER_AGENT = 'DragonBot (DragonOfMath @ github)';

function fetch(url, options = {}) {
	options.url     = options.url || url;
	options.json    = /\.json\b/i.test(options.url);
	options.headers = {'User-Agent': USER_AGENT};
	return new Promise((resolve,reject) => {
		request(options, function (error, response, body) {
			if (error) {
				reject(error);
			} else if (response.statusCode !== 200) {
				reject('Status Code: '+response.statusCode);
			} else try {
				resolve(body);
			} catch (e) {
				reject(e.message);
			}
		});
	});
}

module.exports = {fetch};