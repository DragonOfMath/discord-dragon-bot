/**
	Information command module
	Retrieves and displays info about the bot, users, roles, channels, and servers.
*/

const {Markdown:md,Format:fmt,strcmp,substrcmp,paginate} = require('../Utils');
const DiscordUtils = require('../DiscordUtils');

function commands(client) {
	var total = client.commands.get().length;
	var topcmds = client.commands.length;
	var subcmds = total - topcmds;
	return [{
		name: ':dragon: Prefix',
		value: client.PREFIX,
		inline: true
	},
	{
		name: ':keyboard: Commands',
		value: `${total} (main: ${topcmds} | sub: ${subcmds})`,
		inline: true
	}];
}
function developer(client) {
	return [{
		name: ':cowboy: Owner/Developer',
		value: md.mention(client.ownerID),
		inline: true
	}];
}
function uptime(client) {
	return [{
		name: ':timer: Uptime',
		value: fmt.timestamp(client.uptime),
		inline: true
	}];
}
function ping(client) {
	return [{
		name: ':stopwatch: Ping',
		value: fmt.time(client.internals.ping),
		inline: true
	}];
}
function memory(client) {
	return [{
		name: ':control_knobs: Memory Usage',
		value: fmt.bytes(client.memory.rss),
		inline: true
	}];
}
function performance(client) {
	return [
		...uptime(client),
		...ping(client),
		...memory(client)
	];
}
function version(client) {
	return [{
		name: ':white_check_mark: Version',
		value: 'DragonBot ' + client.VERSION,
		inline: true
	},
	{
		name: ':package: Library',
		value: 'discord.io ' + client.internals.version,
		inline: true
	}];
}
function sourcecode(client) {
	return [{
		name: ':file_cabinet: GitHub',
		value: `[Repository Link](${client.SOURCE_CODE})`,
		inline: true
	}];
}
function stats(client) {
	return [{
		name: ':homes: Guilds',
		value: Object.keys(client.servers).length,
		inline: true
	},
	{
		name: ':mega: Channels',
		value: Object.keys(client.channels).length,
		inline: true
	},
	{
		name: ':busts_in_silhouette: Users',
		value: Object.keys(client.users).length,
		inline: true
	}];
}
function list(objects, page, valueFn) {
	return paginate(objects, page, 25, (_,i,o) => {
		return {
			name: 'ID: ' + o.id,
			value: valueFn(o)
		};
	});
}
function ID(id) {
	return ' (ID: ' + md.code(id) + ')';
}

