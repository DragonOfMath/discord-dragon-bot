/**
	Command file for debugging tools.
*/

const {Markdown:md,paginate} = require('../Utils');
const DiscordUtils = require('../DiscordUtils');

module.exports = {
	'logging': {
		category: 'Debug',
		title: 'Logging',
		info: 'Sets the logging level of the bot.\n- 0 = Don\'t log anything\n- 1 = Dont\'t log errors and warnings\n- 2 = Normal logging\n- 3 = Log everything',
		parameters: ['level'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args}) {
			client._level = Math.max(0, Math.min(args[0], 3));
			return 'Logging level set to ' + md.bold(['None','Limited','Normal','All'][client._level]);
		}
	},
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
	},
	'list': {
		category: 'Admin',
		title: 'Listing',
		info: 'Listing for all users, channels, servers, and roles.',
		permissions: {
			type: 'private'
		},
		suppress: true,
		subcommands: {
			'users': {
				aliases: ['members'],
				title: 'Listing | Users',
				info: 'List all users the bot has access to. Optionally, filter by server ID.',
				parameters: ['[serverID]', '[page]'],
				permissions: {
					type: 'private'
				},
				suppress: true,
				fn({client, args, serverID}) {
					var [sID, page] = args;
					if (typeof(sID) === 'number') {
						page = sID;
						sID = '';
					}
					var server = client.servers[sID];
					var thisServer = client.servers[serverID];
					var users;
					if (server) {
						users = DiscordUtils.getServerUsers(client.users, server);
					} else {
						users = DiscordUtils.getObjects(client.users);
					}
					return paginate(users, page, 20, function (users, idx, user) {
						// find the servers this user is in
						var userServers = DiscordUtils.getServersByUser(client.servers, user);
						var inThisServer = userServers.includes(thisServer);
						return {
							name: 'ID: ' + user.id,
							value: (inThisServer ? md.mention(user) : md.atUser(user)) + ' (Servers: ' + userServers.map(s => s.name).join(', ') + ')'
						};
					});
				}
			},
			'roles': {
				title: 'Listing | Roles',
				info: 'List all roles the bot has access to. Optionally, filter by server ID.',
				parameters: ['[serverID]', '[page]'],
				permissions: {
					type: 'private'
				},
				suppress: true,
				fn({client, args, serverID}) {
					var [sID, page] = args;
					if (typeof(sID) === 'number') {
						page = sID;
						sID = '';
					}
					var server = client.servers[sID];
					var thisServer = client.servers[serverID];
					var roles;
					if (server) {
						roles = DiscordUtils.getServerRoles(server);
					} else {
						roles = DiscordUtils.getAllRoles(client.servers);
					}
					return paginate(roles, page, 20, function (r, i, role) {
						var server = DiscordUtils.getServerByRole(client.servers, role);
						var inThisServer = server === thisServer;
						return {
							name: 'ID: ' + role.id,
							value: (inThisServer ? md.role(role) : md.atRole(role)) + ' (Server: ' + server.name + ')'
						};
					});
				}
			},
			'channels': {
				title: 'Listing | Channels',
				info: 'List all channels the bot has access to. Optionally, filter by server ID.',
				parameters: ['[serverID]', '[page]'],
				permissions: {
					type: 'private'
				},
				suppress: true,
				fn({client, args, serverID}) {
					var [sID, page] = args;
					if (typeof(sID) === 'number') {
						page = sID;
						sID = '';
					}
					var server = client.servers[sID];
					var thisServer = client.servers[serverID];
					var channels;
					if (server) {
						channels = DiscordUtils.getServerChannels(server);
					} else {
						channels = DiscordUtils.getObjects(client.channels);
					}
					return paginate(channels, page, 20, function (channels, idx, channel) {
						var server = DiscordUtils.getServerByChannel(client.servers, channel);
						var inThisServer = server === thisServer;
						return {
							name: 'ID: ' + channel.id,
							value: (inThisServer ? md.channel(channel) : md.atChannel(channel)) + ' (Server: ' + server.name + ')'
						};
					});
				}
			},
			'servers': {
				aliases: ['guilds'],
				title: 'Listing | Servers',
				info: 'List all servers the bot has access to. Optionally, filter by servers that a user is in.',
				parameters: ['[userID]', '[page]'],
				permissions: {
					type: 'private'
				},
				suppress: true,
				fn({client, args, serverID}) {
					var [user, page] = args;
					if (typeof(user) === 'number') {
						page = user;
						user = '';
					} else {
						user = md.userID(user);
					}
					user = client.users[user];
					var thisServer = client.servers[serverID];
					var servers;
					if (user) {
						servers = DiscordUtils.getServersByUser(client.servers, user);
					} else {
						servers = DiscordUtils.getObjects(client.servers);
					}
					return paginate(servers, page, 20, function (servers, idx, server) {
						var owner  = client.users[server.owner_id];
						var size   = Object.keys(server.members).length;
						var inThisServer = owner.id in thisServer.members;
						return {
							name: 'ID: ' + server.id,
							value: server.name + ' (Owner: ' + (inThisServer ? md.mention(owner) : md.atUser(owner)) + ' | Members: ' + size + ')'
						};
					});
				}
			}
		}
	}
};

