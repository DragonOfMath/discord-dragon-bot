const Battleship = require('./Battleship');

module.exports = {
    'battleship': {
        category: 'Fun',
        title: 'Battleship',
        info: 'Play the classic Battleship game against the bot!',
        permissions: 'inclusive',
        fn({client, context}) {
            let bs = new Battleship(context, context.user);
            bs.startGame(client);
        }
    }
};
