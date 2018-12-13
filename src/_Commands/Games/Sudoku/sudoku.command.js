const Sudoku = require('./Sudoku');

module.exports = {
    'sudoku': {
        category: 'Fun',
        title: 'Sudoku',
        info: 'Play a game of Sudoku. Enter a number from 0 to 100 to set the difficulty, or use an 81-character string for the grid.',
		parameters: ['[difficulty|board]'],
        permissions: 'inclusive',
        fn({client, context, args}) {
			let difficulty, board;
			if (String(args[0]).length == 81) {
				board = args[0];
			} else {
				difficulty = isNaN(args[0]) ? 50 : args[0];
				difficulty = Math.max(0, Math.min(difficulty, 100));
			}
            let sudoku = new Sudoku(context, {board,difficulty});
            sudoku.startGame(client);
        }
    }
};
