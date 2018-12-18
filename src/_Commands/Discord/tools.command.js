const {Markdown:md,RSS,DiscordUtils,tableify} = require('../../Utils');
const PERMISSION_FLAGS = require('../../Constants/Permissions').FLAGS;
const DISCORD_STATUS = require('../../Constants/Discord').STATUS_URL;

const ping = require('ping');

module.exports = {
	'help': {
		aliases: ['halp'],
		category: 'Discord',
		title: 'Help',
		info: 'Lists bot commands, or shows information about a command.',
		parameters: ['[command]'],
		permissions: 'public',
		fn({client, arg, userID, server}) {
			if (arg == 'me') {
				return 'No.';
			}
			if (arg && client.commands.has(arg)) {
				var cmd = client.commands.get(arg)[0];
				return cmd.embed(client, server);
			} else {
				return 'Click here for a full list of commands: ' + client.SOURCE_CODE+'blob/master/docs/index.md';
				//return 'Help machine :b:roke.';
			}
		}
	},
	'ping': {
		title: ':ping_pong: Pong!',
		category: 'Discord',
		info: 'Basic heartbeat/latency checkup command, or ping an address.',
		parameters: ['[url]'],
		permissions: 'public',
		fn({client,args,channelID}) {
			if (args.length) {
				return ping.promise.probe(args[0])
				.then(data => data.output)
				.catch(data => data.error||data.output||data);
			} else {
				return client.latency(channelID)
				.then(latency => `Ping: ${client.internals.ping}ms | API Latency: ${latency}ms`);
			}
		}
	},
	'invite': {
		title: 'Invite:mailbox_with_mail:',
		category: 'Discord',
		info: 'Gives you a link to add the bot to your servers.',
		permissions: 'public',
		fn({client, userID, isDM}) {
			// DM the link
			return client.send(userID, 'Here is the link to add me to your servers:\n' + client.inviteUrl)
			.then(() => isDM ? '' : 'Check your DMs for my invite!~')
			.catch(e => 'I can\'t send my invite to you. ' + e);
		}
	},
	'category': {
		aliases: ['categories'],
		category: 'Discord',
		title: 'Category Info',
		info: 'Lists bot categories, or shows commands under that category.',
		parameters: ['[category]'],
		permissions: 'public',
		fn({client, args}) {
			var cat = client.commands.resolveCategory(args[0]);
			if (cat) {
				var cmds = client.commands.getCategoryCommands(cat);
				return {
					title: `${cat}: Commands`,
					description: md.codeblock(cmds.map(c => c.fullID).join(', '),'')
				};
			} else {
				return client.commands.categories.join(', ') + '\n\nTo see commands under a category, use this command on one of the categories shown above.';
			}
		}
	},
	'caniuse': {
		aliases: ['allowed'],
		category: 'Discord',
		title: 'Can I Use...',
		info: 'Checks your permissions to use a command. Optionally, you may specify which channel to use it in.',
		parameters: ['command','[channel]'],
		permissions: 'public',
		fn({client, context, args}) {
			var cmd = args[0], channelID = md.channelID(args[1]) || context.channelID;
			var command = client.commands.get(cmd)[0];
			if (!command) {
				throw `${md.code(cmd)} is not a recognized command.`;
			}
			var channel = client.channels[channelID];
			var fakeContext = Object.assign({}, context, {channel,channelID});
			var g = command.permissions.check({client, context: fakeContext});
			if (g.granted) {
				return `${md.code(command.fullID)} in ${md.channel(channel)}? Yes.`;
			} else {
				return `${md.code(command.fullID)} in ${md.channel(channel)}? No: ${g.reason}`;
			}
		}
	},
	'undo': {
		aliases: ['oops'],
		category: 'Discord',
		info: 'Removes the bot\'s last post in this channel (in case it posts something stupid).',
		permissions: 'public',
		fn({client, channelID}) {
			return client.undo(channelID);
		}
	},
	'redo': {
		aliases: ['f5'],
		category: 'Discord',
		info: 'Re-runs the last command you or a specific user gave, except for `redo` and `undo`.',
		parameters: ['[user]'],
		permissions: 'public',
		fn({client, channelID, userID, args}) {
			if (args[0]) userID = md.userID(args[0]) || userID;
			return client.redo(channelID, userID);
		}
	},
	'contact': {
		aliases: ['message','feedback','bugreport','report','suggest'],
		category: 'Discord',
		info: 'Send a direct message to the bot owner. Let me know if you\'ve encountered a bug, have an idea for the bot, or just wanted to say hi! :smiley:',
		parameters: ['...message'],
		permissions: 'public',
		fn({client, channel, server, user, messageID, arg}) {
			if (arg.length > 1000) {
				throw 'Message is limited to 1000 characters.';
			}
			
			let message = {
				title: ':mailbox_with_mail: You\'ve Got Mail!',
				fields: [
					{
						name: ':bust_in_silhouette: Sender',
						value: `User: ${md.atUser(user)} (${md.code(user.id)})`,
						inline: true
					},
					{
						name: ':homes: From',
						value: `Channel: ${md.atChannel(channel)} (${md.code(channel.id)})\nServer: ${server.name} (${md.code(server.id)})`,
						inline: true
					},
					{
						name: ':envelope: Message',
						value: arg
					},
					{
						name: ':incoming_envelope: Reply',
						value: md.code(`${client.PREFIX}reply ${md.channel(channel)} ${md.mention(user)} [message]`),
						inline: true
					},
					{
						name: ':no_entry_sign: Block',
						value: md.code(`${client.PREFIX}block ${md.mention(user)} [reason]`),
						inline: true
					}
				],
				timestamp: new Date(),
				author: {
					icon_url: DiscordUtils.getAvatarURL(user)
				}
			};
			return client.send(client.ownerID, message)
			.then(() => ':mailbox: Message sent!');
		}
	},
	'permcalc': {
		aliases: ['permissions'],
		category: 'Discord',
		title: 'Permissions Calculator',
		info: 'Calculate the number that is masked by these permissions: ' + Object.keys(PERMISSION_FLAGS).map(md.code).join(', '),
		parameters: ['...flags'],
		permissions: 'inclusive',
		fn({client, args}) {
			let total = 0;
			for (let a of args) {
				let flag = a.toUpperCase();
				if (!(flag in PERMISSION_FLAGS)) {
					throw 'Invalid flag: ' + md.code(flag);
				}
				total |= 1 << PERMISSION_FLAGS[flag];
			}
			return total;
		}
	},
	'dstatus': {
		aliases: ['discordstatus'],
		category: 'Discord',
		title: 'Discord Status',
		info: 'Get the health status of Discord.',
		permissions: 'public',
		fn() {
			return RSS(DISCORD_STATUS);
		}
	},
	'nickname': {
		aliases: ['nick','nickme'],
		category: 'Discord',
		title: 'Nickname',
		info: 'Request a nickname change.',
		parameters: ['name'],
		permissions: 'public',
		fn({client, serverID, userID, arg}) {
			return client.editNickname({serverID,userID,nick:arg})
			.then(() => 'I have changed your nickname.')
			.catch(e => {
				client.error(e);
				return 'I was unable to change your nickname.';
			});
		}
	},
	'games': {
		aliases: ['findagame'],
		category: 'Discord',
		info: 'Get a list of the most popular games currently being played on the server.',
		parameters: ['[game]'],
		permissions: 'public',
		fn({client, server, arg}) {
			let users = DiscordUtils.getServerUsers(client.users, server);
			let games = DiscordUtils.getUsersByGame(users, arg);
			if (arg) {
				if (games && games.length) {
					`Currently, ${md.bold(fmt.plural('user',games.length))} are playing ${md.bold(arg)}.`;
				} else {
					`Looks like nobody is playing ${md.bold(arg)} at the moment. :(`;
				}
			} else {
				let gameNames = Object.keys(games);
				if (gameNames.length) {
					gameNames = gameNames.sort((g1,g2) => {
						if (games[g1].length < games[g2].length) return 1;
						if (games[g1].length > games[g2].length) return -1;
						return 0;
					});
					
					let embed = tableify(['Game','Users'], gameNames, (name, idx) => {
						return [name, games[name].length];
					}, 0, 10);
					embed.title = 'Popular Games on ' + server.name;
					
					return embed;
				} else {
					return 'Looks like nobody is playing any games at the moment. :(';
				}
			}
		}
	}
};
