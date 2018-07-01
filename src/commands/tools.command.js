/**
	Command file for miscellaneous helpful commands.
*/

const {Markdown:md} = require('../Utils');

module.exports = {
	'invite': {
		title: 'Invite:mailbox_with_mail:',
		category: 'Misc',
		info: 'Gives you a link to add the bot to your servers.',
		permissions: 'public',
		fn({client, userID}) {
			// prepare permissions for inviting
			var link = 'Here is the link to add me to your servers:\n' + client.inviteURL + '&permissions=' + client.PERMISSIONS;
			// DM the link
			client.sendMessage({to: userID, message: link});
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
	}
};
