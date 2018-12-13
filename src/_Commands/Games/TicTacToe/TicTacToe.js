const MessageGame = require('../../../Sessions/MessageGame');
const {Markdown:md,Format:fmt,random} = require('../../../Utils');

const NUMBERS = [`1⃣`,`2⃣`,`3⃣`,`4⃣`,`5⃣`,`6⃣`,`7⃣`,`8⃣`,`9⃣`];
const TOKENS  = ['','❌','⭕'];

const WIDTH    = 3;
const HEIGHT   = 3;
const IN_A_ROW = 3;

// cache every row, column, and diagonal
const CHECKING_TABLE = (function (tbl) {
	let r, c, o, row, col, diag;
	for (r = 0; r < HEIGHT; r++) {
		for (c = 0; c < WIDTH - IN_A_ROW + 1; c++) {
			row = [];
			for (o = 0; o < IN_A_ROW; o++) {
				row.push(r * WIDTH + (c+o));
			}
			tbl.push(row);
		}
	}
	for (r = 0; r < HEIGHT - IN_A_ROW + 1; r++) {
		for (c = 0; c < WIDTH; c++) {
			col = [];
			for (o = 0; o < IN_A_ROW; o++) {
				col.push((r+o) * WIDTH + c);
			}
			tbl.push(col);
		}
	}
	for (r = 0; r < HEIGHT - IN_A_ROW + 1; r++) {
		for (c = 0; c < WIDTH - IN_A_ROW + 1; c++) {
			diag = [];
			for (o = 0; o < IN_A_ROW; o++) {
				diag.push((r+o) * WIDTH + (c+o));
			}
			tbl.push(diag);
			diag = [];
			for (o = 0; o < IN_A_ROW; o++) {
				diag.push((HEIGHT-1-(r+o)) * WIDTH + (c+o));
			}
			tbl.push(diag);
		}
	}
	return tbl;
})([]);

class TicTacToe extends MessageGame {
	constructor(context, players) {
		super(context, players);
		this.init();
	}
	init() {
		super.init();
		this.game = new Array(WIDTH * HEIGHT).fill(0);
		this.updateEmbed();
	}
	handlePlayerMove(reaction) {
		let idx = NUMBERS.indexOf(reaction);
		if (idx > -1) {
			// the spot is occupied
			if (this.game[idx] > 0) {
				return;
			}
			// set the board position
			this.makeMove(idx);

			return true;
		}
	}
	handleBotMove() {
		let indices   = this.game.map((x,i) => i);
		let usedMoves = indices.filter(i => this.game[i]);
		let freeMoves = indices.filter(i => !this.game[i]);
		let selfMoves = usedMoves.filter(i => this.game[i] == this.playerID);
		let opptMoves = usedMoves.filter(i => this.game[i] != this.playerID);
		let chosenMove;
		
		// endgame rows include those which are not occupied by the other player
		let selfRows = CHECKING_TABLE.filter(row => IN_A_ROW == row.reduce((x,i) => (selfMoves.includes(i) || freeMoves.includes(i) ? ++x : x), 0));
		let opptRows = CHECKING_TABLE.filter(row => IN_A_ROW == row.reduce((x,i) => (opptMoves.includes(i) || freeMoves.includes(i) ? ++x : x), 0));
		
		// close wins are rows occupied in at least 2 spots by a single player
		let selfWinningRows = selfRows.filter(row => IN_A_ROW-1 == row.reduce((x,i) => (selfMoves.includes(i) ? ++x : x), 0));
		let opptWinningRows = opptRows.filter(row => IN_A_ROW-1 == row.reduce((x,i) => (opptMoves.includes(i) ? ++x : x), 0));
		
		// look for moves that decide who wins (from the player's perspective)
		if (selfWinningRows.length > 0) {
			let winningMoves  = freeMoves.filter(i => selfWinningRows.some(row => row.includes(i)));
			chosenMove = random(winningMoves);
			//console.log('Using winning move:', chosenMove);
		} else if (opptWinningRows.length > 0) {
			let defenseMoves = freeMoves.filter(i => opptWinningRows.some(row => row.includes(i)));
			chosenMove = random(defenseMoves);
			//console.log('Using defensive move:', chosenMove);
		} else {
			chosenMove = random(freeMoves);
			//console.log('Using random free move:', chosenMove);
		}
		
		this.makeMove(chosenMove);
	}
	makeMove(idx) {
		// set the board cell
		this.game[idx] = this.playerID;
		this.finishMove();
	}
	checkWinCondition() {
		// find a 3-in-a-row for either player
		let winningRow = CHECKING_TABLE.map(check => check.map(i => this.game[i])).find(row => {
			return row[0] && row.every(col => col == row[0]);
		});
		if (winningRow) {
			return winningRow[0];
		}
	}
	toString() {
		let gameTokens = this.game.map((x,i) => {
			return x ? TOKENS[x] : NUMBERS[i];
		});
		let gridStr = '';
		for (let r = 0; r < HEIGHT; r++) {
			gridStr += gameTokens.slice(r * WIDTH, (r+1) * WIDTH).join('') + '\n';
		}
		return gridStr;
	}
}

// Game configuration
TicTacToe.CONFIG = {
	gameType: MessageGame.COMPETITIVE,
	displayName: 'Tic-Tac-Toe',
	howToPlay: 'Each player takes turns placing their symbol (an X or an O) into an open space in the 3x3 grid. 3 X\'s or 3 O\'s in a row, column, or diagonal to win!',
	minPlayers: 2,
	maxPlayers: 2,
	maxBotPlayers: 2,
	maxTurns: WIDTH * HEIGHT,
	interface: NUMBERS,
	tokens: TOKENS
};

TicTacToe.WIDTH    = WIDTH;
TicTacToe.HEIGHT   = HEIGHT;
TicTacToe.IN_A_ROW = IN_A_ROW;
TicTacToe.CHECKING_TABLE = CHECKING_TABLE;

module.exports = TicTacToe;
