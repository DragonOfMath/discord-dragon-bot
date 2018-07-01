const Resource = require('../Resource');
const {Markdown:md} = require('../Utils');

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
		category: 'Admin',
		info: 'Let your users feel welcome! Set a channel and message for which this bot may greet them.',
		permissions: 'privileged',
		subcommands: {
			'message': {
				title: 'Welcome | Message',
				info: 'Sets the server\'s welcome message for new users that join. To insert their name, type `$user`, and to mention them, type `$mention`.',
				parameters: ['...message'],
				fn({client, serverID, input}) {
					var serverTable = client.database.get('servers');
					var message = input.arg;
					serverTable.modify(serverID, server => {
						server.welcome = new Welcome(server.welcome);
						server.welcome.message = message;
						return server;
					}).save();
					return md.code(message);
				}
			},
			'channel': {
				title: 'Welcome | Channel',
				info: 'Gets or sets the server\'s channel where welcome messages may be displayed.',
				parameters: ['[channel]'],
				fn({client, serverID, channelID, arg}) {
					var serverTable = client.database.get('servers');
					var channel = '';
					if (arg) {
						serverTable.modify(serverID, server => {
							server.welcome = new Welcome(server.welcome);
							channel = server.welcome.channel = md.channelID(arg);
							return server;
						}).save();
					} else {
						var welcome = new Welcome(serverTable.get(serverID));
						channel = welcome.channel;
					}
					return channel ? md.channel(channel) : '(No channel set.)';
				}
			},
			'role': {
				title: 'Welcome | Role',
				info: 'Gets or sets the server\'s standard role for new members.',
				parameters: ['[role]'],
				fn({client, serverID, channelID, arg}) {
					var serverTable = client.database.get('servers');
					var role = '';
					if (arg) {
						serverTable.modify(serverID, server => {
							server.welcome = new Welcome(server.welcome);
							role = server.welcome.role = md.roleID(arg);
							return server;
						}).save();
					} else {
						var welcome = new Welcome(serverTable.get(serverID));
						role = welcome.role;
					}
					return role ? md.role(role) : '(No role set.)';
				}
			},
			'goodbye': {
				info: 'Gets or sets the server\'s goodbye message for users that leave the server. To insert their name, type `$user`, and to mention them, type `$mention`.',
				parameters: ['[...message]'],
				fn({client, serverID, input}) {
					var serverTable = client.database.get('servers');
					var goodbye = input.arg;
					serverTable.modify(serverID, server => {
						server.welcome = new Welcome(server.welcome);
						server.welcome.goodbye = goodbye;
						return server;
					}).save();
					return md.code(goodbye);
				}
			},
			'test': {
				info: 'Test the welcome/goodbye messages.',
				fn({client, serverID, context}) {
					var serverTable = client.database.get('servers');
					var welcome = new Welcome(serverTable.get(serverID).welcome);
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