module.exports = {
	'bot': {
		category: 'Info',
		info: 'Shows bot info, such as command count, uptime, ping, memory usage, and version, as well as a count of guilds, channels, and users.',
		permissions: 'public',
		fn({client, channelID}) {
			return {
				fields: [
					...commands(client),
					...developer(client),
					...stats(client),
					...performance(client),
					...version(client),
					...sourcecode(client)
				]
			};
		},
		subcommands: {
			'commands': {
				aliases: ['cmds'],
				info: 'Displays the number of commands currently registered.',
				fn({client}) {
					return {fields: commands(client)};
				}
			},
			'developer': {
				aliases: ['dev','owner'],
				info: 'Displays the bot\'s developer.',
				fn({client}) {
					return {fields: developer(client)};
				}
			},
			'performance': {
				info: 'Displays uptime, pint, and memory usage.',
				fn({client, channelID}) {
					return {fields: performance(client)};
				}
			},
			'uptime': {
				aliases: ['up'],
				info: 'Displays how long the bot has been running.',
				fn({client}) {
					return {fields: uptime(client)};
				}
			},
			'ping': {
				aliases: ['ms'],
				info: 'Checks bot latency.',
				fn({client, channelID}) {
					return {fields: ping(client)};
				}
			},
			'memory': {
				aliases: ['mem'],
				info: 'Checks bot memory usage.',
				fn({client}) {
					return {fields: memory(client)};;
				}
			},
			'version': {
				info: 'Shows bot and library versions.',
				fn({client}) {
					return {fields: version(client)};
				}
			},
			'src': {
				aliases: ['source','sourcecode','repo','github'],
				info: 'Gives link to GitHub repository that has the bot\'s source code, for whatever reason.',
				fn({client}) {
					return {fields: sourcecode(client)};
				}
			},
			'stats': {
				info: 'Shows how many guilds, channels, and users the bot is connected to.',
				fn({client}) {
					return {fields: stats(client)};
				}
			},
			'commits': {
				aliases: ['commit'],
				info: 'Get commit history on the bot.',
				parameters: ['[commitID]'],
				fn({client, args}) {
					if (args[0]) {
						return client.SOURCE_CODE + 'commit/' + args[0];
					} else {
						return client.SOURCE_CODE + 'commits/master';
					}
				}
			},
			'shard': {
				info: 'Get shard ID, not that it really matters at the moment...',
				fn({client}) {
					return client._shard ? `Shard ${client._shard[0]}/${client._shard[1]}` : 'No sharding.';
				}
			}
		}
	},
	'info': {
		category: 'Info',
		title: 'Info',
		info: 'Information interface for Discord resources.',
		permissions: 'public',
		subcommands: {
			'message': {
				title: 'Info | Message',
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
				title: 'Info | Channel',
				info: 'Displays information about a channel.',
				parameters: ['[channel]'],
				fn({client, args, channelID}) {
					var channel = DiscordUtils.resolve(client.channels, md.channelID(args[0]), args[0], channelID);
					if (!channel) {
						throw 'Invalid channel ID.';
					}
					return DiscordUtils.embedChannel(channel);
				}
			},
			'server': {
				aliases: ['guild'],
				title: 'Info | Server',
				info: 'Displays information about a server.',
				parameters: ['[serverID]'],
				fn({client, args, serverID}) {
					var server = DiscordUtils.resolve(client.servers, args[0], serverID);
					if (!server) {
						throw 'Invalid server ID.';
					}
					return DiscordUtils.embedServer(server, client);
				}
			},
			'user': {
				aliases: ['member'],
				title: 'Info | Member',
				info: 'Displays information about a user.',
				parameters: ['[userID]'],
				fn({client, args, userID, server}) {
					var member = DiscordUtils.resolve(server.members, md.userID(args[0]), args[0], userID);
					var user = client.users[member.id];
					if (!user) {
						throw 'Invalid user ID.';
					}
					return DiscordUtils.embedUser(user, member, server);
				}
			},
			'role': {
				aliases: [],
				title: 'Info | Role',
				info: 'Displays information about a role.',
				parameters: ['roleID'],
				fn({client, args, server}) {
					var role = DiscordUtils.resolve(server.roles, md.roleID(args[0]), args[0]);
					if (!role) {
						throw 'Invalid role ID.';
					}
					return DiscordUtils.embedRole(role, server);
				}
			},
			'invite': {
				title: 'Info | Invite',
				info: 'Reveals information about a server invite.',
				parameters: ['invite'],
				fn({client, args}) {
					var inviteCode = args[0].match(/discord.gg\/(.+)/);
					if (inviteCode) inviteCode = inviteCode[1];
					else inviteCode = args[0];
					return client.queryInvite(inviteCode)
					.then(response => DiscordUtils.embedInvite(response))
					.catch(e => {
						client.error(e);
						return 'Invalid Invite Code: ' + inviteCode;
					});
				}
			},
			'snowflake': {
				aliases: ['id'],
				title: 'Info | Snowflake',
				info: 'Analyze and identify information about a snowflake ID.',
				parameters: ['id'],
				permissions: 'private',
				fn({client, args}) {
					let id      = args[0];
					let user    = client.users[id];
					let channel = client.channels[id];
					let server  = client.servers[id];
					return {
						description: 'ID: ' + md.code(id),
						timestamp: DiscordUtils.getCreationTime(id),
						fields: [
							{
								name: 'User',
								value: user ? md.mention(user) : 'No match'
							},
							{
								name: 'Channel',
								value: channel ? (md.atChannel(channel) + ' in ' + client.servers[channel.guild_id].name ) : 'No match'
							},
							{
								name: 'Server',
								value: server ? server.name : 'No match'
							}
						]
					};
				}
			},
			'token': {
				title: 'Info | Token',
				info: 'Analyze and identify information about a Discord Token',
				parameters: ['token'],
				permissions: 'private',
				fn({client, args}) {
					let token = args[0];
					let tokenInfo = DiscordUtils.decodeToken(token);
					let user = client.users[tokenInfo.id];
					return {
						fields: [
							{
								name: 'ID',
								value: md.code(tokenInfo.id) + ' -> ' + (user ? md.mention(user) : 'no matching user')
							},
							{
								name: 'Timestamp',
								value: md.code(tokenInfo.time.getTime()) + ' -> ' + tokenInfo.time.toString()
							},
							{
								name: 'HMAC (not verifiable)',
								value: md.code(tokenInfo.hmac)
							}
						]
					};
				}
			}
		}
	},
	'list': {
		category: 'Info',
		title: 'Listing',
		info: 'Listing interface for all users, roles, and channels in this server.',
		permissions: 'public',
		subcommands: {
			'users': {
				aliases: ['members'],
				title: 'Listing | Users',
				info: 'List members of this server.',
				parameters: ['[page]'],
				fn({client, args, server}) {
					var users = DiscordUtils.getServerUsers(client.users, server);
					return list(users, args[0], md.mention);
				}
			},
			'roles': {
				title: 'Listing | Roles',
				info: 'List roles of this server.',
				parameters: ['[page]'],
				fn({client, args, server}) {
					var roles = DiscordUtils.getServerRoles(server);
					return list(roles, args[0], md.role);
				}
			},
			'channels': {
				title: 'Listing | Channels',
				info: 'List channels of this server.',
				parameters: ['[page]'],
				fn({client, args, server}) {
					var channels = DiscordUtils.getServerChannels(server);
					return list(channels, args[0], md.channel);
				}
			},
			'all': {
				aliases: ['every'],
				title: 'Listing | All',
				info: 'Listing interface for all users, roles, channels, and servers the bot has access to.',
				permissions: 'private',
				suppress: true,
				subcommands: {
					'users': {
						aliases: ['members'],
						title: 'Listing | All Users',
						info: 'List all users the bot has access to. Optionally, filter by server ID.',
						parameters: ['[serverID]', '[page]'],
						fn({client, args, server: thisServer}) {
							let [serverID, page] = args;
							if (typeof(serverID) === 'number') {
								page = serverID;
								serverID = '';
							}
							let users;
							if (client.servers[serverID]) {
								users = DiscordUtils.getServerUsers(client.users, client.servers[serverID]);
							} else {
								users = DiscordUtils.getObjects(client.users);
							}
							return list(users, page, user => {
								// find the servers this user is in
								let userServers = DiscordUtils.getServersByUser(client.servers, user);
								return (userServers.includes(thisServer) ?
									md.mention(user) :
									md.atUser(user)) + ' (Servers: ' + userServers.map(s => s.name).join(', ') + ')';
							});
						}
					},
					'roles': {
						title: 'Listing | All Roles',
						info: 'List all roles the bot has access to. Optionally, filter by server ID.',
						parameters: ['[serverID]', '[page]'],
						fn({client, args, server: thisServer}) {
							let [serverID, page] = args;
							if (typeof(serverID) === 'number') {
								page = serverID;
								serverID = '';
							}
							let roles;
							if (client.servers[serverID]) {
								roles = DiscordUtils.getServerRoles(client.servers[serverID]);
							} else {
								roles = DiscordUtils.getAllRoles(client.servers);
							}
							return list(roles, page, role => {
								server = DiscordUtils.getServerByRole(client.servers, role);
								return (server === thisServer ?
									md.role(role) :
									md.atRole(role)) + ' (Server: ' + server.name + ')';
							});
						}
					},
					'channels': {
						title: 'Listing | All Channels',
						info: 'List all channels the bot has access to. Optionally, filter by server ID.',
						parameters: ['[serverID]', '[page]'],
						fn({client, args, server: thisServer}) {
							let [serverID, page] = args;
							if (typeof(serverID) === 'number') {
								page = serverID;
								serverID = '';
							}
							let channels;
							if (client.servers[serverID]) {
								channels = DiscordUtils.getServerChannels(client.servers[serverID]);
							} else {
								channels = DiscordUtils.getObjects(client.channels);
							}
							return list(channels, page, channel => {
								let server = DiscordUtils.getServerByChannel(client.servers, channel);
								return (server === thisServer ?
									md.channel(channel) :
									md.atChannel(channel)) + ' (Server: ' + server.name + ')';
							});
						}
					},
					'servers': {
						aliases: ['guilds'],
						title: 'Listing | All Servers',
						info: 'List all servers the bot has access to. Optionally, filter by servers that a user is in.',
						parameters: ['[userID]', '[page]'],
						fn({client, args, server: thisServer}) {
							let [user, page] = args;
							if (typeof(user) === 'number') {
								page = user;
								user = '';
							} else {
								user = md.userID(user) || user;
							}
							user = client.users[user];
							let servers;
							if (user) {
								servers = DiscordUtils.getServersByUser(client.servers, user);
							} else {
								servers = DiscordUtils.getObjects(client.servers);
							}
							return list(servers, page, server => {
								let owner = client.users[server.owner_id];
								let size  = Object.keys(server.members).length;
								return server.name + ' (Owner: ' +
									(owner.id in thisServer.members ?
										md.mention(owner) :
										md.atUser(owner)) +
									' | Members: ' + size + ')';
							});
						}
					}
				}
			}
		}
	},
	'search': {
		aliases: ['find', 'lookup', 'query'],
		category: 'Info',
		title: 'Search',
		info: 'Search a message in the current channel, up to 1000 messages into history.',
		parameters: ['...keywords'],
		permissions: 'public',
		fn({client, args, channelID}) {
			let [index, ...keywords] = args;
			let limit = 0;
			let isSearching = false;
			
			if (isNaN(index)) {
				limit = 100;
				keywords.unshift(index);
				isSearching = true;
			} else {
				limit = Math.max(1, Math.min(~~index, 99)) + 1; // skip lookup command
			}
			
			keywords = keywords.join(' ');
			
			return client.getAll(channelID, limit)
			.then(messages => {
				let foundIndex;
				if (isSearching) {
					for (let m = 1; m < messages.length; m++) {
						if (substrcmp(messages[m].content, keywords)) {
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
						embed: DiscordUtils.embedMessage(messages[foundIndex])
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
				fn({client, args, server}) {
					let [discrim, ...keywords] = args;
					if (isNaN(discrim) || String(discrim).length !== 4) {
						keywords.unshift(discrim);
						discrim = '';
					}
					keywords = keywords.join(' ');
					
					let users = DiscordUtils.getServerUsers(client.users, server);
					let matches = DiscordUtils.search(users, user => {
						let member = server.members[user.id];
						let nick = member.nick;
						return user.discriminator == discrim || substrcmp(user.username, keywords) || (nick && substrcmp(nick, keywords));
					});
					return list(matches, 1, md.mention);
				}
			},
			'role': {
				aliases: ['roles'],
				title: 'Search | Roles',
				info: 'Search for roles with the given keywords in their name.',
				parameters: ['...keywords'],
				fn({client, arg: keywords, server}) {
					let matches = DiscordUtils.search(server.roles, role => {
						return substrcmp(role.name, keywords);
					});
					return list(matches, 1, md.role);
				}
			},
			'channel': {
				aliases: ['channels'],
				title: 'Search | Channels',
				info: 'Search for channels with the given keywords in their name.',
				parameters: ['[...keywords]'],
				fn({client, arg: keywords, server}) {
					let matches = DiscordUtils.search(server.channels, channel => {
						return substrcmp(channel.name, keywords);
					});
					return list(matches, 1, md.channel);
				}
			},
			'status': {
				title: 'Search | Users by Status',
				info: 'Search users with the given discriminator.',
				parameters: ['<online|offline|idle|invisible|dnd>'],
				fn({client, args, server}) {
					let status = args[0];
					let matches = DiscordUtils.search(server.members, member => {
						return strcmp(member.status, status);
					});
					return list(matches, 1, md.mention);
				}
			},
			'all': {
				aliases: ['every', 'global'],
				title: 'Search | All',
				info: 'Search interface for finding a user, role, or channel in any server.',
				permissions: 'private',
				suppress: true,
				subcommands: {
					'user': {
						aliases: ['users'],
						title: 'Search | All Users',
						info: 'Search all users with the given keywords in their name OR discriminator.',
						parameters: ['discriminator | keyword','[...more keywords]'],
						fn({client, args, server}) {
							var [disc, ...keywords] = args;
							if (isNaN(disc) || String(disc).length !== 4) {
								keywords.unshift(disc);
								disc = '';
							}
							keywords = keywords.join(' ');
							
							var matches = DiscordUtils.search(client.users, user => {
								return user.discriminator == disc || substrcmp(user.username, keywords);
							});
							return list(matches, 1, user => {
								return (user.id in server.members) ?
									md.mention(user) :
									md.atUser(user);
							});
						}
					},
					'role': {
						aliases: ['roles'],
						title: 'Search | All Roles',
						info: 'Search all roles with the given keywords in their name.',
						parameters: ['...keywords'],
						fn({client, arg: keywords, server}) {
							var roles = DiscordUtils.getAllRoles(client.servers);
							var matches = DiscordUtils.search(roles, role => {
								return substrcmp(role.name, keywords);
							});
							return list(matches, 1, role => {
								return (role.id in server.roles) ?
									md.role(role) :
									md.atRole(role);
							});
						}
					},
					'channel': {
						aliases: ['channels'],
						title: 'Search | All Channels',
						info: 'Search all channels with the given keywords in their name.',
						parameters: ['...keywords'],
						fn({client, arg: keywords, server}) {
							var matches = DiscordUtils.search(server.channels, channel => {
								return substrcmp(channel.name, keywords);
							});
							return list(matches, 1, channel => {
								return (channel.id in server.channels) ?
									md.channel(channel) :
									md.atChannel(channel);
							});
						}
					},
					'server': {
						aliases: ['servers'],
						title: 'Search | All Servers',
						info: 'Search all servers with the given keywords in their name.',
						parameters: ['...keywords'],
						fn({client, arg: keywords}) {
							var matches = DiscordUtils.search(client.servers, server => {
								return substrcmp(server.name, keywords);
							});
							return list(matches, 1, server => server.name);
						}
					}
				}
			}
		}
	}
};
