const Birthday = require('./Birthday');
const {Markdown:md,Format:fmt,Date} = require('../../../Utils');
const {DAY} = require('../../../Constants/Time');

module.exports = {
	'birthday': {
        aliases: ['bday','birthdays','bdays'],
        title: 'Birthday',
        info: 'Input your birthday date so that this bot wishes you happy birthday! If you want your birthday to be announced publicly in the current channel, append the flag `-announce`.',
        parameters: ['[date]'],
		flag: ['announce'],
        permissions: 'inclusive',
        fn({client, channelID, userID, args, flags}) {
            if (args.length) {
                let date = Birthday.parse(args.join(' '));
                if (date == null) {
                    throw 'Invalid birthday format: Try `MM-DD-YYYY` or `Month Day, Year`.'
                }
				if (date > Date.now()) {
					throw 'You can\'t enter a birthday that is past today\'s date.';
				}
				if (date < Date.now()-3.7e12) {
					throw 'You can\'t enter a date that early!';
				}
				Birthday.modify(client, userID, bday => {
					bday.date = date;
					bday.announce = md.channelID(flags.get('announce')) || userID;
				});
                return 'I will remember and wish you a happy birthday!';
            } else {
                let bday = Birthday.get(client, userID);
				if (!bday.date) {
					throw 'I don\'t know when your birthday is!';
				}
				let age = bday.years;
				let nextBday = bday.nextBirthday.toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
                return `${md.mention(userID)}, you are ${md.underline(age)} years old, and your next birthday is ${md.bold(nextBday)}.`;
            }
        },
        subcommands: {
			'announce': {
				aliases: ['channel'],
				title: 'Announce Birthday',
				info: 'Get/Set the channel that I will announce your birthday in.',
				parameters: ['[channel]'],
				fn({client, userID, args}) {
					let channelID;
					if (args.length) {
						channelID = md.channelID(args[0]);
						Birthday.modify(client, userID, bday => {
							bday.announce = channelID;
						});
					} else {
						channelID = Birthday.get(client, userID).announce;
					}
					if (channelID) {
						return 'I will announce your birthday in ' + md.channel(channelID);
					} else {
						return 'I will not announce your birthday in public.';
					}
				}
			},
			'upcoming': {
				aliases: ['list','users','server'],
				title: 'Upcoming Birthdays',
				info: 'List the upcoming birthdays of users in this server.',
				fn({client, server}) {
					let bdays = Birthday.getUpcomingBirthdays(client, server);
					if (bdays.length) {
						return 'Upcoming birthdays in the server:\n' + bdays.slice(0,10).map(({user,date}) => {
							let daysLeft = Math.ceil((date.getTime() - Date.now()) / DAY) * DAY;
							return `${date.toLocaleDateString()}: ${md.bold(md.atUser(user))} (${fmt.time(daysLeft)} left)`;
						}).join('\n');
					} else {
						return 'Aww, nobody has any birthdays?';
					}
				}
			},
			'today': {
				aliases: ['celebrating'],
				title: 'Today\'s Birthdays',
				info: 'Lists users who are celebrating their birthdays today.',
				fn({client, server}) {
					let bdays = Birthday.getTodaysBirthdays(client, server);
					if (bdays.length) {
						return 'Happy Birthday to these user(s)!\n' + bdays.map(({user,bday}) => {
							return `${md.bold(md.atUser(user))} (${bday.years})`;
						}).join('\n');
					} else {
						return 'It\'s no one\'s birthday today...';
					}
				}
			},
            'remove': {
                aliases: ['delete','undo','forget'],
                title: 'Remove Birthday',
                info: 'If you change your mind and don\'t want me knowing your birthday, you can remove it from my database.',
                fn({client, userID,args}) {
					if (userID == client.ownerID) {
						// just in case a user no longer has birthdays :(
						userID = md.userID(args[0]) || userID;
					}
					Birthday.delete(client, userID);
					return 'I forgot your birthday.';
                }
            }
        }
    }
};
