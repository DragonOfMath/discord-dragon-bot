const Reminder = require('./Reminder');
const {Markdown:md,Format:fmt,Date} = require('../../Utils');

module.exports = {
	'reminder': {
		aliases: ['remindme', 'setreminder', 'note'],
		title: 'Set Reminder',
		category: 'Misc',
		info: 'Set a reminder to be sent to your DMs after a specified time. After setting, you will be given the ID of the reminder in case you want to cancel it.',
		parameters: ['...time', '...text'],
		permissions: 'inclusive',
		fn({client, userID, args}) {
			try {
				let time = Date.parseDuration(args, Date.now());
				let text = args.join(' ');
				client.database.get('client').modify(client.id, DATA => {
					DATA.reminders = DATA.reminders || [];
					DATA.reminders.push(new Reminder(userID, text, time));
					return DATA;
				}).save();
				return `${md.mention(userID)} Okay! I will notify you at ${md.bold(new Date(time).toLocaleString())}. To cancel this, use the reminder ID \`${time}\` with the cancel command.`;
			} catch (e) {
				throw `${md.mention(userID)} You provided an invalid time.`;
			}
		},
		subcommands: {
			'cancel': {
				aliases: ['stop', 'ignore', 'end', 'fulfill'],
				title: 'Cancel Reminder',
				info: 'Cancel a reminder to you using its ID.',
				parameters: ['reminderID'],
				fn({client, userID, args}) {
					let reminderID = args[0];
					try {
						client.database.get('client').modify(client.id, DATA => {
							DATA.reminders = DATA.reminders || [];
							let id = DATA.reminders.findIndex(r => r.who == userID && r.when == reminderID);
							if (id) DATA.reminders.splice(id, 1);
							else throw 'There is no reminder with the ID `' + reminderID + '` stored for you.';
							return DATA;
						}).save();
					} catch (e) {
						return e;
					}
				}
			}
		}
	},
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
		info: 'Get the current time in another timezone, either using the timezone abbreviation ("EST") or the IANA region code ("America/New York").',
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

