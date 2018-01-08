/**
	cmd_commands.js
	Command file for configuring the permissions of commands.
	
	First, it must be established where all commands can be used
	!commands.allow * #bot-channel
	
	Then, remove commands which can be used anywhere
	!commands.deny &admin &moderation #bot-channel
	
	Move NSFW commands to a respective channel
	!commands.allow &nsfw #nsfw-bot-channel
	
	Optionally, add shitposty commands to a new channel
	!commands.allow &fun &misc #shitposting
	
	Next, establish who the mods and admins are and give them permission to make changes to things
	!commands.allow &admin &moderation @admin @moderator
	
	Note: avoid using @mentions for permissions, as this will give them privileges across all servers they are in with the bot!
	
	And you're done!
*/

const CommandInterfaceHelpEmbed = {
	title: 'Command Permissions Interface | Help',
	description: 'This interface will let you configure which commands can and can\'t be used, by channel, role, user, or on the entire server.',
	fields: [
		{
			name: 'General Syntax for Arguments',
			value: '`[#channel [#...]] [@user [@...]] [@role [@...]] [$SERVER] command1={1|0} [...]`'
		},
		{
			name: 'Notes on the Syntax',
			value: '`[]` means optional, `...` means an indefinite number of items following, `{|}` means a set of choices, and `$SERVER` is a keyword that targets the server itself. You can provide any number of channels, users, and roles as you\'d like in any order, but you can only provide 1 `$SERVER` argument (any other targets are ignored). Commands are validated, so any mismatching ones are ignored.'
		},
		{
			name: 'Accessibility',
			value: 'There are four levels of accessibility that commands can be set to: __public__, __private__, __inclusive__, and __exclusive__. Public commands are accessible to everyone, everywhere and their permissions are locked. Private commands are accessible only to the bot owner and their permissions are locked. Inclusive commands use a whitelist of targets, so you must be included to be allowed to use it. Exclusive commands follow a blacklist instead, so if you are included you cannot use it. Only the bot owner may change this setting.'
		}
	]
};

function whatIs(x) {
	if (/<@&.*>/.test(x)) {
		return 'role';
	} else if (/<@.*>/.test(x)) {
		return 'user';
	} else if (/<#.*>/.test(x)) {
		return 'channel';
	} else if (/\$server/i.test(x)) {
		return 'server';
	} else {
		return 'other';
	}
}

function showErrors(errors) {
	if (errors.length > 0) {
		return '\nWarnings:\n```\n' + errors.join('\n') + '\n```';
	} else {
		return '';
	}
}

class PermissionParser {
	constructor(server) {
		this.commands = [];
		this.users = [];
		this.roles = [];
		this.channels = [];
		this.servers = [];
		this.serverID = server;
	}
	parse(args) {
		for (let a of args) {
			switch (whatIs(a)) {
				case 'role':
					a = a.match(/\d+/)[0];
					if (this.roles.indexOf(a) < 0) {
						this.roles.push(a);
					}
					break;
				case 'user':
					a = a.match(/\d+/)[0];
					if (this.users.indexOf(a) < 0) {
						this.users.push(a);
					}
					break;
				case 'channel':
					a = a.match(/\d+/)[0];
					if (this.channels.indexOf(a) < 0) {
						this.channels.push(a);
					}
					break;
				case 'server':
					if (!this.servers.length) {
						this.servers.push(this.serverID);
					}
					break;
				default:
					if (this.commands.indexOf(a) < 0) {
						this.commands.push(a);
					}
					break;
			}
		}
		//console.log(this);
	}
	get length() {
		return this.roles.length + this.users.length + this.channels.length + this.servers.length;
	}
	validate(client) {
		this.commands = this.commands.filter(cmd => !!client.commands.get(cmd));
	}
}

module.exports = {
	'commands': {
		aliases: ['cmds'],
		category: 'Admin',
		info: 'Interface for enabling and disabling commands.',
		permissions: {
			type: 'private'
		},
		fn({client, args}) {
			return this.listSubcommands() + '\n\n*You should configure commands in a private channel to avoid mentioning users and roles.*';
		},
		subcommands: {
			'help': {
				info: 'Provides info about how to use the `commands` interface.',
				permissions: {
					type: 'private'
				},
				fn() {
					return CommandInterfaceHelpEmbed;
				}
			},
			'enable': {
				aliases: ['allow'],
				info: 'Enables command(s) for the current channel/given channel(s)/given user(s)/entire server.',
				parameters: ['...commands', '[...targets]'],
				permissions: {
					type: 'private'
				},
				fn({client, args, channelID, serverID}) {
					var pp = new PermissionParser(serverID);
					pp.parse(args);
					if (pp.length == 0) {
						pp.channels.push(channelID);
					}
					
					let suppressedErrors = [];
					var commands = client.commands.get(...pp.commands);
					for (var command of commands) {
						try {
							command.permissions.allow(client, pp);
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
				info: 'Disables command(s) for the current channel/given channel(s)/given user(s)/entire server.',
				parameters: ['...commands', '[...targets]'],
				permissions: {
					type: 'private'
				},
				fn({client, args, channelID, serverID}) {
					var pp = new PermissionParser(serverID);
					pp.parse(args);
					if (pp.length == 0) {
						pp.channels.push(channelID);
					}
					
					var suppressedErrors = [];
					var commands = client.commands.get(...pp.commands);
					for (var command of commands) {
						try {
							command.permissions.deny(client, pp);
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
				permissions: {
					type: 'private'
				},
				fn({client, args, channelID, server}) {
					var p = {};
					p.servers  = [server.id];
					p.users    = [];//Object.keys(server.members);
					p.channels = Object.keys(server.channels);
					p.roles    = Object.keys(server.roles);
					
					var suppressedErrors = [];
					var commands = client.commands.get(...args);
					for (let command of commands) {
						try {
							command.permissions.clear(client, p);
						} catch (e) {
							suppressedErrors.push(e);
						}
					}
					client.database.get('permissions').save();
					return 'Settings saved.' + showErrors(suppressedErrors);
				}
			},
			'setaccess': {
				aliases: ['settype'],
				info: 'Changes the accessibility scope of permissions of a command. Possible values: `private`, `public`, `inclusive`, `exclusive`. Warning: this command will wipe the current permissions for the new accessibility to take effect.',
				parameters: ['command', 'access'],
				permissions: {
					type: 'private'
				},
				fn({client, args, server}) {
					client.commands.get(args[0])[0].permissions.changeType(client, args[1]);
					client.database.get('permissions').save();
					return 'Access setting saved.';
				}
			},
			'check': {
				info: 'Retrieves the command permissions.',
				parameters: ['command'],
				permissions: {
					type: 'private'
				},
				fn({client, arg, server}) {
					let cmd = client.commands.get(arg)[0];
					return `\`${cmd.fullID}\`: ${cmd.permissions.toString(client, server)}`;
				}
			},
			'checkall': {
				info: 'Retrieves ALL command permissions.',
				parameters: ['command'],
				permissions: {
					type: 'private'
				},
				fn({client, arg, server}) {
					return client.commands.get(arg)[0].permissions.toDebugEmbed(client);
				}
			}
		}
	}
};

