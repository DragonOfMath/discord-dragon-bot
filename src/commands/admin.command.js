const Constants = require('../Constants');

/**
	cmd_admin.js
	Command file for private (owner-only) bot commands.
*/
module.exports = {
	'runjs': {
		aliases: ['evaljs'],
		category: 'Admin',
		title: 'Run JavaScript',
		info: 'Run JavaScript code within the bot.',
		parameters: ['...code'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client,clientID,input,cmd,cmds,arg,args,channel,channelID,server,serverID,user,userID,message,messageID}) {
			return eval(arg);
		}
	},
	'stop': {
		aliases: ['stopbot','quit','abort','exit','ctrlq'],
		category: 'Admin',
		title: 'Stop Bot',
		info: 'Stops execution of the bot (Optional flag arguments: `-noidle`, `-nodc`, `-nosave`, `-nomsg`)',
		parameters: ['[...flags]'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args}) {
			return client.stop(args);
		}
	},
	'proxy': {
		aliases: ['ghost'],
		category: 'Admin',
		info: 'Send a message through the bot to another dimension.',
		parameters: ['target','...message'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args, channelID}) {
			let [target,...message] = args;
			try {
				target = target.match(/<#(\d+)>/)[1];
			} catch (e) {
				target = channelID;
			}
			message = message.join(' ');
			client.simulateTyping(target)
			.then(() => client.wait(5000))
			.then(() => client.send(target, message))
			.catch(console.error);
		}
	},
	'ignore': {
		category: 'Admin',
		info: 'Toggles ignoring users other than the bot owner.',
		parameters: ['[boolean]'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args, channelID}) {
			client._ignoreUsers = Boolean(args[0]);
			if (client._ignoreUsers) {
				return 'Set to ignore users.';
			} else {
				return 'No longer ignoring users.';
			}
		}
	},
	'alias': {
		category: 'Admin',
		info: 'Adds a temporary alias for a command.',
		parameters: ['...command:alias'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args}) {
			var pairs = args.map(a => a.split(Constants.Symbols.KEY));
			var result = [];
			for (var [cmd,alias] of pairs) {
				var cmds = client.commands.get(cmd);
				if (cmds.length == 1) {
					cmd = cmds[0];
					cmd.addAlias(alias);
					result.push(`\`${alias}\` => \`${cmd.fullID}\``);
				} else {
					throw `\`${cmd}\` is an invalid command identifier.`;
				}
			}
			return result.join('\n');
		}
	},
	'embeds': {
		category: 'Admin',
		info: 'Toggles the use of embeds in messages.',
		parameters: ['[boolean]'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args}) {
			client.ENABLE_EMBEDS = args[0] ? Boolean(args[0]) : !client.ENABLE_EMBEDS;
			return 'Embedding is now ' + (client.ENABLE_EMBEDS ? 'enabled' : 'disabled');
		}
	}
};
