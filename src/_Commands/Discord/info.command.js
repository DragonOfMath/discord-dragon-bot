/**
	Information command module
	Retrieves and displays info about the bot, users, roles, channels, and servers.
*/

const {
	UserListViewer,
	RoleListViewer,
	ChannelListViewer,
	ServerListViewer
} = require('./ListViewers');

const FilePromise = require('../../Structures/FilePromise');
const {
	Markdown:md,
	Format:fmt,
	strcmp,
	substrcmp,
	DiscordUtils,
	random
} = require('../../Utils');

function commands(client) {
	var total = client.commands.get().length;
	var topcmds = client.commands.length;
	var subcmds = total - topcmds;
	return [{
		name: ':exclamation: Prefix',
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
		value: fmt.timestamp(client.uptime) + (client.downtime ? `\n(-${fmt.timestamp(client.downtime)} downtime)` : ''),
		inline: true
	}];
}
function downtime(client) {
	return [{
		name: ':hourglass: Downtime',
		value: client.downtime ? fmt.timestamp(client.downtime) : 'no downtime :smile:',
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
function docs(client) {
	return [{
		name: ':pencil: Documentation',
		value: md.link('README', client.SOURCE_CODE + '/README.md') + '\n'
		     + md.link('CHANGELOG', client.SOURCE_CODE + '/CHANGELOG.md') + '\n'
			 + md.link('TODO', client.SOURCE_CODE + '/TODO.md'),
		inline: true
	}];
}


module.exports = {
	'bot': {
		aliases: ['client'],
		category: 'Discord',
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
					return {
						fields: commands(client),
						footer: {
							text: 'For a full list of commands, see documentation on GitHub.'
						}
					};
				}
			},
			'developer': {
				aliases: ['dev','owner'],
				info: 'Displays the bot\'s developer.',
				fn({client}) {
					return {
						fields: developer(client),
						footer: {
							text: 'Want to help develop this bot? Let me know on GitHub or Discord.'
						}
					};
				}
			},
			'health': {
				aliases: ['performance'],
				info: 'Displays uptime, ping, and memory usage.',
				fn({client, channelID}) {
					return {
						fields: performance(client),
						footer: {
							text: 'This bot is hosted locally. I apologize in advance for any downtime.'
						}
					};
				}
			},
			'uptime': {
				aliases: ['up'],
				info: 'Displays how long the bot has been running.',
				fn({client}) {
					return {fields: uptime(client)};
				}
			},
			'downtime': {
				aliases: ['down'],
				info: 'Displays how long it had lost connection to Discord since starting up.',
				fn({client}) {
					return {fields: downtime(client)};
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
				aliases: ['v'],
				info: 'Shows bot and library versions.',
				fn({client}) {
					return {
						fields: version(client),
						footer: {
							text: 'See the changelog on GitHub for what\'s new.'
						}
					};
				}
			},
			'src': {
				aliases: ['source','sourcecode','repo','github'],
				info: 'Gives link to GitHub repository that has the bot\'s source code, for whatever reason.',
				fn({client}) {
					return {
						fields: sourcecode(client),
						footer: {
							text: 'If you support this bot, feel free to star the repo and recommend it!'
						}
					};
				}
			},
			'stats': {
				info: 'Shows how many guilds, channels, and users the bot is connected to.',
				fn({client}) {
					return {
						fields: stats(client),
						footer: {
							text: 'Message count not recorded yet.'
						}
					};
				}
			},
			'commits': {
				aliases: ['commit'],
				title: 'Bot Commits',
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
				title: 'Bot Shard',
				info: 'Get shard ID, not that it really matters at the moment...',
				fn({client}) {
					return client._shard ? `Shard ${client._shard[0]}/${client._shard[1]}` : 'No sharding.';
				}
			},
			'readme': {
				aliases: ['info'],
				title: 'Bot Readme',
				info: 'Get the bot readme information.',
				parameters: ['[section]'],
				fn({client, args}) {
					return FilePromise.read('./README.md')
					.then(markdown => md.getSection(markdown, args[0]));
				}
			},
			'changelog': {
				aliases: ['changes','updates'],
				title: 'Bot Changelog',
				info: 'Get the bot changelog information.',
				parameters: ['[section]'],
				fn({client, args}) {
					return FilePromise.read('./CHANGELOG.md')
					.then(markdown => md.getSection(markdown, args[0]));
				}
			},
			'todo': {
				aliases: ['contributing'],
				title: 'Bot To-Do',
				info: 'Get the bot to-do information.',
				parameters: ['[section]'],
				fn({client, args}) {
					return FilePromise.read('./TODO.md')
					.then(markdown => md.getSection(markdown, args[0]));
				}
			}
		}
	},
	'info': {
		category: 'Discord',
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
					var user = DiscordUtils.resolve(client.users, md.userID(args[0]), args[0], userID);
					var member = server.members[user.id];
					return DiscordUtils.embedUser(user, member, client);
				}
			},
			'role': {
				aliases: [],
				title: 'Info | Role',
				info: 'Displays information about a role.',
				parameters: ['roleID'],
				fn({client, args, server}) {
					var role = DiscordUtils.resolve(client.roles, md.roleID(args[0]), args[0]);
					if (!role) {
						throw 'Invalid role ID.';
					}
					return DiscordUtils.embedRole(role, server);
				}
			},
			'invite': {
				title: 'Info | Invite',
				info: 'Reveals information about a server invite. (doesn\'t work on vanity invites)',
				parameters: ['code'],
				fn({client, args}) {
					var inviteCode;
					try {
						inviteCode = args[0].match(/discord.gg\/(.+)/)[1];
					} catch (e) {
						inviteCode = args[0];
					}
					return client.queryInvite(inviteCode)
					.then(response => DiscordUtils.embedInvite(response))
					.catch(e => {
						client.error(e);
						return 'Invalid Invite Code: ' + md.code(inviteCode);
					});
				}
			},
			'snowflake': {
				aliases: ['id'],
				title: 'Info | Snowflake',
				info: 'Analyze and identify information about a snowflake ID.',
				parameters: ['id'],
				permissions: 'public',
				fn({client, args}) {
					let id      = args[0];
					let user    = client.users[id];
					let role    = client.roles[id];
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
								name: 'Role',
								value: role ? md.role(role) : 'No match'
							},
							{
								name: 'Channel',
								value: channel ? md.channel(channel) : 'No match'
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
				info: 'Analyze and identify information about a Discord Token. (Devnote: don\'t worry, this bot can only produce fake tokens to play around with)',
				parameters: ['token'],
				permissions: 'public',
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
			},
			'permissions': {
				title: 'Info | Permissions',
				info: 'Get a list of permissions.',
				parameters: ['value'],
				permissions: 'public',
				fn({client, args}) {
					let perms = DiscordUtils.getPermissionNames(args[0]);
					return `${md.code(args[0])} = ${perms.map(md.code).join(', ')}`;
				}
			}
		}
	},
	'list': {
		category: 'Discord',
		title: 'Listing',
		info: 'Listing interface for all users, roles, and channels in this server.',
		permissions: 'public',
		subcommands: {
			'users': {
				aliases: ['members'],
				title: 'Listing | Users',
				info: 'List members of this server.',
				fn({client, context}) {
					let users = DiscordUtils.getServerUsers(client.users, context.server);
					let viewer = new UserListViewer(context, users);
					viewer.startBrowser(client);
				}
			},
			'roles': {
				title: 'Listing | Roles',
				info: 'List roles of this server.',
				fn({client, context}) {
					let viewer = new RoleListViewer(context, context.server.roles);
					viewer.startBrowser(client);
				}
			},
			'channels': {
				title: 'Listing | Channels',
				info: 'List channels of this server.',
				fn({client, context}) {
					let viewer = new ChannelListViewer(context, context.server.channels);
					viewer.startBrowser(client);
				}
			},
			'servers': {
				aliases: ['guilds'],
				title: 'Listing | Servers',
				info: 'List all servers the bot has access to. Optionally, filter by servers that are shared with a user.',
				parameters: ['[userID]'],
				permissions: 'private',
				suppress: true,
				fn({client, context, server: thisServer, args}) {
					let userID = md.userID(args[0]) || args[0];
					let user = client.users[userID];
					let servers;
					if (user) {
						servers = DiscordUtils.getServersByUser(client.servers, user);
					} else {
						servers = DiscordUtils.getObjects(client.servers);
					}
					let viewer = new ServerListViewer(context, servers, user);
					viewer.startBrowser(client);
				}
			},
			'all': {
				aliases: ['every'],
				title: 'Listing | All',
				info: 'Listing interface for ALL users, roles, channels, and servers the bot has access to. For privacy reasons, this is hidden.',
				permissions: 'private',
				suppress: true,
				subcommands: {
					'users': {
						aliases: ['members'],
						title: 'Listing | All Users',
						info: 'List all users the bot has access to. Optionally, filter by server ID.',
						parameters: ['[serverID]'],
						fn({client, context, server, args}) {
							let serverID = args[0], users;
							if (client.servers[serverID]) {
								users = DiscordUtils.getServerUsers(client.users, client.servers[serverID]);
							} else {
								users = DiscordUtils.getObjects(client.users);
							}
							
							let viewer = new UserListViewer(context, users, client.servers);
							viewer.startBrowser(client);
						}
					},
					'roles': {
						title: 'Listing | All Roles',
						info: 'List all roles the bot has access to. Optionally, filter by server ID.',
						parameters: ['[serverID]'],
						fn({client, context, args}) {
							let serverID = args[0], roles;
							if (serverID in client.servers) {
								console.log('Filtering roles by server ' + serverID);
								roles = DiscordUtils.getServerRoles(client.servers[serverID]);
							} else {
								roles = DiscordUtils.getAllRoles(client.servers);
							}
							
							let viewer = new RoleListViewer(context, roles, client.servers);
							viewer.startBrowser(client);
						}
					},
					'channels': {
						title: 'Listing | All Channels',
						info: 'List all channels the bot has access to. Optionally, filter by server ID.',
						parameters: ['[serverID]'],
						fn({client, context, args, server: thisServer}) {
							let serverID = args[0], channels;
							if (client.servers[serverID]) {
								channels = DiscordUtils.getServerChannels(client.servers[serverID]);
							} else {
								channels = DiscordUtils.getObjects(client.channels);
							}
							
							let viewer = new ChannelListViewer(context, channels, client.servers);
							viewer.startBrowser(client);
						}
					}
				}
			}
		}
	},
	'search': {
		aliases: ['find', 'lookup', 'query'],
		category: 'Discord',
		title: 'Search',
		info: 'Search a message in the current channel, up to 1000 messages into history.',
		parameters: ['[channel]','...keywords'],
		permissions: 'public',
		fn({client, args, channelID}) {
			let keywords = args.slice();
			let limit = 1000;
			let isSearching = false;
			
			if (md.channelID(keywords[0])) {
				channelID = md.channelID(keywords.shift());
			}
			
			keywords = keywords.join(' ');
			
			return client.getMessages({channelID, limit})
			.then(messages => {
				let foundIndex = -1;
				for (let m = 1; m < messages.length; m++) {
					if (substrcmp(messages[m].content, keywords)) {
						foundIndex = m;
						break;
					}
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
					
					let viewer = new UserListViewer(context, matches, server);
					viewer.startBrowser(client);
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
					
					let viewer = new RoleListViewer(context, matches, server);
					viewer.startBrowser(client);
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
					
					let viewer = new ChannelListViewer(context, matches, server);
					viewer.startBrowser(client);
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
						fn({client, context, args}) {
							var [disc, ...keywords] = args;
							if (isNaN(disc) || String(disc).length !== 4) {
								keywords.unshift(disc);
								disc = '';
							}
							keywords = keywords.join(' ');
							
							var matches = DiscordUtils.search(client.users, user => {
								return user.discriminator == disc || substrcmp(user.username, keywords);
							});
							
							let viewer = new UserListViewer(context, matches, client.servers);
							viewer.startBrowser(client);
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
							let viewer = new RoleListViewer(context, matches, client.servers);
							viewer.startBrowser(client);
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
							let viewer = new ChannelListViewer(context, matches);
							viewer.startBrowser(client);
						}
					},
					'server': {
						aliases: ['servers'],
						title: 'Search | All Servers',
						info: 'Search all servers with the given keywords in their name.',
						parameters: ['...keywords'],
						fn({client, context, arg: keywords}) {
							var matches = DiscordUtils.search(client.servers, server => {
								return substrcmp(server.name, keywords);
							});
							let viewer = new ServerListViewer(context, matches);
							viewer.startBrowser(client);
						}
					}
				}
			}
		}
	},
	'quote': {
		category: 'Discord',
		info: 'Quote a message in the channel. Or quote a random message by someone.',
		parameters: ['[channel]','[messageID]'],
		permissions: 'inclusive',
		fn({client, channelID, args}) {
			let messageID = args[args.length-1];
			if (!messageID) {
				throw 'I need a message to quote!';
			}
			if (md.channelID(args[0])) {
				channelID = md.channelID(args[0]);
			}
			let userID = md.userID(messageID);
			if (userID) {
				return client.getMessages({channelID,limit:100})
				.then(messages => messages.filter(message => message.author.id == userID))
				.then(random)
				.then(quote);
			} else {
				return client.getMessage({channelID, messageID}).then(quote);
			}
			
			function quote(message) {
				if (!message) {
					throw 'Couldn\'t find a message to quote!';
				}
				return {
					description: `${md.bold('\u201C')} ${message.content} ${md.bold('\u201D')}\n\n -- ${message.author.username}, ${md.italics(md.channel(channelID))}`,
					timestamp: message.timestamp,
					author: {
						name: message.author.username,
						icon_url: DiscordUtils.getAvatarURL(message.author)
					},
					footer: {
						text: 'ID: ' + message.id
					}
				};
			}
		}
	}
};
