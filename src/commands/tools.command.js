/**
	Command file for miscellaneous helpful commands.
*/

const DiscordUtils = require('../DiscordUtils');
const {Markdown:md} = require('../Utils');

module.exports = {
	'invite': {
		title: 'Invite:mailbox_with_mail:',
		category: 'Misc',
		info: 'Gives you a link to add the bot to your servers.',
		permissions: 'public',
		fn({client, userID}) {
			// DM the link
			return client.send(userID, 'Here is the link to add me to your servers:\n' + client.inviteURL + '&permissions=' + client.PERMISSIONS)
			.then(() => 'Check your DMs for my invite!~');
		}
	},
	'help': {
		aliases: ['?', 'whatis'],
		category: 'Misc',
		title: 'Help',
		info: 'Lists bot commands, or shows information about a command.',
		parameters: ['[command]'],
		permissions: 'public',
		fn({client, arg, userID, server}) {
			if (arg && client.commands.has(arg)) {
				var cmd = client.commands.get(arg)[0];
				return cmd.embed(client, server);
			} else {
				return client.commands.embed(client, userID == client.ownerID);
			}
		}
	},
	'category': {
		aliases: ['categories'],
		category: 'Misc',
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
				return client.commands.categories.join(', ');
			}
		}
	},
	'caniuse': {
		aliases: ['allowed'],
		category: 'Misc',
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
		category: 'Misc',
		info: 'Removes the bot\'s last post in this channel (in case it posts something stupid).',
		permissions: 'public',
		fn({client, channelID}) {
			return client.undo(channelID);
		}
	},
	'redo': {
		aliases: ['f5'],
		category: 'Misc',
		info: 'Re-runs the last command you or a specific user gave, except for `redo` and `undo`.',
		parameters: ['[user]'],
		permissions: 'public',
		fn({client, channelID, userID, args}) {
			if (args[0]) userID = md.userID(args[0]) || userID;
			return client.redo(channelID, userID);
		}
	},
	'contact': {
		aliases: ['message','bugreport','report'],
		category: 'Misc',
		info: 'Send a direct message to the bot owner with your attached message. Let me know if you\'ve encountered a bug, have an idea for the bot, or just wanted to say hi! :smiley:',
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
			// why doesn't this send???
			return client.send(client.ownerID, message)
			.then(() => ':mailbox: Message sent!');
		}
	}
};
