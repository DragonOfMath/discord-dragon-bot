const MessageGame = require('../../../Sessions/MessageGame');
const {Array,Pathfinder,random} = require('../../../Utils');

const RED   = 0;
const BLACK = 1;
const RED_DIR   = -1;
const BLACK_DIR =  1;
const RED_SQUARE    = '🟥';
const BLACK_SQUARE  = '⬛';
const RED_CHECKER   = '🔴';
const BLACK_CHECKER = '⚫';
const RED_KING      = '❤';
const BLACK_KING    = '🖤';

const MOVE_UP_LEFT  = '↖';
const MOVE_UP_RIGHT = '↗';
const MOVE_DOWN_LEFT  = '↙';
const MOVE_DOWN_RIGHT = '↘';

const ACTION = '🆗';

const BOARD_SIZE = 8;

class CheckerBoard {
	constructor() {
		this.board = [];
	}
	get(x,y) {
		if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
			return this.board[y][x];
		} else {
			return null;
		}
	}
	getCheckers(player) {
		let checkers = [];
		for (let row of this.board) {
			for (let sq of row) {
				if (sq.checker && sq.checker.player == player) {
					checkers.push(sq.checker);
				}
			}
		}
		return checkers;
	}
	initClassic(players) {
		this.board = [];
		for (let y = 0, row; y < BOARD_SIZE; y++) {
			row = [];
			for (let x = 0, sq, alt; x < BOARD_SIZE; x++) {
				alt = (x+y) % 2;
				sq = new CheckerSquare(x, y, alt ? BLACK_SQUARE : RED_SQUARE);
				if (alt) {
					if (y < 3) {
						sq.checker = new Checker(sq, BLACK, players[BLACK]);
					} else if (y > 4) {
						sq.checker = new Checker(sq, RED, players[RED]);
					}
				}
				row.push(sq);
			}
			this.board.push(row);
		}
	}
	initCustom(players, board) {
		
	}
	toString() {
		return this.board.map(row => row.map(sq => sq.toString()).join('')).join('\n');
	}
}

class CheckerSquare {
	constructor(x, y, color, checker = null) {
		this.x = x;
		this.y = y;
		this.color   = color;
		this.checker = checker;
	}
	toString() {
		if (this.checker) {
			return this.checker.toString();
		} else {
			return this.color; // == RED ? RED_SQUARE : BLACK_SQUARE;
		}
	}
}

class Checker {
	constructor(square, color, owner = null) {
		this.square = square;
		this.owner = owner;
		this.king  = false;
	}
	get kingColor() {
		return this.team == RED ? RED_KING : BLACK_KING;
	}
	get color() {
		return this.team == RED ? RED_CHECKER : BLACK_CHECKER;
	}
	get dir() {
		return this.team == RED ? RED_DIR : BLACK_DIR;
	}
	get x() {
		return this.square.x;
	}
	get y() {
		return this.square.y;
	}
	getMoves(board) {
		let moves = [], dir = this.dir, s;
		if (this.king) {
			s = board.get(this.x-1,this.y-dir);
			if (s) {
				if (s.checker) {
					if (s.checker.color != this.color && board.get(this.x-2,this.y-(2*dir))) {
						moves.push(s);
					}
				} else {
					moves.push(s);
				}
			}
			s = board.get(this.x+1,this.y-dir);
			if (s) {
				if (s.checker) {
					if (s.checker.color != this.color && board.get(this.x+2,this.y-(2*dir))) {
						moves.push(s);
					}
				} else {
					moves.push(s);
				}
			}
		}
		s = board.get(this.x-1,this.y+dir);
		if (s) {
			if (s.checker && s.checker.color != this.color) {
				if (board.get(this.x-2,this.y+(2*dir))) {
					moves.push(s);
				}
			} else {
				moves.push(s);
			}
		}
		
		s = board.get(this.x+1,this.y+dir);
		if (s) {
			if (s.checker && s.checker.color != this.color) {
				if (board.get(this.x+2,this.y+(2*dir))) {
					moves.push(s);
				}
			} else {
				moves.push(s);
			}
		}
		
		return moves;
	}
	move(toSquare, auxSquare) {
		this.remove();
		if (auxSquare) {
			auxSquare.checker.remove();
		}
		this.place(toSquare);
		if (this.color == RED && this.y == 0) {
			this.king = true;
		} else if (this.color == BLACK && this.y == BOARD_SIZE-1) {
			this.king = true;
		}
	}
	remove() {
		this.square.checker = null;
		this.square = null;
	}
	place(square) {
		square.checker = this;
		this.square = square;
	}
	toString() {
		return this.king ? this.kingColor : this.color;
	}
}

