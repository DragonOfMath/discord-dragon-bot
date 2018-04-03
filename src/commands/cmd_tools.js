/**
	cmd_tools.js
	Command file for miscellaneous helpful commands.
*/

const {Markdown:md,strcmp}    = require('../Utils');
const {embedMessage} = require('../DiscordUtils');

function substrcmp(str, sub) {
	str = str.toLowerCase();
	sub = sub.toLowerCase();
	return str.indexOf(sub) > -1;
}

module.exports = {
	'invite': {
		title: 'Invite:mailbox_with_mail:',
		category: 'Misc',
		info: 'Gives you a link to add the bot to your servers.',
		permissions: {
			type: 'public'
		},
		fn({client, userID}) {
			// prepare permissions for inviting
			var link = client.inviteURL + '&permissions=' + client.PERMISSIONS;
			// DM the link
			client.send(userID, link);
		}
	},
	'help': {
		aliases: ['?', 'whatis'],
		category: 'Info',
		title: 'Help',
		info: 'Lists bot commands, or shows information about a command.',
		parameters: ['[command]'],
		permissions: {
			type: 'public'
		},
		fn({client, arg, userID, server}) {
			if (arg && client.commands.has(arg)) {
				let cmd = client.commands.get(arg)[0];
				return cmd.toHelpEmbed(client, server);
			} else {
				return client.commands.toHelpEmbed(client, userID == client.ownerID);
			}
		}
	},
	'category': {
		aliases: ['categories'],
		category: 'Info',
		title: 'Category Info',
		info: 'Lists bot categories, or shows commands under that category.',
		parameters: ['[category]'],
		permissions: {
			type: 'public'
		},
		fn({client, args}) {
			let cat = client.commands.resolveCategory(args[0]);
			if (cat) {
				let cmds = client.commands.getCategoryCommands(cat);
				return {
					title: `${cat}: Commands`,
					description: '```\n' + cmds.map(c => c.fullID).join(', ') + '\n```'
				};
			} else {
				return client.commands.categories.join(', ');
			}
		}
	},
	'caniuse': {
		aliases: ['allowed'],
		category: 'Info',
		title: 'Can I Use...',
		info: 'Checks your permissions to use a command.',
		parameters: ['command'],
		permissions: {
			type: 'public'
		},
		fn({client, arg, user, channel, server}) {
			let cmd = client.commands.get(arg)[0];
			if (!cmd) {
				throw `\`${arg}\` is not a recognized command.`;
			}
			var g = cmd.permissions.check({client, user, channel, server});
			if (g.granted) {
				return `\`${cmd.fullID}\`? Yes.`;
			} else {
				return `\`${cmd.fullID}\`? No. ${g.reason}`;
			}
		}
	},
	'undo': {
		aliases: ['oops'],
		category: 'Misc',
		info: 'Removes the bot\'s last post in this channel (in case it posts something stupid).',
		permissions: {
			type: 'public'
		},
		fn({client, channelID, messageID}) {
			client.undo(channelID);
		}
	},
	'search': {
		aliases: ['find', 'lookup'],
		category: 'Misc',
		title: 'Search',
		info: 'Gets a post up in history either by # of posts above yours or by search terms.',
		parameters: ['index | keyword','[...more keywords]'],
		permissions: {
			type: 'public'
		},
		fn({client, args, channelID}) {
			let [index, ...query] = args;
			let limit = 0;
			let isSearching = false;
			
			if (index == ~~index) {
				limit = Math.max(1, Math.min(~~index, 99)) + 1; // skip lookup command
			} else {
				limit = 100;
				query.unshift(index);
				isSearching = true;
			}
			
			return client.getAll(channelID, limit)
			.then(messages => {
				let foundIndex;
				if (isSearching) {
					let q = query.join(' ').toLowerCase();
					for (let m = 1; m < messages.length; m++) {
						if (messages[m].content.toLowerCase().indexOf(q) > -1) {
							foundIndex = m;
							break;
						}
					}
				} else {
					foundIndex = messages.length - 1;
				}
				if (foundIndex > -1) {
					return {
						message: `Here's a message I found ${foundIndex} posts up:`,
						embed: embedMessage(messages[foundIndex])
					};
				} else {
					return 'No matches found.';
				}
			});
		},
		subcommands: {
			'user': {
				aliases: ['users'],
				title: 'Search | Users',
				info: 'Search for usernames with the given keywords in their name OR discriminator.',
				parameters: ['discriminator | keyword','[...more keywords]'],
				permissions: {
					type: 'public'
				},
				fn({client, args, server}) {
					let [disc, ...query] = args;

					if (disc != ~~disc) {
						query.unshift(disc);
					}
					query = query.join(' ');
					
					let matches = [];
					for (let id in server.members) {
						var user = client.users[id];
						if (user.discriminator == disc || substrcmp(user.username,query)) {
							matches.push(id);
						}
					}
					return {
						description: matches.length > 0 ? matches.map(md.mention).join('\n') : 'No matches found.'
					};
				}
			},
			'role': {
				aliases: ['roles'],
				title: 'Search | Roles',
				info: 'Search for roles with the given keywords in their name.',
				parameters: ['...keywords'],
				permissions: {
					type: 'public'
				},
				fn({client, arg, server}) {
					let matches = [];
					for (let id in server.roles) {
						var role = server.roles[id];
						if (substrcmp(role.name, arg)) {
							matches.push(id);
						}
					}
					return {
						description: matches.length > 0 ? matches.map(md.role).join('\n') : 'No matches found.'
					};
				}
			},
			'channel': {
				aliases: ['channels'],
				title: 'Search | Channels',
				info: 'Search for channels with the given keywords in their name.',
				parameters: ['index | keyword','[...more keywords]'],
				permissions: {
					type: 'public'
				},
				
				fn({client, arg, server}) {
					let matches = []
					for (let id in server.channels) {
						var channel = server.channels[id];
						if (substrcmp(channel.name, arg)) {
							matches.push(id);
						}
					}
					return {
						description: matches.length > 0 ? matches.map(md.channel).join('\n') : 'No matches found.'
					};
				}
			}
		}
	}
};