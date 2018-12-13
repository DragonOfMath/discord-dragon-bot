const MessageGame = require('../../../Sessions/MessageGame');
const {Array,random} = require('../../../Utils');

const BLACK = '⚫';
const BLUE  = '🔵';
const RED   = '🔴';
const WHITE = '⚪';

const NUMBERS = [`1⃣`,`2⃣`,`3⃣`,`4⃣`,`5⃣`,`6⃣`,`7⃣`];
const TOKENS  = [WHITE,BLUE,RED];

const WIDTH    = 7;
const HEIGHT   = 6;
const IN_A_ROW = 4;

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

class ConnectFour extends MessageGame {
	constructor(context, players) {
		super(context, players);
		this.init();
	}
	init() {
		super.init();
		this.game = new Array(WIDTH * HEIGHT).fill(0);
		this.updateEmbed();
	}
	getOpenColumnSpot(col) {
		// unlike TTT, in Connect Four the disks cascade down the lowest point in a column
		for (let r = HEIGHT - 1, i; r > -1; r--) {
			if (!this.game[i = r * WIDTH + col]) {
				return i;
			}
		}
		return -1;
	}
	handlePlayerMove(reaction) {
		// get the board index corresponding with the reaction
		let col = NUMBERS.indexOf(reaction);
		if (col > -1) {
			let idx = this.getOpenColumnSpot(col);
			if (idx > -1) {
				this.makeMove(idx);
				return true;
			}
		}
		return false;
	}
	handleBotMove() {
		// most of the algorithm is borrowed from the tic-tac-toe game AI
		let indices   = this.game.map((x,i) => i);
		let usedMoves = indices.filter(i => this.game[i]);
		let selfMoves = usedMoves.filter(i => this.game[i] == this.playerID);
		let opptMoves = usedMoves.filter(i => this.game[i] != this.playerID);
		
		//console.log('Self Moves:', selfMoves.join(','));
		//console.log('Oppt Moves:', opptMoves.join(','));
		
		// free moves only consist of those directly on top of other occupied places or unfilled columns
		let freeMoves = new Array(WIDTH).fill(0).map((x,i) => this.getOpenColumnSpot(i)).filter(x => x > -1);
		let chosenMove;
		
		//console.log('Free Moves:', freeMoves.join(','));
		
		// score each row by the number of moves made so far that can result in a win
		let selfRows  = CHECKING_TABLE.filter(row => IN_A_ROW   == row.reduce((x,i) => (selfMoves.includes(i) || freeMoves.includes(i) ? ++x : x), 0));
		let opptRows  = CHECKING_TABLE.filter(row => IN_A_ROW   == row.reduce((x,i) => (opptMoves.includes(i) || freeMoves.includes(i) ? ++x : x), 0));
		let selfWinningRows = selfRows.filter(row => IN_A_ROW-1 == row.reduce((x,i) => (selfMoves.includes(i) ? ++x : x), 0));
		let opptWinningRows = opptRows.filter(row => IN_A_ROW-1 == row.reduce((x,i) => (opptMoves.includes(i) ? ++x : x), 0));
		
		// look for moves that decide who wins (from the player's perspective)
		if (selfWinningRows.length) {
			let winningMoves = freeMoves.filter(freeIdx => selfWinningRows.some(row => row.includes(freeIdx)));
			chosenMove = random(winningMoves);
			//console.log('Using winning move:', chosenMove);
		} else if (opptWinningRows.length) {
			let defenseMoves = freeMoves.filter(freeIdx => opptWinningRows.some(row => row.includes(freeIdx)));
			chosenMove = random(defenseMoves);
			//console.log('Using defensive move:', chosenMove);
		} else {
			chosenMove = random(freeMoves);
			//console.log('Using random free move:', chosenMove);
		}

		this.makeMove(chosenMove);
	}
	makeMove(idx) {
		// set the grid cell
		this.game[idx] = this.playerID;
		this.finishMove();
	}
	checkWinCondition() {
		let winningRow = CHECKING_TABLE.map(check => check.map(i => this.game[i])).find(row => {
			return row[0] && row.every(col => col == row[0]);
		});
		if(winningRow) {
			return winningRow[0];
		}
	}
	toString() {
		let gameTokens = this.game.map((x,i) => {
			return x ? TOKENS[x] : WHITE;
		});
		let gridStr = '';
		for (let r = 0; r < HEIGHT; r++) {
			gridStr += gameTokens.slice(r * WIDTH, (r+1) * WIDTH).join('') + '\n';
		}
		gridStr += NUMBERS.join('');
		return gridStr;
	}
}

// Game configuration
ConnectFour.CONFIG = {
	gameType: MessageGame.COMPETITIVE,
	displayName: 'Connect Four',
	howToPlay: 'Each player takes turns placing one token of their color in one of the seven slots. The first player to get 4 of their tokens in a row, column, or diagonal wins!',
	minPlayers: 2,
	maxPlayers: 2,
	minBotPlayers: 0,
	maxBotPlayers: 2,
	maxTurns: WIDTH * HEIGHT,
	canRestart: true,
	shufflePlayers: true,
	showSpectators: false,
	interface: NUMBERS,
	tokens: TOKENS
};

ConnectFour.WIDTH    = WIDTH;
ConnectFour.HEIGHT   = HEIGHT;
ConnectFour.IN_A_ROW = IN_A_ROW;
ConnectFour.CHECKING_TABLE = CHECKING_TABLE;

module.exports = ConnectFour;
