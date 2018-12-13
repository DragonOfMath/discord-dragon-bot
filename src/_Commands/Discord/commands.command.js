/**
	Command file for configuring the permissions of commands and other command-related stuff.
	
	First, it must be established where all commands can be used
	commands.allow * #bot-channel
	
	Then, remove commands which can be used anywhere
	commands.deny &admin &moderation #bot-channel
	
	Move NSFW commands to a respective channel
	commands.allow &nsfw #nsfw-bot-channel
	
	Next, establish who the mods and admins are and give them permission to make changes to things
	commands.allow &admin &moderation @admin @moderator
	
	Note: avoid using @mentions for permissions, as this will give them privileges across all servers they are in with the bot!
	
	And you're done!
*/

const {Markdown:md} = require('../../Utils');

function parse(serverID, channelID, args) {
	var commands = [];
	var server = {
		users: [],
		roles: [],
		channels: []
	};
	
	for (let a of args) {
		if (/<@&.*>/.test(a)) { // role
			a = md.id(a);
			if (!server.roles.includes(a)) {
				server.roles.push(a);
			}
		} else if (/<@.*>/.test(a)) { // user
			a = md.id(a);
			if (!server.users.includes(a)) {
				server.users.push(a);
			}
		} else if (/<#.*>/.test(a)) { // channel
			a = md.id(a);
			if (!server.channels.includes(a)) {
				server.channels.push(a);
			}
		} else {
			if (!commands.includes(a)) {
				commands.push(a);
			}
		}
	}
	
	if (server.users.length + server.roles.length + server.channels.length == 0) {
		server.channels.push(channelID);
	}
	
	//console.log(server);
	
	return {
		commands,
		servers: {
			[serverID]: server
		}
	};
}

function showErrors(errors) {
	if (errors.length > 0) {
		//console.log(...errors);
		return '\nWarnings:\n' + md.codeblock(errors.join('\n'));
	} else {
		return '';
	}
}

