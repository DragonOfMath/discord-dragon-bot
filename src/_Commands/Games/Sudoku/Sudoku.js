const MessageGame = require('../../../Sessions/MessageGame');
const {Array,Pointer2D,random} = require('../../../Utils');

const GRID = '⬛';
const MOVE_RIGHT = '➡';
const MOVE_LEFT  = '⬅';
const MOVE_UP    = '⬆';
const MOVE_DOWN  = '⬇';
const MOVEMENT   = [MOVE_LEFT,MOVE_UP,MOVE_DOWN,MOVE_RIGHT];
const SOLVE      = '✅';
const NUMBERS    = ['⬜',`1⃣`,`2⃣`,`3⃣`,`4⃣`,`5⃣`,`6⃣`,`7⃣`,`8⃣`,`9⃣`];

const SIZE = 9;

class SudokuCell {
	constructor(board,x,y,value=0) {
		this.board = board;
		this.x = x;
		this.y = y;
		this.g = Math.floor(this.y / 3) * 3 + Math.floor(this.x / 3);
		this.value = value;
		this.defaultValue = value;
		this.valuesLeft = [];
	}
	get used() {
		return this.board.getAll(this.x, this.y);
	}
	get remaining() {
		return this.board.getRemaining(this.x, this.y);
	}
	get row() {
		return this.board.getRow(this.y);
	}
	get col() {
		return this.board.getColumn(this.x);
	}
	get group() {
		return this.board.getGroup(this.x, this.y);
	}
	recalc() {
		this.valuesLeft = this.remaining;
	}
	tryFirstValue() {
		return this.value = this.valuesLeft[0] ?? 0;
	}
	tryNextValue() {
		this.valuesLeft.shift();
		return this.value = this.valuesLeft[0] ?? 0;
	}
	tryAnyValue() {
		this.value = random(this.valuesLeft) ?? 0;
		this.valuesLeft.splice(this.valuesLeft.indexOf(this.value),1);
		return this.value;
	}
	setAsDefault(value) {
		this.valuesLeft = [];
		this.defaultValue = this.value = value;
	}
}

class SudokuBoard {
	constructor(board = '') {
		this.cells = new Array(SIZE * SIZE).fill(0);
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) {
				this.cells[y * SIZE + x] = new SudokuCell(this, x, y, Number(board[y*9+x]) || 0);
			}
		}
	}
	randomize(difficulty) {
		difficulty = Math.min(100, difficulty ?? 60);
		
		let maxIterations = Math.round(30 - 0.2 * difficulty), x, y, moves = [];
		while (maxIterations-- > 0) {
			x = random(SIZE), y = random(SIZE);
			let cell = this.get(x,y);
			if (cell.value) continue;
			cell.recalc();
			if (cell.valuesLeft.length) {
				cell.tryAnyValue();
				moves.push(cell);
			} else while (moves.length && !moves[moves.length-1].tryAnyValue()) {
				moves.pop();
			}
		}
		// solidify the random values chosen for this board (and hope it's still solvable)
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) {
				let cell = this.get(x,y);
				cell.setAsDefault(cell.value);
			}
		}
	}
	// https://en.wikipedia.org/wiki/Sudoku_solving_algorithms
	// https://en.wikipedia.org/wiki/Exact_cover#Sudoku
	autosolve() {
		let moves = [], solved = false;
		
		solve:
		while (!solved) {
			solved = true;
			
			let choiceMoves = [], exactMoveFound = null;
			
			checkCells:
			for (let y = 0; y < SIZE; y++) {
				for (let x = 0; x < SIZE; y++) {
					let cell = this.get(x,y);
					if (cell.value) continue;
					solved = false;
					cell.recalc();
					if (cell.movesLeft.length == 0) {
						// encountered a cell with no possible moves, uh oh!
						// need to backtrack until we reach a cell with more than one other move
						while (moves.length && !moves[moves.length-1].tryNextValue()) {
							moves.pop();
						}
						if (moves.length == 0) {
							// if all possible moves have been exhausted then no solution exists
							break solve;
						} else {
							// because moves were backtracked, we will need to redo the checking
							continue solve;
						}
					} else if (cell.movesLeft.length === 1) {
						// a cell with only one option is the highest priority for solving
						exactMoveFound = cell;
						break checkCells;
					} else {
						// cell has multiple branching moves
						choiceMoves.push(cell);
					}
				}
			}
			if (!solved) {
				let cell = exactMoveFound ?? choiceMoves[0];
				cell.tryFirstValue();
				moves.push(cell);
			}
		}
		return solved;
	}
	reset() {
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) {
				let cell = this.get(x,y);
				cell.value = cell.defaultValue;
			}
		}
	}
	get(x,y) {
		return this.cells[y * SIZE + x];
	}
	getRow(y) {
		let digits = [];
		for (let x = 0; x < SIZE; x++) {
			let n = this.get(x,y).value;
			if (n > 0) {
				digits.push(n);
			}
		}
		return digits;
	}
	getColumn(x) {
		let digits = [];
		for (let y = 0; y < SIZE; y++) {
			let n = this.get(x,y).value;
			if (n > 0) {
				digits.push(n);
			}
		}
		return digits;
	}
	getGroup(x,y) {
		x = Math.floor(x / 3) * 3;
		y = Math.floor(y / 3) * 3;
		let digits = [];
		for (let dy = 0; dy < 3; dy++) {
			for (let dx = 0; dx < 3; dx++) {
				let n = this.get(x+dx,y+dy).value;
				if (n > 0) {
					digits.push(n);
				}
			}
		}
		return digits;
	}
	getAll(x,y) {
		let col   = this.getColumn(x);
		let row   = this.getRow(y);
		let group = this.getGroup(x,y);
		return Array.union(col,row,group);
	}
	getRemaining(x,y) {
		let digits = this.getAll(x,y);
		let remaining = [];
		for (let i = 1; i <= SIZE; i++) {
			if (!digits.includes(i)) {
				remaining.push(i);
			}
		}
		return remaining;
	}
	toString() {
		return this.cells.map(cell => cell.value).join('');
	}
}

