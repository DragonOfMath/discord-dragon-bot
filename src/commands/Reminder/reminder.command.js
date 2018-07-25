const Reminder = require('./Reminder');
const {Markdown:md,parseTime} = require('../../Utils');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;
const WEEK   = 7  * DAY;
const MONTH  = 30 * DAY;
const YEAR   = 12 * MONTH;

module.exports = {
	'reminder': {
		title: 'Set Reminder',
		category: 'Misc',
		info: 'Set a reminder to be sent to your DMs after a specified time. After setting, you will be given the ID of the reminder in case you want to cancel it.',
		aliases: ['remindme', 'setreminder', 'note'],
		parameters: ['...time', '...text'],
		permissions: 'inclusive',
		fn({client, userID, args}) {
			try {
				var time = Date.now() + parseTime(args);
				var text = args.join(' ');
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
					var reminderID = args[0];
					try {
						client.database.get('client').modify(client.id, DATA => {
							DATA.reminders = DATA.reminders || [];
							var id = DATA.reminders.findIndex(r => r.who == userID && r.when == reminderID);
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