module.exports = {
	'commands': {
		aliases: ['cmds'],
		category: 'Discord',
		info: 'Interface for enabling and disabling commands. *You should configure commands in a private channel to avoid mentioning users and roles.*\n\nIf you are looking for a list of commands, try using the `category` command (there are simply too many commands to list them all!).',
		permissions: 'privileged',
		suppress: true,
		subcommands: {
			'enable': {
				aliases: ['allow'],
				info: 'Enables command(s) for the current channel/channel(s)/user(s)/role(s).',
				parameters: ['...commands', '[...targets]'],
				fn({client, args, channelID, serverID}) {
					var data = parse(serverID, channelID, args);
					var suppressedErrors = [];
					var commands = client.commands.get(...data.commands);
					
					for (var command of commands) {
						try {
							command.permissions.allow(client, data);
						} catch (e) {
							suppressedErrors.push(e);
						}
					}
					client.database.get('permissions').save();
					return 'Settings saved.' + showErrors(suppressedErrors);
				}
			},
			'disable': {
				aliases: ['deny'],
				info: 'Disables command(s) for the current channel/channel(s)/user(s)/role(s).',
				parameters: ['...commands', '[...targets]'],
				fn({client, args, channelID, serverID}) {
					var data = parse(serverID, channelID, args);
					var suppressedErrors = [];
					var commands = client.commands.get(...data.commands);
					
					for (var command of commands) {
						try {
							command.permissions.deny(client, data);
						} catch (e) {
							suppressedErrors.push(e);
						}
					}
					
					client.database.get('permissions').save();
					return 'Settings saved.' + showErrors(suppressedErrors);
				}
			},
			'clear': {
				aliases: ['reset'],
				info: 'Clears permission settings for the given commands in this server.',
				parameters: ['...commands'],
				fn({client, args, channelID, server}) {
					var data = {
						servers: {
							[server.id]: {
								users: Object.keys(server.users),
								channels: Object.keys(server.channels),
								roles: Object.keys(server.roles)
							}
						}
					};
					var suppressedErrors = [];
					var commands = client.commands.get(...args);
					
					for (let command of commands) {
						try {
							command.permissions.clear(client, data);
						} catch (e) {
							suppressedErrors.push(e);
						}
					}
					
					client.database.get('permissions').save();
					return 'Settings saved.' + showErrors(suppressedErrors);
				}
			},
			'copy': {
				info: 'Copy permission settings from one command to one or more commands.',
				parameters: ['src_command','...commands'],
				fn({client, args, server}) {
					var [src,...dest] = args;
					var src_command = client.commands.get(src);
					if (src_command.length != 1) {
						throw 'Invalid source command.';
					} else {
						src_command = src_command[0];
					}
					// pre-load permissions
					src_command.permissions.load(client);
					
					var commands = client.commands.get(...dest);
					var suppressedErrors = [];
					for (let command of commands) {
						try {
							command.permissions.copy(client, src_command.permissions);
						} catch (e) {
							suppressedErrors.push(e);
						}
					}
					client.database.get('permissions').save();
					return 'Settings saved.' + showErrors(suppressedErrors);
				}
			},/*
			'setaccess': {
				aliases: ['settype'],
				info: 'Changes the accessibility scope of permissions of a command. Possible values: `private`, `public`, `privileged`, `inclusive`, `exclusive`.',
				parameters: ['command', 'access'],
				permissions: 'private',
				suppress: true,
				fn({client, args, server}) {
					client.commands.get(args[0])[0].permissions.changeType(client, args[1]);
					client.database.get('permissions').save();
					return 'Access setting saved.';
				}
			},*/
			'invert': {
				info: 'Inverts the accessibility scope of permissions. Inclusive becomes exclusive, and vice versa. Public/private/privileged commands are not affected.',
				parameters: ['...commands'],
				fn({client, args, server}) {
					var suppressedErrors = [];
					var commands = client.commands.get(...args);
					for (let command of commands) {
						try {
							command.permissions.invert(client);
						} catch (e) {
							suppressedErrors.push(e);
						}
					}
					client.database.get('permissions').save();
					return 'Settings saved.' + showErrors(suppressedErrors);
				}
			},
			'check': {
				info: 'Retrieves the command permissions for the server.',
				parameters: ['...commands'],
				fn({client, args, server}) {
					var commands = client.commands.get(...args);
					if (commands.length == 0) {
						throw 'Invalid command(s).';
					}
					return commands.map(cmd => `__\`${cmd.fullID}\`__\n${cmd.permissions.toString(client, server)}`).join('\n');
				}
			},
			'checkall': {
				info: 'Retrieves ALL server permissions for a single command.',
				parameters: ['command'],
				permissions: 'private',
				suppress: true,
				fn({client, arg, server}) {
					return client.commands.get(arg)[0].permissions.embed(client);
				}
			},
			'move': {
				aliases: ['replace', 'alias', 'rename'],
				info: 'Replace permission entry keys with new ones, in case the names of commands change and are no longer binded. :warning: Warning! This is a low-level command, it will create or delete data regardless of validation!',
				parameters: ['...old:new'],
				permissions: 'private',
				fn({client, args}) {
					var pairs = args.map(a => a.split(':'));
					var permissions = client.database.get('permissions');
					var suppressedErrors = [];
					for (let [o,n] of pairs) {
						var p = permissions[o];
						try {
							if (p) {
								delete permissions[o];
								client.commands.get(n)[0].permissions.copy(p);
							} else {
								throw `${o} had no permission settings.`;
							}
						} catch (e) {
							suppressedErrors.push(e);
							//permissions[n] = p;
						}
					}
					permissions.save();
					return 'Settings saved.' + showErrors(suppressedErrors);
				}
			},
			'create': {
				aliases: ['new'],
				info: 'Create a new temporary command. Surround the code in a code block for proper parsing. By default, unlimited arguments may be passed and all known context members are defined.',
				parameters: ['name','code'],
				permissions: 'private',
				fn({client, args}) {
					var [cmd,code] = args;
					var fn = new Function('data','with (data) {\n' + code + '\n}');
					if (client.commands.has(cmd)) {
						throw 'Command already exists: ' + cmd;
					} else if (cmd in client.commands) {
						throw 'Cannot override property: ' + cmd;
					} else {
						client.commands.set(cmd, cmd, {
							info: 'This is a temporary command.',
							suppress: false,
							analytics: false,
							permissions: 'public',
							fn
						});
						return 'Created temporary command: ' + cmd;
					}
				}
			}/*,
			'export': {
				aliases: ['download'],
				info: 'Serialize command(s) to a JS file.',
				parameters: ['...commands'],
				permission: 'private',
				fn({client, args}) {
					let _export = {}, base;
					let commands = client.commands.get(...args);
					for (let cmd of commands) {
						if (cmd.supercommand) {
							base = _export[cmd.supercommand.id] ? _export[cmd.supercommand.id].subcommands : _export;
						} else {
							base = _export;
						}
						base[cmd.id] = cmd.export(true);
					}
					let buffer = `module.exports = ${JSON.stringify(_export, null, '\t')};\n`;
					
					return md.codeblock(buffer, 'js');
				}
			}*/
		}
	}
};

