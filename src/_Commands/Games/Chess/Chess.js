const MessageGame = require('../../../Sessions/MessageGame');
const {Markdown:md} = require('../../../Utils');

const PAWN = 'P';
const ROOK = 'R';
const KNIGHT = 'N';
const BISHOP = 'B';
const QUEEN = 'Q';
const KING = 'K';

const EMPTY = '.';

const WHITE = 0;
const BLACK = 1;

const EMOJI = {
	[PAWN]: ['♙','♟︎'],
	[ROOK]: ['♖','♜'],
	[KNIGHT]: ['',''],
	[BISHOP]: ['♗','♝'],
	[QUEEN]: ['♕','♛'],
	[KING]: ['♔','♚']
};

const WEIGHT = {
	[PAWN]: 1,
	[ROOK]: 8,
	[KNIGHT]: 6,
	[BISHOP]: 8,
	[QUEEN]: 20,
	[KING]: 1000
};

const INITIAL_BOARD = [
	[[ROOK,BLACK],[KNIGHT,BLACK],[BISHOP,BLACK],[QUEEN,BLACK],[KING,BLACK],[BISHOP,BLACK],[KNIGHT,BLACK],[ROOK,BLACK]],
	[[PAWN,BLACK],[PAWN,BLACK],  [PAWN,BLACK],  [PAWN,BLACK], [PAWN,BLACK],[PAWN,BLACK],  [PAWN,BLACK],  [PAWN,BLACK]],
	[null,        null,          null,          null,         null,        null,          null,          null        ],
	[null,        null,          null,          null,         null,        null,          null,          null        ],
	[null,        null,          null,          null,         null,        null,          null,          null        ],
	[null,        null,          null,          null,         null,        null,          null,          null        ],
	[[PAWN,WHITE],[PAWN,WHITE],  [PAWN,WHITE],  [PAWN,WHITE], [PAWN,WHITE],[PAWN,WHITE],  [PAWN,WHITE],  [PAWN,WHITE]],
	[[ROOK,WHITE],[KNIGHT,WHITE],[BISHOP,WHITE],[QUEEN,WHITE],[KING,WHITE],[BISHOP,WHITE],[KNIGHT,WHITE],[ROOK,WHITE]]
];

const UP     = '⬆';
const DOWN   = '⬇';
const RIGHT  = '➡';
const LEFT   = '⬅';
const SELECT = '🆗';

function toRankAndFile(x,y) {
	return 'abcdefgh'[x] + String(8-y);
}
function toXandY(rf) {
	let x = 'abcdefgh'.indexOf(rf[0]);
	let y = 8 - Number(rf[1]);
	return {x,y};
}
function toDesc(pos) {
	return (pos.piece ? EMOJI[pos.piece.type][pos.piece.team] : '') + toRankAndFile(pos.x,pos.y) + (pos.promotion ? '^' + pos.promotion : '') + (pos.checkmate ? '#' : '');
}
function cmp(a,b) {
	return a > b ? 1 : a < b ? -1 : 0;
}

class Chess extends MessageGame {
	board = null;
	moves = null;
	turn = WHITE;
	turns = 0;
	difficulty = 1;
	allowCastling     = false;
	allowEnPassant    = false;
	allowBacktracking = false;
	queeningOnly      = true;
	
