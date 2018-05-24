const Constants = require('../Constants');
const {Markdown:md} = require('../Utils');

/**
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
		fn({client,context,input,arg}) {
			with (context) {
				return eval(arg);
			}
		}
	},
	'presence': {
		aliases: ['setpresence','botpresence'],
		category: 'Admin',
		title: 'Presence',
		info: 'Sets the bot\'s current presence.',
		parameters: ['game','[status]'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args}) {
			var [name, status = 'online'] = args;
			client.setPresence({game: {name}, type: 0, status});
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
		fn({client, args}) {
			let [channelID, ...message] = args;
			if (!(channelID in client.channels)) {
				channelID = md.channelID(channelID);
			}
			message = message.join(' ');
			client.send(channelID, message)
			.catch(client.error);
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
	'ignore': {
		category: 'Admin',
		title: 'Ignoring',
		info: 'Toggles ignoring other users and bots (the owner is not affected).',
		parameters: ['<users|bots|none>'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args, channelID}) {
			switch (args[0]) {
				case 'users':
					client._ignoreUsers = true;
					return 'Ignoring users.';
				case 'bots':
					client._ignoreBots = true;
					return 'Ignoring bots.';
				default:
					client._ignoreUsers = false;
					client._ignoreBots = false;
					return 'Not ignoring anymore.';
			}
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
			client._enableEmbedding = typeof args[0] !== 'undefined' ? Boolean(args[0]) : !client._enableEmbedding;
			return 'Embedding is now ' + (client._enableEmbedding ? 'enabled' : 'disabled');
		}
	},
	'tts': {
		aliases: ['text-to-speech','texttospeech','text2speech','t2s'],
		category: 'Admin',
		info: 'Toggles the use of text-to-speech in messages.',
		parameters: ['[boolean]'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args}) {
			client._textToSpeech = typeof args[0] !== 'undefined' ? Boolean(args[0]) : !client._textToSpeech;
			return 'Text-to-speech is now ' + (client._textToSpeech ? 'enabled' : 'disabled');
		}
	},
	'typing': {
		category: 'Admin',
		info: 'Toggles typing simulation before each message.',
		parameters: ['[boolean]'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		suppress: true,
		fn({client, args}) {
			client._simulateTyping = typeof args[0] !== 'undefined' ? Boolean(args[0]) : !client._simulateTyping;
			return 'Typing simulation is now ' + (client._simulateTyping ? 'enabled' : 'disabled');
		}
	},
	'echo': {
		aliases: ['print','display'],
		category: 'Admin',
		info: 'Display the arguments, which can be the output of an expression.',
		parameters: ['...arguments'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args}) {
			return md.codeblock(args.map(String).join(' '));
		}
	},
	'logging': {
		category: 'Admin',
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
		category: 'Admin',
		title: 'Console',
		info: 'Interface for printing information to the console window.',
		permissions: {
			type: 'private'
		},
		suppress: true,
		analytics: false,
		subcommands: {
			'log': {
				title: 'Console | Log',
				info: 'General logging of information.',
				parameters: ['...data'],
				permissions: {
					type: 'private'
				},
				analytics: false,
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
				analytics: false,
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
				analytics: false,
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
				analytics: false,
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
				analytics: false,
				fn({client}) {
					console.log('\n'.repeat(process.stdout.rows));
				}
			}
		}
	},
	'memdump': {
		aliases: ['snapshot'],
		category: 'Admin',
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
	}
};
