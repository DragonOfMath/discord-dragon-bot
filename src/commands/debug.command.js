/**
	Command file for debugging tools.
*/

const {Markdown:md} = require('../Utils');
const DiscordUtils = require('../DiscordUtils');

module.exports = {
	'console': {
		category: 'Debug',
		title: 'Console',
		info: 'Interface for printing information to the console window.',
		permissions: {
			type: 'private'
		},
		suppress: true,
		subcommands: {
			'log': {
				title: 'Console | Log',
				info: 'General logging of information.',
				parameters: ['...data'],
				permissions: {
					type: 'private'
				},
				fn({client,args}) {
					client.log(...args);
				}
			},
			'info': {
				title: 'Console | Info',
				info: 'Information-level logging of information.',
				parameter: ['...data'],
				permissions: {
					type: 'private'
				},
				fn({client,args}) {
					client.info(...args);
				}
			},
			'warn': {
				title: 'Console | Warn',
				info: 'Warning-level logging of information.',
				parameters: ['...data'],
				permissions: {
					type: 'private'
				},
				fn({client,args}) {
					client.warn(...args);
				}
			},
			'error': {
				title: 'Console | Error',
				info: 'Error-level logging of information.',
				parameters: ['...data'],
				permissions: {
					type: 'private'
				},
				fn({client,args}) {
					client.error(...args);
				}
			},
			'clear': {
				title: 'Console | Clear',
				info: 'Clears the console.',
				permissions: {
					type: 'private'
				},
				fn({client}) {
					console.clear();
				}
			}
		}
	},
	'echo': {
		aliases: ['print','test','display'],
		category: 'Debug',
		info: 'Display the arguments. Useful for expressions.',
		parameters: ['...arguments'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args}) {
			return md.codeblock(args.map(String).join(' '));
		}
	},
	'memdump': {
		aliases: ['snapshot'],
		category: 'Debug',
		title: 'Memory Snapshot',
		info: 'Takes a snapshot of the internal client data.',
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client}) {
			client.snapshot('debug');
			return 'Snapshot of memory saved.';
		}
	},
	'backup': {
		category: 'Backup',
		title: 'Database Backup',
		info: 'Creates a backup of the database.',
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client}) {
			client.database.backup();
			return 'Database backup created.';
		}
	},
	'debug': {
		category: 'Admin',
		title: 'Debug',
		info: 'Debugging tools for Discord resources.',
		subcommands: {
			'message': {
				title: 'Debug | Message',
				info: 'Displays information about a message.',
				parameters: ['[messageID]'],
				fn({client, args, channelID, messageID}) {
					var id = args[0] || messageID;
					return client.getMessage({channelID, messageID: id})
					.then(DiscordUtils.embedMessage)
					.catch(e => {
						client.error(e);
						return 'Invalid Message ID: ' + id;
					});
				}
			},
			'channel': {
				title: 'Debug | Channel',
				info: 'Displays information about a channel.',
				parameters: ['[channel]'],
				fn({client, args, channelID}) {
					var id = md.channelID(args[0]) || channelID;
					var channel = client.channels[id];
					if (!channel) {
						throw 'Invalid channel ID.';
					}
					return DiscordUtils.embedChannel(channel);
				}
			},
			'server': {
				aliases: ['guild'],
				title: 'Debug | Server',
				info: 'Displays information about a server.',
				parameters: ['[serverID]'],
				fn({client, args, serverID}) {
					var id = args[0] || serverID;
					var server = client.servers[id];
					if (!server) {
						throw 'Invalid server ID.';
					}
					return DiscordUtils.embedServer(server, client);
				}
			},
			'user': {
				aliases: ['member'],
				title: 'Debug | Member',
				info: 'Displays information about a user.',
				parameters: ['userID'],
				fn({client, args, userID, server}) {
					var id = md.userID(args[0]);
					var member = server.members[id];
					if (!member) {
						throw 'Invalid member ID.';
					}
					var user = client.users[id];
					if (!user) {
						throw 'Invalid user ID.';
					}
					return DiscordUtils.embedUser(user, member, server);
				}
			},
			'role': {
				aliases: [],
				title: 'Debug | Role',
				info: 'Displays information about a role.',
				parameters: ['roleID'],
				fn({client, args, server}) {
					let id = md.roleID(args[0]);
					let role = server.roles[id];
					if (!role) {
						throw 'Invalid role ID.';
					}
					return DiscordUtils.embedRole(role, server);
				}
			},
			'invite': {
				title: 'Debug | Invite',
				info: 'Reveals information about a server invite.',
				parameters: ['invite'],
				fn({client, args}) {
					var inviteCode = args[0].match(/discord.gg\/(.+)/);
					if (inviteCode) inviteCode = inviteCode[1];
					else inviteCode = args[0];
					return client.queryInvite(inviteCode)
					.then(DiscordUtils.embedInvite)
					.catch(e => {
						client.error(e);
						return 'Invalid Invite Code: ' + inviteCode;
					});
				}
			}
		}
	}
};