	moveHistoryLength = 3;
	constructor(context, players, options = {}) {
		super(context, players);
		this.board = [];
		this.moves = [];
		this.game  = this.board;
		
		this.difficulty     = options.difficulty ?? this.difficulty;
		this.allowCastling  = options.castling   ?? this.allowCastling;
		this.allowEnPassant = options.enpassant  ?? this.allowEnPassant;
		this.queeningOnly   = options.queening   ?? this.queeningOnly;
		this.init();
	}
	init() {
		this.board.fill(null);
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				if (INITIAL_BOARD[y][x]) {
					this.set(x,y, {type: INITIAL_BOARD[y][x][0], team: INITIAL_BOARD[y][x][1]});
				}
			}
		}
		this.turn = WHITE;
		this.turns = 0;
		this.moves = [];
		
		this.cursor = {x:0,y:7};
		this.pieceSelected = null;
		this.lastMoveResult = false;
		
		this.updateEmbed();
	}
	get(x,y) {
		if (x < 0 || x >= 8 || y < 0 || y >= 8) return null;
		return { x, y, piece: this.board[y*8+x] };
	}
	set(x,y,piece) {
		this.board[y*8+x] = piece;
	}
	undo() {
		let {from,to} = this.moves.pop();
		// move pieces back to their previous positions
		this.set(to.x, to.y, to.piece);
		this.set(from.x, from.y, from.piece);
		if (to.promotion) from.piece.type = PAWN;
	}
	movePiece(from, to) {
		this.set(from.x, from.y, null);
		this.set(to.x, to.y, from.piece);
		if (to.promotion) from.piece.type = to.promotion;
		this.moves.push({from, to});
	}
	getPiece(type,team) {
		let pos;
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				if ((pos = this.get(x,y)) && pos.piece && pos.piece.type === type && pos.piece.team === team) return pos;
			}
		}
		return null;
	}
	getTeamPieces(team) {
		let pieces = [], pos;
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				if ((pos = this.get(x,y)) && pos.piece && pos.piece.team === team) {
					pieces.push(pos);
				}
			}
		}
		return pieces;
	}
	getMoves(pos) {
		if (!pos.piece) return null;
		
		var chess = this, moves = [], move,
			white = team === WHITE, dir = white ? -1 : 1, start = white ? 0 : 7, end = white ? 7 : 0,
			ox = pos.x, oy = pos.y, piece = pos.piece, p = piece.type, t = piece.team,
			K = p === KING, q = p === QUEEN, r = p === ROOK, b = p === BISHOP, k = p === KNIGHT, p = p === PAWN,
			n = K ? 1 : 8, i, c = 0xFF;
		
		function query(x,y) {
			return (move = chess.get(x,y)) && (!move.piece || move.piece.team !== t) && move;
		}
		function scan(dx,dy,o) {
			return (c & (1 << o)) && (query(ox+dx,oy+dy) && !!moves.push(move) || (c ^= 1 << o));
		}
		function scan2(dx,dy,o=0) {
			scan(-dx,-dy,o);
			scan(dx,dy,o+1);
			return c;
		}
		function scan4(dx,dy,o=0) {
			scan2(dx,dy,o);
			scan2(dy,dx,o+2);
			return c;
		}
		function scan4x(dx,dy,o=0) {
			scan2( dx,dy,o);
			scan2(-dx,dy,o+2);
			return c;
		}
		function scan8(dx,dy,o=0) {
			scan4x(dx,dy,o);
			scan4x(dy,dx,o+4);
			return c;
		}
		
		if (p) {
			if (query(ox,oy+dir) && !move.piece) {
				moves.push(move);
				if (move.y === end) {
					// TODO: any piece promotion
					move.promotion = QUEEN;
				} else if (oy === (start+dir) && (query(ox,oy+2*dir)) && !move.piece) {
					move.enPassant = this.allowEnPassant;
					moves.push(move);
				}
			}
			if (this.moves[this.moves.length-1]?.to?.enPassant) {
				// TODO: en passant
			}
			if (query(ox-1,oy+dir) && move.piece) moves.push(move);
			if (query(ox+1,oy+dir) && move.piece) moves.push(move);
		}
		if (k) scan8(1,2);
		if (b || q || K) for (i = 1; scan4x(i,i) && i++ < n;);
		if (r || q || K) for (i = 1; scan4(i,0) && i++ < n;);
		// TODO: castling
		
		console.log('[DEBUG] Chess#getMoves(',pos,') = ',moves,c);
		
		return moves;
	}
	checkForCyclicPattern(from, to) {
		// check for a cyclic movement pattern after some progression
		for (let i = this.moves.length-2, m; i > 10 && i > this.moves.length-10; --i) {
			m = this.moves[i];
			if (m.from.piece === from.piece
			 && m.from.x === from.x && m.from.y === from.y
			 && m.to.x   === to.x   && m.to.y   === to.y) {
				return true;
			}
		}
		return false;
	}
	toString() {
		let str = '```\n';
		for (let x, y = 0, row, piece; y < 8; y++) {
			for (x = 0, row = []; x < 8; x++) {
				piece = this.board[y*8+x];
				row.push(piece ? EMOJI[piece.type][piece.team] : EMPTY);
			}
			str += row.join('\t') + '\n';
		}
		str += '```\n';
		if (this.moveHistoryLength > 0) {
			for (let i = 0; i < this.moveHistoryLength && this.moves.length-i > 0; i++) {
				str += 'Turn ' + (this.turns-i) + ': ' + toDesc(this.moves[this.moves.length-1-i]) + '\n';
			}
		}
		return str;
	}
	autoplay() {
		let tmp;
		while (typeof(tmp) !== 'string') {
			console.log(this.toString());
			tmp = this.nextAIMove();
		}
		console.log(this.toString() + '\n' + tmp);
	}
	doMove(from, to, isPlayerMove) {
		console.log(`${this.turns+1}: ${toDesc(from)} -> ${toDesc(to)}`);
		if (to.checkmate) {
			return 'Checkmate. ' + (this.turn === BLACK ? 'Black' : 'White') + ' wins!';
		} else if (!isPlayerMove && this.checkForCyclicPattern(from, to)) {
			return 'Draw.';
		} else {
			this.movePiece(from, to);
			this.turn = 1 - this.turn;
			this.turns++;
			return true;
		}
	}
	AI(ply = 0, team = WHITE) {
		let choices = [];
		let teamPieces = this.getTeamPieces(team);
		
		// prioritize keeping the king out of check before making other moves.
		let king = teamPieces.find(p => p.piece.type === KING);
		
		for (let current of teamPieces) {
			current.value = WEIGHT[current.piece.type];
			for (let move of this.getMoves(pos)) {
				// avoid moves that result in backtracking
				if (!this.allowBacktracking && this.checkForCyclicPattern(current, move)) continue;
				
				// the value of the move is from the piece taken, otherwise 0
				if (move.piece) {
					move.value = WEIGHT[move.piece.type];
					if (move.piece.type === KING && move.piece.team !== current.team) {
						move.checkmate = true;
					}
				} else {
					move.value = 0;
				}
				
				if (!move.checkmate && ply > 0) {
					let next;
					
					// simulate this move (will be undone afterwards)
					this.movePiece(current, move);
					if (move.promotion) {
						move.type = move.promotion;
						move.value = WEIGHT[move.promotion];
					}
					// predict where the opponent moves
					next = this.AI(ply - 1, team === WHITE ? BLACK : WHITE);
					
					// subtract their value from this move; worse moves score lower, so they are avoided
					move.value -= next.to.value;
					this.undo();
				}
				// add this move to the list
				choices.push({from: current, to: move});
			}
		}
		// choose a move that is likely to result in a good outcome
		// if all moves result in checkmate, then it doesn't matter
		choices = choices.sort((c1,c2) => cmp(c1.to.value, c2.to.value));
		let rnd = Math.random();
		// bias towards stronger moves with higher difficulty
		rnd += (this.difficulty / 5) * (1 - rnd);
		return choices[Math.floor(bestMoves.length * rnd)];
	}
	handlePlayerMove(reaction) {
		switch (reaction) {
			case LEFT:
				this.cursor.x = Math.max(0, this.cursor.x-1);
				break;
			case RIGHT:
				this.cursor.x = Math.min(7, this.cursor.x+1);
				break;
			case UP:
				this.cursor.y = Math.max(0, this.cursor.y-1);
				break;
			case DOWN:
				this.cursor.y = Math.min(7, this.cursor.y+1);
				break;
			case SELECT:
				let selection = this.get(this.cursor.x, this.cursor.y);
				if (this.pieceSelected) {
					let moves = this.getMoves(this.pieceSelected);
					for (let move of moves) {
						if (move.x == selection.x && move.y == selection.y) {
							this.lastMoveResult = this.doMove(this.pieceSelected, selection, true);
							break;
						}
					}
					if (this.lastMoveResult) {
						this.pieceSelected = null;
						this.finishMove();
					}
				} else if (selection.piece && selection.piece.team === this.playerID) {
					this.pieceSelected = selection;
				} else {
					this.pieceSelected = null;
				}
		}
		return true;
	}
	handleBotMove() {
		let move = this.AI(this, this.difficulty, this.turn);
		this.lastMoveResult = this.doMove(move.from, move.to, false);
		if (this.lastMoveResult) {
			this.finishMove();
		}
	}
	checkWinCondition() {
		if (typeof this.lastMoveResult === 'string') {
			return this.lastMoveResult;
		}
	}
	updateEmbed() {
		super.updateEmbed();
		this.embed.description = this.toString();
		if (this.winner) {
			this.embed.description += '\n' + this.lastMoveResult;
		} else {
			if (!this.player.bot) {
				this.embed.description += '\nCursor: ' + toDesc(this.cursor);
				if (this.pieceSelected) {
					this.embed.description += '\n**Selected**: ' + toDesc(this.pieceSelected);
				}
			}
		}
		return this.embed;
	}
}

Chess.CONFIG = {
	gameType: MessageGame.COMPETITIVE,
	displayName: 'Chess',
	howToPlay: 'Strategize your pieces and try to checkmate your opponent. Read here for a comprehensive overview of the rules: https://en.wikipedia.org/wiki/Chess#Rules',
	minPlayers: 1,
	maxPlayers: 2,
	maxBotPlayers: 2,
	maxTurns: 300,
	interface: [SELECT,LEFT,UP,DOWN,RIGHT]
};

module.exports = Chess;
