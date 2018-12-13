const {fetch,Markdown:md,Format:fmt} = require('../../Utils');

module.exports = {
	'weather': {
		aliases: ['forecast'],
		category: 'Misc',
		title: 'Weather',
		info: 'Gets the current weather at a city/zip code. If specifying a city of a specific region, use `city,region` format.',
		parameters: ['city|city,region|zip,region|lat,lon'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, arg}) {
			let apiKey = client.apiKeys.OpenWeatherMap;
			if (!apiKey) {
				throw 'Need API key!';
			}
			let qs = {units: 'imperial',appid: apiKey};
			if (!isNaN(arg)) {
				qs.id = arg;
			} else if (/^\d+,\w+$/.test(arg)) {
				qs.zip = arg;
			} else if (/^\d+,\d+$/.test(arg)) {
				let [lat,lon] = arg.match(/\d+/g);
				qs.lat = lat;
				qs.lon = lon;
			} else {
				qs.city = arg;
			}
			return fetch('http://api.openweathermap.org/data/2.5/weather', {qs})
			.then(data => {
				// TODO: display weather data
			});
		}
	}
};