class Checkers extends MessageGame {
	/**
	 * Minesweeper constructor
	 * @param {MessageContext} context - the context containing the channel ID and client
	 * @param {Array<User>} players - array of players who will be playing this game
	 * @param {Object} options - configurations for the game
	 * @param {Number} [options.width]  - width of the minesweeper grid, maximum 10
	 * @param {Number} [options.height] - height of the minesweeper grid, maximum 10
	 * @param {Number} [options.mines]  - number of mines to place, maximum of width * height - 9
	 */
	constructor(context, players = [], options = {}) {
		super(context, players, options);
		this.init();
	}
	init() {
		super.init();
		this.game = new Board();
		this.game.initClassic(this.players);
		this.cursor = {x:0,y:0};
		this.selected = null;
		this.updateEmbed();
	}
	handlePlayerMove(reaction) {
		// TODO: check for chain hops
		let sq = this.game.get(this.cursor.x,this.cursor.y);
		switch (reaction) {
			case MOVE_UP_LEFT:
				if (this.game.get(this.cursor.x-1,this.cursor.y-1)) {
					this.cursor.x--;
					this.cursor.y--;
				}
				break;
			case MOVE_UP_RIGHT:
				if (this.game.get(this.cursor.x+1,this.cursor.y-1)) {
					this.cursor.x++;
					this.cursor.y--;
				}
				break;
			case MOVE_DOWN_LEFT:
				if (this.game.get(this.cursor.x-1,this.cursor.y+1)) {
					this.cursor.x--;
					this.cursor.y++;
				}
				break;
			case MOVE_DOWN_RIGHT:
				if (this.game.get(this.cursor.x+1,this.cursor.y+1)) {
					this.cursor.x++;
					this.cursor.y++;
				}
				break;
			case ACTION:
				if (this.selected) {
					if (sq == this.selected) {
						// deselect current square
						this.selected = null;
					} else {
						// check that move is valid
						if (this.selected.checker.getMoves().includes(sq)) {
							this.selected.checker.move(sq);
						}
					}
				} else {
					if (sq && sq.checker && sq.checker.owner == this.player) {
						// select current square
						this.selected = sq;
					}
				}
				break;
		}
		
		this.finishMove();
		return true;
	}
	handleBotMove() {
		// TODO: use minmax strategy and alpha-beta pruning
		let possibleMoves = [], attackMoves = [], checker, move;
		for (checker of this.game.getCheckers(this.player)) {
			for (move of checker.getMoves()) {
				possibleMoves.push([checker,move]);
				if (move.checker) {
					attackMoves.push([checker,move]);
				}
			}
		}
		if (possibleMoves.length) {
			if (attackMoves.length) {
				[checker,move] = random(attackMoves);
				let moveOver = this.board.get(
					checker.x+2*(move.x-checker.x),
					checker.y+2*(move.y-checker.y)
				);
				checker.move(moveOver,move);
			} else {
				[checker,move] = random(possibleMoves);
				checker.move(move);
			}
			
		}
		this.finishMove();
	}
	checkWinCondition() {
		let blackCheckers = this.game.getCheckers(this.players[BLACK]).length;
		let redCheckers   = this.game.getCheckers(this.players[RED]).length;
		if (blackCheckers && !redCheckers) {
			return this.players[BLACK];
		} else if (redCheckers && !blackCheckers) {
			return this.players[RED];
		} else {
			return null;
		}
	}
	get status() {
		if (this.winner == 'nobody' || this.winner == 'tie') {
			return {
				name: 'Draw',
				value: 'How did this happen?!'
			};
		} else if (this.winner) {
			return {
				name: 'Winner!',
				value: `${this.winner.username} won!`
			};
		} else {
			return {
				name: `Turn ${this.turns}`,
				value: `${this.player.username}'s turn.`
			};
		}
	}
	get color() {
		if (this.winner) {
			if (this.winner == 'nobody' || this.winner == 'tie') {
				return 0x888888;
			} else if (this.winner.bot && this.userPlayers.length) {
				return 0xFF0000;
			} else {
				return 0x00FF00;
			}
		} else {
			return 0;
		}
	}
	toString() {
		return this.game.toString();
	}
}

// Game configuration
Checkers.CONFIG = {
	gameType: MessageGame.COMPETITIVE,
	howToPlay: 'Move your checkers diagonally and jump over your opponent\'s checkers to win. Reach the opponent\'s back row with your checker to enable jumping back for that checker.',
	canRestart: true,
	shufflePlayers: true,
	showSpectators: false,
	minPlayers: 2,
	maxPlayers: 2,
	interface: [MOVE_UP_LEFT,MOVE_DOWN_LEFT,MOVE_DOWN_RIGHT,MOVE_UP_RIGHT,ACTION]
};

module.exports = Checkers;
