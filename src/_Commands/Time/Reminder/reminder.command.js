const Reminder = require('./Reminder');
const Constants = require('../../../Constants/Time');
const {Markdown:md,Format:fmt,Date} = require('../../../Utils');

module.exports = {
	'reminder': {
		aliases: ['remindme', 'setreminder'],
		title: 'Set Reminder',
		category: 'Misc',
		info: 'Set a reminder to be sent to your DMs at or after a specified time. After setting, you will be given the ID of the reminder in case you want to cancel it. If you wish to repeat a reminder at intervals starting at your scheduled time, use the flag `-every`/`-repeat`, ex:`-repeat:1d` to send a reminder every day (minimum of 1 hour).',
		parameters: ['<on|at|in|after>','time', '...text'],
		flags: ['every|repeat'],
		permissions: 'inclusive',
		fn({client, userID, args, flags}) {
			try {
				let time, mode = String(args.shift()).toLowerCase();
				if (mode == 'on' || mode == 'at') {
					time = Date.parseFuzzyDateOrTime(args, Date.now());
				} else if (mode == 'in' || mode == 'after') {
					time = Date.parseDuration(args, Date.now());
				} else {
					throw 'Invalid time mode.';
				}
				
				let text = args.join(' ');
				let repeat = Date.parseDuration(flags.get('every') || flags.get('repeat') || 0);
				if (repeat && repeat < Constants.HOUR) {
					repeat = Constants.HOUR;
				}
				
				client.database.get('client').modify(client.id, DATA => {
					DATA.reminders = DATA.reminders || [];
					DATA.reminders.push(new Reminder(userID, text, time, repeat));
					return DATA;
				}).save();
				
				let str = `${md.mention(userID)} Okay! I will notify you at ${md.bold(new Date(time).toLocaleString())}`;
				if (repeat) {
					str += ` and every ${fmt.time(repeat)} after that.`;
				}
				str += ` To cancel this, use the reminder ID \`${time}\` with the cancel command.`;
				return str;
			} catch (e) {
				console.log(e);
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
						let reminder;
						client.database.get('client').modify(client.id, DATA => {
							DATA.reminders = DATA.reminders || [];
							let idx = DATA.reminders.findIndex(r => r.who == userID && r.when == reminderID);
							if (idx == -1) throw 'There is no reminder with the ID `' + reminderID + '` stored for you.';
							reminder = new Reminder(DATA.reminders[idx]);
							DATA.reminders.splice(idx, 1);
							return DATA;
						}).save();
						return 'Reminder for ' + md.bold(reminder.date.toLocaleString()) + ' canceled.';
					} catch (e) {
						return e;
					}
				}
			},
			'repeat': {
				aliases: ['loop','toggle'],
				title: 'Repeat Reminder',
				info: 'Set a reminder to repeat at intervals or stop repeating (fulfills after its last update). Interval minimum is 1 hour.',
				parameters: ['reminderID','<stop|every>','[...interval]'],
				fn({client, userID, args}) {
					let [reminderID,option,...interval] = args;
					try {
						let reminder = (client.storage.reminders || []).find(r => r.who == userID && r.when == reminderID);
						if (!reminder) {
							throw 'There is no reminder with the ID `' + reminderID + '` stored for you.';
						}
						if (option == 'stop') {
							reminder.repeat = 0;
						} else {
							reminder.repeat = Math.max(Constants.HOUR, Date.parseDuration(interval));
						}
						client.database.get('client').save();
						
						let str = 'The reminder ' + md.code(reminderID);
						if (option == 'stop') {
							str += ' will stop repeating after ';
						} else {
							str += ' will repeat every ' + md.underline(fmt.time(reminder.repeat)) + ' starting at ';
						}
						str += md.bold(new Date(reminder.when).toLocaleString()) + '.';
						return str;
					} catch (e) {
						return e;
					}
				}
			},
			'upcoming': {
				aliases: ['list','check'],
				title: 'My Reminders',
				info: 'List your upcoming reminders.',
				fn({client, userID}) {
					let reminders = (client.storage.reminders||[]).filter(r => r.who == userID);
					if (reminders.length) {
						reminders = reminders.sort((r1,r2) => r1.when > r2.when ? 1 : r1.when < r2.when ? -1 : 0);
						return 'Your reminders:\n' + reminders.map(r => new Reminder(r).toString()).join('\n');
					} else {
						return 'You have no reminders.';
					}
				}
			}
		}
	}
};
