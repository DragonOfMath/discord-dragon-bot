const Resource = require('../../Structures/Resource');
const {Markdown:md,DiscordUtils} = require('../../Utils');

const WELCOME_TEMPLATE = {
	message: '',
	goodbye: '',
	channel: '',
	role: ''
};
class Welcome extends Resource {
	constructor(w = {}) {
		super(WELCOME_TEMPLATE, w);
	}
}

module.exports = {
	'welcome': {
		category: 'Discord',
		info: 'Let your users feel welcome! Set a channel and message for which this bot may greet them. Use this command to manually welcome them.',
		parameters: ['[user]'],
		permissions: 'privileged',
		fn({client, server, user, context, args}) {
			let targetID, targetUser, targetMember;
			if (args.length) {
				targetUser = DiscordUtils.resolve(client.users, md.userID(args[0]), args[0], '');
			} else {
				targetUser = user;
			}
			if (!targetUser) {
				throw 'Invalid user!';
			}
			targetMember = server.members[targetUser.id];
			
			let serverTable = client.database.get('servers');
			let welcome = new Welcome(serverTable.get(server.id).welcome);
			if (welcome.message) {
				let temp = context.user;
				
				context.user = targetUser;
				context.userID = targetUser.id;
				context.member = targetMember;
				context.memberID = targetUser.id;
				
				let message = client.normalize(welcome.message, context);
				
				context.user = temp;
				context.userID = temp.id;
				context.member = temp;
				context.memberID = temp.id;
				
				return message;
			} else {
				return 'Welcome to ' + md.bold(server.name) + ', ' + md.mention(targetUser) + '!';
			}
		},
		subcommands: {
			'message': {
				title: 'Welcome | Message',
				info: 'Sets the server\'s welcome message for new users that join. To insert their name, type `$``user`, and to mention them, type `$``mention`.',
				parameters: ['[...message]'],
				flags: ['clear'],
				fn({client, serverID, flags, input}) {
					let serverTable = client.database.get('servers');
					let message = flags.has('clear') ?  '' : input.arg;
					serverTable.modify(serverID, server => {
						server.welcome = new Welcome(server.welcome);
						server.welcome.message = message;
						return server;
					}).save();
					return 'Saved.';
				}
			},
			'channel': {
				title: 'Welcome | Channel',
				info: 'Gets or sets the server\'s channel where welcome messages may be displayed.',
				parameters: ['[channel]'],
				fn({client, server, channelID, arg}) {
					let serverTable = client.database.get('servers');
					let channel = '';
					if (arg) {
						serverTable.modify(server.id, data => {
							data.welcome = new Welcome(data.welcome);
							channel = data.welcome.channel = md.channelID(arg);
							return data;
						}).save();
					} else {
						let welcome = new Welcome(serverTable.get(server.id));
						channel = welcome.channel;
					}
					return channel ? 'Saved as ' + md.channel(channel) : '(No channel set.)';
				}
			},
			'role': {
				title: 'Welcome | Role',
				info: 'Gets or sets the server\'s standard role for new members.',
				parameters: ['[role]'],
				fn({client, server, channelID, arg}) {
					let serverTable = client.database.get('servers');
					let roleID = '';
					if (arg) {
						serverTable.modify(server.id, data => {
							data.welcome = new Welcome(data.welcome);
							roleID = md.roleID(arg);
							if (roleID == server.id) {
								throw 'You cannot use at-everyone as a role!';
							} 
							data.welcome.role = roleID;
							return data;
						}).save();
					} else {
						let welcome = new Welcome(serverTable.get(server.id));
						roleID = welcome.role;
					}
					return (roleID && roleID in server.roles) ? 'Saved as ' + md.bold(server.roles[roleID].name) : '(No role set.)';
				}
			},
			'goodbye': {
				info: 'Gets or sets the server\'s goodbye message for users that leave the server. To insert their name, type `$``user`, and to mention them, type `$``mention`.',
				parameters: ['[...message]'],
				fn({client, serverID, input}) {
					let serverTable = client.database.get('servers');
					let goodbye = input.arg;
					serverTable.modify(serverID, server => {
						server.welcome = new Welcome(server.welcome);
						server.welcome.goodbye = goodbye;
						return server;
					}).save();
					return 'Saved.';
				}
			},
			'test': {
				info: 'Test the welcome/goodbye messages.',
				fn({client, serverID, context}) {
					let serverTable = client.database.get('servers');
					let welcome = new Welcome(serverTable.get(serverID).welcome);
					return {
						title: 'Welcome Message Demo',
						fields: [
							{
								name: 'Channel',
								value: welcome.channel ? md.channel(welcome.channel) : '(No channel set)'
							},
							{
								name: 'Role',
								value: welcome.role ? md.role(welcome.role) : '(No role set)'
							},
							{
								name: 'Greeting Message',
								value: welcome.message ? client.normalize(welcome.message, context) : '(No message set)'
							},
							{
								name: 'Goodbye Message',
								value: welcome.goodbye ? client.normalize(welcome.goodbye, context) : '(No message set)'
							}
						]
					};
				}
			}
		}
	}
};
