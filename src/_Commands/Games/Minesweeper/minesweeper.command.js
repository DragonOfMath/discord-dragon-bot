const Minesweeper = require('./Minesweeper');
const {Markdown:md} = require('../../../Utils');

module.exports = {
    'minesweeper': {
        category: 'Fun',
        title: 'Minesweeper',
        info: 'Play the classic Minesweeper game, with additional multiplayer!',
        parameters: ['[...co-players]'],
        flags: ['m|mines'],
        permissions: 'inclusive',
        fn({client, context, flags, args}) {
            let mines = flags.get('m') || flags.get('mines') || 10;
            let players = args.map(p => client.users[md.userID(p)]).filter(Boolean);
			players.unshift(context.user);
            let ms = new Minesweeper(context, players, {mines});
            ms.startGame(client);
        }
    }
};
