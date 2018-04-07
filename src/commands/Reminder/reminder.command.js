const Reminder = require('./Reminder');
const {Markdown:md} = require('../../Utils');

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
		fn({client, userID, args}) {
			try {
				var time = Date.now(), mult, text;
				for (var i = 0; i < args.length; ++i) {
					mult = Number(args[i]);
					if (isFinite(mult)) {
						switch (args[++i].toLowerCase()) {
							case 's':
							case 'sec':
							case 'secs':
							case 'second':
							case 'seconds':
								time += mult * SECOND;
								break;
							case 'm':
							case 'min':
							case 'mins':
							case 'minute':
							case 'minutes':
								time += mult * MINUTE;
								break;
							case 'h':
							case 'hr':
							case 'hrs':
							case 'hour':
							case 'hours':
								time += mult * HOUR;
								break;
							case 'd':
							case 'day':
							case 'days':
								time += mult * DAY;
								break;
							case 'w':
							case 'wk':
							case 'wks':
							case 'week':
							case 'weeks':
								time += mult * WEEK;
								break;
							case 'mo':
							case 'mos':
							case 'month':
							case 'months':
								time += mult * MONTH;
								break;
							case 'y':
							case 'yr':
							case 'yrs':
							case 'year':
							case 'years':
								time += mult * YEAR;
								break;
							default:
								time += mult * SECOND;
								break;
						}
					} else {
						text = args.slice(i).join(' ');
						break;
					}
				}
				time = Math.round(time);
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

