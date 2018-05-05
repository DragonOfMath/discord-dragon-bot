/**
	Command file for miscellaneous helpful commands.
*/

const {Markdown:md} = require('../Utils');

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
		permissions: {
			type: 'public'
		},
		fn({client, arg, userID, server}) {
			if (arg && client.commands.has(arg)) {
				var cmd = client.commands.get(arg)[0];
				return cmd.toHelpEmbed(client, server);
			} else {
				return client.commands.toHelpEmbed(client, userID == client.ownerID);
			}
		}
	},
	'category': {
		aliases: ['categories'],
		category: 'Misc',
		title: 'Category Info',
		info: 'Lists bot categories, or shows commands under that category.',
		parameters: ['[category]'],
		permissions: {
			type: 'public'
		},
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
		info: 'Checks your permissions to use a command.',
		parameters: ['command'],
		permissions: {
			type: 'public'
		},
		fn({client, context, arg}) {
			var cmd = client.commands.get(arg)[0];
			if (!cmd) {
				throw `${md.code(arg)} is not a recognized command.`;
			}
			var g = cmd.permissions.check(context);
			if (g.granted) {
				return `${md.code(cmd.fullID)}? Yes.`;
			} else {
				return `${md.code(cmd.fullID)}? No. ${g.reason}`;
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
	}
};
