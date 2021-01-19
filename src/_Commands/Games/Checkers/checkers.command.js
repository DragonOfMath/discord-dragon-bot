const Checkers = require('./Checkers');
const {Markdown:md} = require('../../../Utils');

module.exports = {
	'checkers': {
		category: 'Games',
		info: 'Play a game of checkers against the bot or another player',
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
			let checkers = new Checkers(context, players, opts);
			checkers.startGame(client);
		}
	}
};