class Sudoku extends MessageGame {
	constructor(context, options) {
		super(context, [], options);
		this.init();
	}
	init() {
		super.init();
		this.embed.footer = {
			text: `${MOVE_LEFT}/${MOVE_UP}/${MOVE_DOWN}/${MOVE_RIGHT} = Move\n${NUMBERS[0]} = Remove\n${SOLVE} = Auto-Solve`
		};
		// create the game board
		this.game = new SudokuBoard(this.options.board);
		if (!this.options.board) {
			this.game.randomize(this.options.difficulty);
		}
		this.noSolution = false;
		
		this.avatar = new Pointer2D(0,0);
		while (this.game.get(this.avatar.x, this.avatar.y).defaultValue > 0) {
			this.avatar.x = random(SIZE);
			this.avatar.y = random(SIZE);
		}
		
		this.updateEmbed();
	}
	handlePlayerMove(reaction) {
		if (MOVEMENT.includes(reaction)) {
			switch (reaction) {
				case MOVE_RIGHT:
					this.avatar.dir = Pointer2D.DIRS.RIGHT;
					break;
				case MOVE_LEFT:
					this.avatar.dir = Pointer2D.DIRS.LEFT;
					break;
				case MOVE_UP:
					this.avatar.dir = Pointer2D.DIRS.UP;
					break;
				case MOVE_DOWN:
					this.avatar.dir = Pointer2D.DIRS.DOWN;
					break;
			}
			this.move();
		} else if (NUMBERS.includes(reaction)) {
			let num = NUMBERS.indexOf(reaction);
			// TODO: player number on grid
			let options = this.getMoveOptions();
			if (options.includes(num)) {
				this.set(num);
			}
		} else if (reaction == SOLVE) {
			this.noSolution = !this.game.autosolve();
		}
		this.finishMove();
		return true;
	}
	handleBotMove() {
		// TODO: show bot solving sudoku but slowly
		this.noSolution = !this.game.autosolve();
		return this.finishMove();
	}
	set(n) {
		let cell = this.game.get(this.avatar.x, this.avatar.y);
		cell.value = n;
		this.moves.push(cell);
	}
	move() {
		// the avatar can only travel onto cells where it is not a default sudoku value
		let next = this.avatar;
		do {
			next = next.next();
		} while (!next.OOB(SIZE,SIZE) && this.game.get(next.x, next.y).defaultValue > 0);
		if (!next.OOB(SIZE,SIZE)) {
			this.avatar.goto(next);
			return true;
		} else{
			return false;
		}
	}
	checkWinCondition() {
		if (this.noSolution) {
			return 'nobody';
		}
		for (let x = 0; x < SIZE; x++) {
			let col = this.game.getColumn(x);
			if (col.length < SIZE) return;
		}
		for (let y = 0; y < SIZE; y++) {
			let row = this.game.getRow(y);
			if (row.length < SIZE) return;
		}
		for (let y = 0; y < 3; y++) {
			for (let x = 0; x < 3; x++) {
				let group = this.game.getGroup(x * 3, y * 3);
				if (group.length < SIZE) return;
			}
		}
		return this.player;
	}
	getMoveOptions() {
		let options = this.game.getRemaining(this.avatar.x, this.avatar.y);
		if (this.game.get(this.avatar.x, this.avatar.y).value > 0) {
			options.unshift(0);
		}
		return options;
	}
	
	get status() {
		if (this.winner == this.player) {
			return {
				name: 'Game Complete',
				value: `${this.winner.username} solved the Sudoku puzzle!`
			};
		} else if (this.winner == 'nobody') {
			return {
				name: 'No Solution',
				value: 'Oops. Sorry.'
			};
		} else {
			return null;
		}
	}
	toString() {
		let width  = 11;
		let height = 11;
		
		let grid = new Array(width * height).fill(GRID);
		for (let y = 0, y0 = 0; y < height; y++) {
			for (let x = 0, x0 = 0; x < width; x++) {
				let gridIdx = y * width + x;
				if (y % 4 == 3 || x % 4 == 3) {
					grid[gridIdx] = GRID;
				} else if (this.avatar.equals(x0,y0) && !this.winner) {
					grid[gridIdx] = this.player.avatar;
				} else {
					grid[gridIdx] = NUMBERS[this.game.get(x0,y0).value];
				}
				if (x % 4 < 3) x0++;
			}
			if (y % 4 < 3) y0++;
		}
		
		let gridStr = '';
		for (let r = 0; r < height; r++) {
			gridStr += grid.slice(r * width, (r+1) * width).join('') + '\n';
		}
		return gridStr;
	}
	updateEmbed() {
		super.updateEmbed();
		if (!this.winner) {
			let cell = this.game.get(this.avatar.x,this.avatar.y);
			let options = this.getMoveOptions();
			this.embed.fields.unshift({
				name: this.player.username,
				value: `On: ${NUMBERS[cell.value]} | Options: ${options.map(o => NUMBERS[o]).join('')}`
			});
		}
		return this.embed;
	}
}

Sudoku.CONFIG = {
	gameType: MessageGame.CASUAL,
	howToPlay: 'Fill the grid such that every row, column, and 3x3 region contains every digit 1-9.',
	canRestart: true,
	interface: MOVEMENT.concat(NUMBERS,[SOLVE]),
	tokens: ['','🐉']
};

module.exports = Sudoku;
