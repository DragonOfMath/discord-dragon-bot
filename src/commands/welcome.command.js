const Resource = require('../Resource');
const {Markdown:md} = require('../Utils');

const WELCOME_TEMPLATE = {
	message: '',
	goodbye: '',
	channel: ''
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
		subcommands: {
			'message': {
				info: 'Set the server\'s welcome message for new users that join. To insert their name, type `$user`, and to mention them, type `$mention`.',
				parameters: ['...message'],
				fn({client, serverID, arg}) {
					client.database.get('servers').modify(serverID, server => {
						server.welcome = new Welcome(server.welcome);
						server.welcome.message = arg;
						return server;
					}).save();
					return 'Greeting message set for server.';
				}
			},
			'channel': {
				info: 'Set the server\'s channel where welcome messages may be displayed.',
				parameters: ['channel'],
				fn({client, serverID, channelID, arg}) {
					client.database.get('servers').modify(serverID, server => {
						server.welcome = new Welcome(server.welcome);
						server.welcome.channel = md.channelID(arg) || channelID;
						return server;
					}).save();
					return 'Welcome channel set for server.';
				}
			},
			'goodbye': {
				info: 'Set the server\'s goodbye message for users that leave the server. To insert their name, type `$user`, and to mention them, type `$mention`.',
				parameters: ['...message'],
				fn({client, serverID, arg}) {
					client.database.get('servers').modify(serverID, server => {
						server.welcome = new Welcome(server.welcome);
						server.welcome.goodbye = arg;
						return server;
					}).save();
					return 'Goodbye message set for server.';
				}
			},
			'test': {
				info: 'Test the welcome/goodbye messages.',
				permissions: {
					type: 'private'
				},
				fn({client, serverID, context}) {
					var welcome = new Welcome(client.database.get('servers').get(serverID).welcome);
					if (welcome.channel) {
						return {
							title: 'Welcome Message Demo',
							fields: [
								{
									name: 'Channel',
									value: md.channel(welcome.channel)
								},
								{
									name: 'Greeting Message',
									value: client.normalize(welcome.message, context) || '(No message set)'
								},
								{
									name: 'Goodbye Message',
									value: client.normalize(welcome.goodbye, context) || '(No message set)'
								}
							]
						};
					} else {
						return 'No welcome channel set.';
					}
				}
			}
		}
	}
};
