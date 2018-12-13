const GameOfLife = require('./GameOfLife');

module.exports = {
    'gol': {
        aliases: ['gameoflife','conway'],
        category: 'Fun',
        title: 'Conway\'s Game of Life',
        info: 'Simulate the Game of Life... in Discord! Set the rules in the format `B###/S###` where B is birth conditions and S is survival conditions, each followed by digits 0-8. The default rules are `B3/S23`.',
        parameters: ['[rules]'],
        flags: ['w|wrap'],
        permissions: 'inclusive',
        fn({client, context, arg, flags}) {
            let options = {
                width: 10,
                height: 10,
                wrap: flags.has('w') || flags.has('wrap'),
                birth: [3], // exactly 3 live cells neighboring a dead cell
                survive: [2,3] // 2-3 live cells to survive to next generation
            };
            if (arg.length) {
                try {
                    options.birth   = arg.match(/b(\d+)/i)[1].split('').map(Number);
                    options.survive = arg.match(/s(\d+)/i)[1].split('').map(Number);
                } catch (e) {}
            }
			let gol = new GameOfLife(context, options);
			gol.startGame(client);
        }
    }
};
