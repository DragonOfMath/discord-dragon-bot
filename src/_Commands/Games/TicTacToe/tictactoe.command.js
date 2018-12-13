const TicTacToe   = require('./TicTacToe');
const {Markdown:md} = require('../../../Utils');

module.exports = {
	'tictactoe': {
		aliases: ['ttt','3inarow'],
		category: 'Fun',
		title: 'Tic-Tac-Toe',
		info: 'Play a game of Tic-Tac-Toe against another user or the bot. You can choose to be X or O. The first turn player is randomly selected.',
		parameters: ['[<x|o>]', '[opponent]'],
		permissions: 'inclusive',
		fn({client, context, args}) {
			let [type,opponent] = args;
			if (opponent) {
				opponent = md.userID(opponent);
				opponent = client.users[opponent];
			}
			if (!opponent) {
				opponent = client;
			}
			
			let ttt = new TicTacToe(context, [context.user,opponent], type);
			ttt.startGame(client);
		}
	}
};
