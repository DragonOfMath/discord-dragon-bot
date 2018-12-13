const Telephone = require('./Telephone');
const {Markdown:md,random} = require('../../../Utils');

module.exports = {
	'call': {
		aliases: ['phone','telephone','ringring','hangup','endcall'], 
		category: 'Fun',
		title: 'Telephone',
		info: 'Pick up the phone and see who answers! As this is a rather privacy-sensitive command, you should use this in DMs with the bot. You can call a specific user and I will try to contact them, otherwise, I will hook you up with anyone else also using `call` within 30 seconds. To end a call, use the `hangup` or `endcall` aliases.',
		parameters: ['[user]'],
		permissions: 'dm',
		fn({client, user, args}) {
			
			let operator = client.sessions.get('telephone-operator');
			//console.log(operator);
			
			// answer a call for them
			let connection = operator.data.connections.find(c => c.isConnected(user));
			if (connection) {
				return connection.terminate(client, user);
			}

			// find an unanswered random call from someone else
			let unansweredConnections = operator.data.connections.filter(c => c.isUnanswered(user));
			if (unansweredConnections.length) {
				connection = random(unansweredConnections);
				return connection.answer(client, user);
			}

			// start a new call for someone or random
			let receiverID = args[0] ? md.userID(args[0]) : '';
			connection = new Telephone(user.id, receiverID);
			operator.data.connections.push(connection);
			connection.onclose = () => {
				operator.data.connections.splice(operator.data.connections.indexOf(connection), 1);
			};

			return connection.initiate(client, user).then(() => {});
		}
	}
};
