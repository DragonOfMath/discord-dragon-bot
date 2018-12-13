const Reminder = require('./Reminder');
const {Markdown:md,Date} = require('../../../Utils');

module.exports = {
	'reminder': {
		aliases: ['remindme', 'setreminder'],
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
	}
};
