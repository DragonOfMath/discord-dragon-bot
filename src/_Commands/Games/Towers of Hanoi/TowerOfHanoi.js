const MessageGame = require('../../../Sessions/MessageGame');

const MOVE_LEFT  = '⬅';
const MOVE_RIGHT = '➡';
const ACTION     = '🆗';
const HINT       = '🆓';
const SOLVE      = '✅';

const NUMBERS = [`0⃣`,`1⃣`,`2⃣`,`3⃣`,`4⃣`,`5⃣`,`6⃣`,`7⃣`,`8⃣`,`9⃣`,`🔟`];

class TowerOfHanoi extends MessageGame {
	constructor(context, options = {}) {
		super(context, [], options);
		this.towers = new Array(3);
		this.blocks  = Math.max(3,Math.min(this.options.difficulty, 10)) || 4;
		this.init();
	}
	init() {
		super.init();
		this.embed.footer = {
			text: `${MOVE_LEFT}/${MOVE_RIGHT} = Move\n${ACTION} = Grab/Drop\n${HINT} = Hint\n${SOLVE} = Auto-Solve`
		};
		
		this.towers = this.towers.fill(0).map(t => []);
		this.towers[0] = Array(this.blocks).fill(0).map((x,i) => this.blocks - i);
		this.moves    = []; // move history
		this.position = 0;
		this.holding  = 0;
		this.auto     = false;
		
		this.updateEmbed();
	}
	get firstTower() {
		return this.towers[0];
	}
	get lastTower() {
		return this.towers[this.towers.length-1];
	}
	get activeTower() {
		return this.towers[this.position];
	}
	get status() {
		if (this.winner) {
			return {
				name: 'Game Complete',
				value: this.auto ? `The tower is complete.` : `${this.winner.username} solved it in ${this.moves.length} moves!`
			};
		} else {
			return {
				name: `Turn ${this.turns}`,
				value: this.auto ? `Sit back and watch...` : `${this.player.username}, take your time...`
			};
		}
	}
	get color() {
		if (this.winner) {
			return 0x00FF00;
		}
	}
	pickup() {
		let at = this.activeTower;
		if (!at.length) {
			return false;
		} else {
			this.holding = at.pop();
			this.recordMove();
			return true;
		}
	}
	drop() {
		let at = this.activeTower;
		if (at.length && this.holding > at[at.length-1]) {
			return false;
		} else {
			at.push(this.holding);
			this.holding = 0;
			this.recordMove();
			return true;
		}
	}
	recordMove() {
		if (this.position == this.moves[this.moves.length-1]) {
			// undo the last move
			this.moves.pop();
		} else {
			// record move
			this.moves.push(this.position);
		}
	}
	handlePlayerMove(reaction) {
		switch (reaction) {
			case MOVE_LEFT:
				if (this.position == 0) return;
				this.position--;
				break;
			case MOVE_RIGHT:
				if (this.position == this.towers.length - 1) return;
				this.position++;
				break;
			case ACTION:
				if (this.holding) {
					if (!this.drop()) return;
				} else {
					if (!this.pickup()) return;
				}
				break;
			case SOLVE:
				this.player.auto = true;
			case HINT:
				this.handleBotMove();
				return true;
		}
		this.finishMove();
		return true;
	}
	handleBotMove() {
		if (!this.autoSolution) {
			let solution = this.autoSolution = [];
			function hanoi(n, src, tgt, aux) {
				if (n > 0) {
					hanoi(n - 1, src, aux, tgt);
					solution.push(src);
					solution.push(tgt);
					hanoi(n - 1, aux, tgt, src);
				}
			}
			hanoi(this.blocks, 0, 2, 1);
			//console.log(solution);
		}
		
		// find in the move history where it diverges from the solution
		let moves    = this.moves;
		let solution = this.autoSolution;
		let lastCorrectMove, nextCorrectMove, backtrackIndex;
		for (let i = 0; i < solution.length; i++) {
			if (moves[i] == solution[i]) {
				lastCorrectMove = moves[i];
			} else {
				backtrackIndex  = i;
				nextCorrectMove = solution[i];
				break;
			}
		}
		
		// correct the move history by rolling back bad moves and continuing good moves
		let pos;
		if (moves.length > backtrackIndex) {
			pos = moves[moves.length-1];
			//console.log('Backtracking to:',pos,'Currently:',this.position,this.holding);
		} else {
			pos = nextCorrectMove;
			//console.log('Next correct move:',pos,'Currently:',this.position,this.holding);
		}
		// progress to the next move
		if (this.position < pos) {
			this.position++;
		} else if (this.position > pos) {
			this.position--;
		} else if (this.holding) {
			this.drop();
		} else {
			this.pickup();
		}
		this.finishMove();
	}
	checkWinCondition() {
		return this.lastTower.length == this.blocks ? this.player : null;
	}
	toString() {
		let width = 2 * this.towers.length + 1;
		let height = this.blocks + 3;
		
		// start with a grid space
		let grid = new Array(width * height).fill('⬜');
		
		// add the towers (number = block, black = no block)
		for (let t = 0, tower, r, c; t < this.towers.length; t++) {
			tower = this.towers[t];
			c = 2 * t + 1;
			for (r = 0;r < tower.length; r++) {
				grid[(height - (r+2)) * width + c] = NUMBERS[tower[r]];
			}
			for (;r < this.blocks; r++) {
				grid[(height - (r+2)) * width + c] = '⬛';
			}
		}
		// place a chequered flag just below the last tower
		grid[(height * width) - 2] = '🏁';
		
		// show the hand's state on the top row
		let handPos = 2 * this.position + 1;
		grid[handPos] = this.holding ? '👊' : '🖐';
		
		// if a block is held, show this just below the hand
		if (this.holding) {
			grid[handPos + width] = NUMBERS[this.holding];
		}
		
		// show left and right arrows when usable
		if (this.position > 0) {
			grid[handPos-1] = MOVE_LEFT;
		}
		if (this.position < this.towers.length - 1) {
			grid[handPos+1] = MOVE_RIGHT;
		}
		
		// serialize the grid into a string
		let gridStr = '';
		for (let r = 0; r < height; r++) {
			gridStr += grid.slice(r * width, (r+1) * width).join('') + '\n';
		}
		return gridStr;
	}
	updateEmbed() {
		super.updateEmbed();
		this.embed.title = TowerOfHanoi.displayName;
		return this.embed;
	}
}

// Game configuration
TowerOfHanoi.CONFIG = {
	gameType: MessageGame.CASUAL,
	displayName: 'Tower of Hanoi',
	howToPlay: 'Move all the blocks from the left tower to the right tower, one at a time.\nYou can only place blocks on top of blocks with a larger value.',
	interface: [MOVE_LEFT,ACTION,MOVE_RIGHT,HINT,SOLVE]
};

module.exports = TowerOfHanoi;
