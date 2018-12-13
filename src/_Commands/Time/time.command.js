const {Markdown:md,Format:fmt,Date} = require('../../Utils');

module.exports = {
	'timer': {
		aliases: ['stopwatch'],
		category: 'Misc',
		title: ':stopwatch:',
		info: 'Set a timer. Format example: 3 hours 2 minutes 5 seconds OR 00:30:10.00.',
		parameters: ['...time'],
		permissions: 'inclusive',
		fn({client, channelID, userID, args}) {
			let time = Date.parseDuration(args);
			if (!time) throw `${md.mention(userID)} You provided an invalid time.`;
			setTimeout(() => {
				client.send(channelID, `:stopwatch: | ${md.mention(userID)} ${md.bold('Time\'s up!')}`)
			}, time);
			return 'Timer set to ' + md.bold(fmt.timestamp(time)) + '. Go!';
		}
	},
	'timezone': {
		aliases: ['tz'],
		category: 'Misc',
		title: 'Timezone',
		info: 'Get the current time in another timezone, either using the timezone abbreviation ("EST") or the IANA region code ("America/New York") *(Daylight Savings not applied yet)*.',
		parameters: ['[tzcode]'],
		permissions: 'inclusive',
		fn({client, args}) {
			if (!args.length) {
				return {
					timestamp: new Date(),
					fields: [
						{
							name: ':clock2: Hawaii',
							value: Date.getTimezoneTimeString('HDT'),
							inline: true
						},
						{
							name: ':clock6: Denver, Colorado',
							value: Date.getTimezoneTimeString('MST'),
							inline: true
						},
						{
							name: ':clock8: New York City',
							value: Date.getTimezoneTimeString('EST'),
							inline: true
						},
						
						{
							name: ':clock10: São Paulo, Brazil',
							value: Date.getTimezoneTimeString('BRT'),
							inline: true
						},
						{
							name: ':clock12: Greenwich Mean Time',
							value: Date.getTimezoneTimeString('UTC'),
							inline: true
						},
						{
							name: ':clock3: Moscow, Russia',
							value: Date.getTimezoneTimeString('MSK'),
							inline: true
						},
						
						{
							name: ':clock5: Bombay, India',
							value: Date.getTimezoneTimeString('IST'),
							inline: true
						},
						{
							name: ':clock8: Singapore',
							value: Date.getTimezoneTimeString('SST'),
							inline: true
						},
						{
							name: ':clock10: Canberra, Australia',
							value: Date.getTimezoneTimeString('AEST'),
							inline: true
						}
					],
					footer: {
						text: '(DST not applied.)'
					}
				};
			} else {
				let tz = args.join('_').toUpperCase();
				let time = Date.getTimezoneTimeString(tz);
				return {
					fields: [
						{
							name: ':clock: ' + tz,
							value: time,
							inline: true
						}
					]
				};
			}
		}
	}
};

