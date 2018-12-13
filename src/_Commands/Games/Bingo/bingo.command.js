const Bingo = require('./Bingo');
const {Markdown:md} = require('../../../Utils');

module.exports = {
	'bingo': {
		category: 'Fun',
		title: 'Emoji Bingo',
		info: 'Play a game of Emoji Bingo, solo or with friends!',
		parameters: ['[...co-players]'],
		permissions: 'inclusive',
		fn({client, context, args}) {
			let players = args.map(p => client.users[md.userID(p)]).filter(Boolean);
			players.unshift(context.user);
            let bingo = new Bingo(context, players);
            bingo.startGame(client);
		}
	}
};
