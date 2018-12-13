const {fetch,Format:fmt} = require('../../Utils');

module.exports = {
	'ip': {
		aliases: ['address'],
		category: 'Admin',
		title: 'Get IP Address',
		info: 'Looks up the IP address and location of a website/domain.',
		parameters: ['website'],
		permissions: 'private',
		suppress: true,
		analytics: false,
		fn({client, args}) {
			let address = String(args[0]).replace(/https?:\/\//,'');
			return fetch('http://ip-api.com/json/' + address, {json:true})
			.then(body => {
				if (body.status == 'fail') {
					throw body.message;
				}
				return {
					title: address,
					fields: [
						{
							name: 'IP',
							value: body.query || 'N/A',
							inline: true
						},
						{
							name: 'City',
							value: body.city || 'N/A',
							inline: true
						},
						{
							name: 'State/Province',
							value: body.regionName || 'N/A',
							inline: true
						},
						{
							name: 'Country',
							value: body.country || 'N/A',
							inline: true
						},
						{
							name: 'Coordinates',
							value: (body.lat && body.lon) ? fmt.coordinates(body.lat, body.lon) : 'N/A',
							inline: true
						},
						{
							name: 'ISP',
							value: body.isp || 'N/A',
							inline: true
						}
					]
				};
			});
		}
	}
};
