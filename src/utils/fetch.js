const request = require('request');
const xml2js  = require('xml2js');
const cheerio = require('cheerio');
const qs      = require('querystring');

const USER_AGENT = 'DragonBot (DragonOfMath @ github)';

async function fetch(url, options = {}) {
	options.url     = options.url || url;
	options.json    = options.json || /\.json\b/i.test(options.url);
	options.html    = options.html || /\.html?$/i.test(options.url);
	options.xml     = options.xml  || /\.xml$/i.test(options.url);
	options.headers = options.headers || {};
	options.headers['User-Agent'] = USER_AGENT;
	if (options.json) {
		options.headers['Content-Type'] = 'application/json';
	} else if (options.xml) {
		options.headers['Content-Type'] = 'application/xml';
	} else if (options.html) {
		options.headers['Content-Type'] = 'text/html';
	}
	return new Promise((resolve,reject) => {
		request(options, function (error, response, body) {
			if (error) {
				reject(error);
			} else if (response.statusCode !== 200) {
				reject('Status Code: '+response.statusCode);
			} else try {
				if (options.responseOnly) {
					resolve(response);
				} else if (options.html) {
					resolve(cheerio.load(body));
				} else if (options.xml) {
					//console.log(body);
					let x = xml2js.parseString(body, (err, result) => {
						if (err) reject(err);
						else resolve(result);
					});
				} else {
					resolve(body);
				}
			} catch (e) {
				reject(e.message);
			}
		});
	});
}

async function RSS(url, options = {}) {
	options.xml = true;
	let xmlResult = await fetch(url, options);
	//console.log(xmlResult);
	let item = xmlResult.rss.channel[0].item[0];
	//console.log(item);
	let timestamp = Date.parse(item.pubDate[0]);
	let embed = {
		title: item.title[0],
		description: cheerio.load(item.description[0]).text(),
		url: item.link[0]
	};
	if (timestamp) embed.timestamp = new Date(timestamp);
	else embed.footer = {text: item.pubDate[0]};
	return embed;
}

function encodeURIComponent(data) {
	return qs.escape(data);
}
function decodeURIComponent(data) {
	return qs.unescape(data);
}

module.exports = {fetch,RSS,encodeURIComponent,decodeURIComponent};