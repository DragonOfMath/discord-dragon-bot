const TicTacToe   = require('./TicTacToe');

module.exports = {
	'tictactoe': {
		aliases: ['ttt'],
		category: 'Fun',
		title: 'Tic-Tac-Toe',
		info: 'Play a game of Tic-Tac-Toe against the bot. You can choose to be X or O. The first turn player is randomly selected.',
		parameters: ['[<x|o>]'],
		fn({client, context, args}) {
			client.sessions.start(new TicTacToe(client, context, args[0]));
		}
	}
};
