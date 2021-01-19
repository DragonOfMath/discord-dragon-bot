const UNO = require('./UNO');
const {Markdown:md} = require('../../../Utils');

module.exports = {
	'uno': {
		aliases: ['unocardgame'],
		title: 'UNO',
		info: 'Play the UNO card game!',
		parameters: ['...co-players'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, context, args}) {
			UNO.initEmojis(client);
			
			// setup players starting with the context user
			let players = [context.user];
			for (let a of args) {
				a = md.userID(a);
				if (a && a in client.users) players.push(client.users[a]);
			}
			
			let uno = new UNO(context, players);
			uno.startGame(client);
		}
	}
};
