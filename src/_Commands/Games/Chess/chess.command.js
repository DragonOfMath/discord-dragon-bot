const Chess = require('./Chess');
const {Markdown:md} = require('../../../Utils');

module.exports = {
	'chess': {
		category: 'Games',
		info: 'Play chess against a player or the bot! Choose a difficulty from 1 to 3 (or easy/medium/hard), default is easy. Change rules such as castling and en passant by setting flags.',
		parameters: ['[opponent]'],
		flags: ['difficulty','team'],
		permissions: 'private',
		analytics: false,
		fn({client,context,arg,flags}) {
			let opponent = arg;
			if (opponent) {
				opponent = md.userID(opponent);
				opponent = client.users[opponent];
			}
			if (!opponent) {
				opponent = client;
			}
			let players = [context.user,opponent];
			if (flags.get('team') === 'black') {
				players = players.reverse();
			}
			let opts = {
				difficulty: flags.get('difficulty')
			};
			let chess = new Chess(context, players, opts);
			chess.startGame(client);
		}
	},
};
