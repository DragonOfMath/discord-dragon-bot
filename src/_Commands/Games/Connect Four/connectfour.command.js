const ConnectFour   = require('./ConnectFour');
const {Markdown:md} = require('../../../Utils');

module.exports = {
	'connectfour': {
		aliases: ['connect4','4inarow'],
		category: 'Fun',
		title: 'Connect Four',
		info: 'Play a game of Connect Four against another user or the bot. The first turn player is randomly selected.',
		parameters: ['[opponent]'],
		permissions: 'inclusive',
		fn({client, context, args}) {
			let [opponent] = args; 
			if (opponent) {
				opponent = md.userID(opponent);
				opponent = client.users[opponent];
			}
			if (!opponent) {
				opponent = client;
			}
			
			let cf = new ConnectFour(context, [context.user,opponent]);
			cf.startGame(client);
		}
	}
};
