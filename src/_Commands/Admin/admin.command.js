const Constants     = require('../../Constants');
const DocGenerator  = require('../../Commands/DocGenerator');
const FilePromise   = require('../../Structures/FilePromise');
const {Markdown:md} = require('../../Utils');

function toggle(client, setting, flag) {
	return client[setting] = flag === undefined ? !client[setting] : !!flag;
}

/**
 * Command file for private (owner-only) bot commands.
 */
module.exports = {
	'runjs': {
		aliases: ['eval'],
		category: 'Admin',
		title: 'Run JavaScript',
		info: 'Run JavaScript code within the bot.',
		parameters: ['...code'],
		permissions: 'private',
		suppress: true,
		fn({client,context,arg}) {
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
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			var [name, status = 'online'] = args;
			client.setPresence({game: {name}, type: 0, status});
		}
	},
	'stop': {
		aliases: ['stopbot','quit','abort','exit','ctrlq','die'],
		category: 'Admin',
		title: 'Stop Bot',
		info: 'Stops execution of the bot.',
		permissions: 'private',
		suppress: true,
		fn({client, flags}) {
			return client.stop(flags);
		}
	},
	'suspend': {
		aliases: ['pause'],
		category: 'Admin',
		title: 'Suspend Bot',
		info: 'Disconnects the bot for a period of time, then reconnects it.',
		parameters: ['time'],
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			return client.suspend(args[0]);
		}
	},
	'echo': {
		aliases: ['print','display'],
		category: 'Admin',
		info: 'Display the raw arguments, which can be the output of an expression.',
		parameters: ['...arguments'],
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			return md.codeblock(args.map(String).join(' '));
		}
	},
	'proxy': {
		aliases: ['ghost','reply'],
		category: 'Admin',
		info: 'Send a message through the bot to another dimension.',
		parameters: ['target','...message'],
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			let [channelID, ...message] = args;
			if (!(channelID in client.channels)) {
				channelID = md.channelID(channelID);
			}
			if (!(channelID in client.channels)) {
				throw 'Invalid channel: ' + channelID; 
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
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			var pairs = args.map(a => a.split(Constants.Symbols.KEY));
			var result = [];
			for (var [cmd,alias] of pairs) {
				var cmds = client.commands.get(cmd);
				if (cmds.length != 1) {
					throw `\`${cmd}\` is an invalid command identifier.`;
				}
				cmd = cmds[0];
				cmd.addAlias(alias);
				result.push(`\`${alias}\` => \`${cmd.fullID}\``);
			}
			return result.join('\n');
		}
	},
	'toggle': {
		category: 'Admin',
		title: 'Client Settings',
		info: 'Toggles internal client settings.',
		flags: ['embeds','tts','typing','invites','globalmentions','ignore','errors','logging'],
		fn({client, flags}) {
			let settingsChanged = {};
			if (flags.has('embeds')) {
				settingsChanged['Embeds'] = toggle(client, '_enableEmbedding', flags.get('embeds'));
			}
			if (flags.has('tts')) {
				settingsChanged['Text-To-Speech'] = toggle(client, '_textToSpeech', flags.get('tts'));
			}
			if (flags.has('typing')) {
				settingsChanged['Typing'] = toggle(client, '_simulateTyping', flags.get('typing'));
			}
			if (flags.has('invites')) {
				settingsChanged['Invites'] = toggle(client, '_allowInviteLinks', flags.get('invites'));
			}
			if (flags.has('globalmentions')) {
				settingsChanged['Global Mentions'] = toggle(client, '_allowGlobalMentions', flags.get('globalmentions'));
			}
			if (flags.has('ignore')) {
				let x = flags.get('ignore');
				switch (x) {
					case 'users':
						client._ignoreUsers = true;
						break;
					case 'bots':
						client._ignoreBots = true;
						break;
					case 'all':
						client._ignoreUsers = true;
						client._ignoreBots = true;
						break;
					default:
						client._ignoreUsers = false;
						client._ignoreBots = false;
						x = 'none';
						break;
				}
				settingsChanged['Ignore'] = x;
			}
			if (flags.has('errors')) {
				let x = flags.get('errors');
				x = Constants.Client.ERROR_HANDLING.indexOf(x);
				x = client._handleErrors = x > -1 ? x : 0;
				settingsChanged['Errors'] = Constants.Client.ERROR_HANDLING[x];
			}
			if (flags.has('logging')) {
				let x = flags.get('logging');
				if (typeof(x) === 'number') {
					client._level = Math.max(0, Math.min(x, 3));
				} else {
					client._level = Constants.Debug.LEVELS[x.toUpperCase()] || 0;
				}
				settingsChanged['Logging'] = Object.keys(Constants.Debug.LEVELS)[client._level];
			}
			return Object.keys(settingsChanged).map(key => `${key}: ${settingsChanged[key]}`).join('\n');
		}
	},
	'ignore': {
		category: 'Admin',
		title: 'Ignoring',
		info: 'Toggles ignoring other users and bots (the owner is not affected).',
		parameters: ['<users|bots|all|none>'],
		permissions: 'private',
		suppress: true,
		fn({client, args, channelID}) {
			switch (args[0]) {
				case 'users':
					client._ignoreUsers = true;
					return 'Ignoring users.';
				case 'bots':
					client._ignoreBots = true;
					return 'Ignoring bots.';
				case 'all':
					client._ignoreUsers = true;
					client._ignoreBots = true;
					return 'Ignoring users and bots.';
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
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			return 'Embedding is now ' + (toggle(client, '_enableEmbedding', args[0]) ? 'enabled' : 'disabled');
		}
	},
	'tts': {
		aliases: ['text-to-speech','texttospeech','text2speech','t2s'],
		category: 'Admin',
		info: 'Toggles the use of text-to-speech in messages.',
		parameters: ['[boolean]'],
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			return 'Text-to-speech is now ' + (toggle(client, '_textToSpeech', args[0]) ? 'enabled' : 'disabled');
		}
	},
	'typing': {
		category: 'Admin',
		info: 'Toggles typing simulation before each message.',
		parameters: ['[boolean]'],
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			return 'Typing simulation is now ' + (toggle(client, '_simulateTyping', args[0]) ? 'enabled' : 'disabled');
		}
	},
	'errors': {
		category: 'Admin',
		info: 'Toggle handling of errors.',
		parameters: ['<on|dm|off>'],
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			client._handleErrors = Constants.Client.ERROR_HANDLING.indexOf(args[0].toLowerCase());
			return 'Error handling is now set to ' + md.bold(Constants.Client.ERROR_HANDLING[client._handleErrors]);
		}
	},
	'logging': {
		category: 'Admin',
		title: 'Logging',
		info: 'Sets the logging level of the bot.\n- 0 = Don\'t log anything\n- 1 = Dont\'t log errors and warnings\n- 2 = Normal logging\n- 3 = Log everything',
		parameters: ['level'],
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			if (typeof(args[0]) === 'number') {
				client._level = Math.max(0, Math.min(args[0], 3));
			} else {
				client._level = Constants.Debug.LEVELS[args[0].toUpperCase()] || 0;
			}
			return 'Logging level set to ' + md.bold(Object.keys(Constants.Debug.LEVELS)[client._level]);
		}
	},
	'console': {
		category: 'Admin',
		title: 'Console',
		info: 'Interface for printing information to the console window.',
		permissions: 'private',
		suppress: true,
		analytics: false,
		subcommands: {
			'log': {
				//aliases: ['info','notice','warn','error'],
				title: 'Console | Log',
				info: 'General logging of information.',
				parameters: ['...data'],
				analytics: false,
				fn({client,cmds,args}) {
					client.log(...args);
				}
			},
			'info': {
				title: 'Console | Info',
				info: 'Information-level logging of information.',
				parameter: ['...data'],
				analytics: false,
				fn({client,args}) {
					client.info(...args);
				}
			},
			'notice': {
				title: 'Console | Notice',
				info: 'Notice-level logging of information.',
				parameters: ['...data'],
				analytics: false,
				fn({client,args}) {
					client.notice(...args);
				}
			},
			'warn': {
				title: 'Console | Warn',
				info: 'Warning-level logging of information.',
				parameters: ['...data'],
				analytics: false,
				fn({client,args}) {
					client.warn(...args);
				}
			},
			'error': {
				title: 'Console | Error',
				info: 'Error-level logging of information.',
				parameters: ['...data'],
				analytics: false,
				fn({client,args}) {
					client.error(...args);
				}
			},
			'clear': {
				title: 'Console | Clear',
				info: 'Clears the console.',
				analytics: false,
				fn({client}) {
					console.log('\n'.repeat(100));
				}
			}
		}
	},
	'memdump': {
		aliases: ['snapshot'],
		category: 'Admin',
		title: 'Memory Snapshot',
		info: 'Takes a snapshot of the internal client data.',
		permissions: 'private',
		suppress: true,
		fn({client}) {
			client.snapshot('debug');
			return 'Snapshot of memory saved.';
		}
	},
	'gendocs': {
		aliases: ['generatedocs'],
		category: 'Admin',
		title: 'Documentation Generator',
		info: 'Generate documentation for the bot\'s commands.',
		parameters: ['[<text|markdown|html>]'],
		permissions: 'private',
		analytics: false,
		suppress: true,
		fn({client,args}) {
			return new DocGenerator('docs/index').generate(client, args[0]);
		}
	},
	'register': {
		aliases: ['loadjs'],
		category: 'Admin',
		title: 'Register JS',
		info: 'Load a JavaScript file from the application folder and apply it .',
		parameters: ['<cmd|command|spc|session|util|utility>','path/to/js/file'],
		analytics: false,
		suppress: true,
		fn({client,args}) {
			let [type,...path] = args;
			type = type.toLowerCase();
			path = FilePromise.resolve(path.join(' '));
			
			let js;
			try {
				js = require(path);
			} catch (e) {
				throw 'Invalid path.';
			}
			
			switch (type) {
				case 'cmd':
				case 'command': {
					try {
						client.commands._register(js);
						return 'Command successfully registered.';
					} catch (e) {
						throw 'Invalid command file.';
					}
				}
				case 'spc':
				case 'session': {
					try {
						client.sessions._register(js);
						return 'Session successfully registered.';
					} catch (e) {
						throw 'Invalid session file.';
					}

				}
				case 'util':
				case 'utility': {
					try {
						for (let key in js) {
							client.utils[key] = js[key];
						}
						return 'Utilities successfullly registered.';
					} catch (e) {
						throw 'Invalid utility file.';
					}
				}
			}
		}
	},
	'block': {
		category: 'Admin',
		title: 'Block User',
		info: 'Blocks a user from using the bot. Additionally, you may set a reason for the block as well as a time limit for the block, after which the user is unblocked.',
		parameters: ['user', '[...reason]'],
		flags: ['t|time'],
		permissions: 'private',
		suppress: true,
		fn({client,args,flags}) {
			let userID = md.userID(args[0]) || args[0];
			let reason = args.slice(1).join(' ');
			let timer = flags.get('t') || flags.get('time');
			if (timer) {
				timer = Number(timer) + Date.now();
			}
			let user = client.users[userID];
			if (!user) {
				throw 'Invalid user.';
			}
			if (user.id == client.ownerID) {
				throw 'Haha very funny, but you can\'t block the bot owner. :^)';
			}
			if (user.id == client.id) {
				throw 'Haha very funny, but you can\'t block me.';
			}
			client.database.get('block').set(user.id, {reason,timer}).save();
			return md.atUser(user) + ' has been blocked from using this bot.';
		}
	},
	'unblock': {
		category: 'Admin',
		title: 'Unblock User',
		info: 'Unblocks a user and allows them to use the bot again.',
		parameters: ['user'],
		permissions: 'private',
		suppress: true,
		fn({client, args}) {
			let userID = md.userID(args[0]) || args[0];
			let user = client.users[userID];
			if (!user) {
				throw 'Invalid user.';
			}
			client.database.get('block').delete(user.id).save();
			return md.atUser(user) + ' is now allowed to use this bot again.';
		}
	}
};
