const MessageGame = require('../../../Sessions/MessageGame');
const {Array,Pathfinder,random} = require('../../../Utils');

const HIDDEN = '⬛';
const MINE = '💥';
const FLAG = '🚩';
const NUMBERS = ['⬜',`1⃣`,`2⃣`,`3⃣`,`4⃣`,`5⃣`,`6⃣`,`7⃣`,`8⃣`,`9⃣`,`🔟`];

const MOVE_UP = '⬆';
const MOVE_DOWN = '⬇';
const MOVE_RIGHT = '➡';
const MOVE_LEFT = '⬅';
// TODO: add intercardinal directions?
const ACTION = '🆗';

class Point {
	constructor(x,y) {
		this.x = x|0;
		this.y = y|0;
	}
	near(x,y) {
		if (typeof(x) === 'object') {
			({x,y} = x);
		}
		return Math.abs(x - this.x) < 2 && Math.abs(y - this.y) < 2;
	}
	far(x,y) {
		if (typeof(x) === 'object') {
			({x,y} = x);
		}
		return Math.abs(x - this.x) > 1 && Math.abs(y - this.y) > 1;
	}
	equals(x,y) {
		if (typeof(x) === 'object') {
			({x,y} = x);
		}
		return this.x == x && this.y == y;
	}
	manhattan(x,y) {
		if (typeof(x) === 'object') {
			({x,y} = x);
		}
		return Math.abs(x - this.x) + Math.abs(y - this.y);
	}
	getClosest(points, map = x => x) {
		let closest = null, distance = Infinity, m;
		for (let p of points) {
			m = map(p).manhattan(this);
			if (m < distance) {
				closest = p;
				distance = m;
			}
		}
		return closest;
	}
}

class Cell extends Point {
	constructor(x, y) {
		super(x,y);
		this.visible = false;
		this.flagged = false;
		this.value = 0;
	}
	get hidden() {
		return !this.visible;
	}
	set hidden(x) {
		this.visible = !x;
	}
	get shown() {
		return this.visible;
	}
	set shown(x) {
		this.visible = true;
	}
	flag(player) {
		this.flagged = true;
		this.flaggedBy = player;
	}
	unflag() {
		this.flagged = false;
		this.flaggedBy = null;
	}
	show() {
		this.visible = true;
	}
	hide() {
		this.visible = false;
	}
	toString() {
		if (this.flagged) {
			return FLAG;
		} else if (this.hidden) {
			return HIDDEN;
		} else {
			return NUMBERS[this.value];
		}
	}
}

class Mine extends Cell {
	constructor(x,y) {
		super(x,y);
	}
	toString() {
		if (this.flagged) {
			return FLAG;
		} else if (this.hidden) {
			return HIDDEN;
		} else {
			return MINE;
		}
	}
}

class Avatar extends Point {
	constructor(player,x,y) {
		super(x,y);
		this.player = player;
		this.alive = true;
		this.killedBy = null;
		this.score = 0;
	}
	get dead() {
		return !this.alive;
	}
	set dead(x) {
		this.alive = !x;
	}
	get displayName() {
		return this.player.username + `(${this.state})`;
	}
	get state() {
		return this.alive ? this.player.avatar : '☠';
	}
	flag(cell) {
		if (cell.hidden && !cell.flagged) {
			cell.flag(this);
			this.score++;
			return true;
		} else {
			return false;
		}
	}
	unflag(cell) {
		if (cell.hidden && cell.flagged) {
			cell.unflag(this);
			this.score--;
			return true;
		} else {
			return false;
		}
	}
	die(mine) {
		mine.show();
		this.dead = true;
		this.killedBy = mine;
		this.score = 0;
		this.player.active = false;
		this.player.reason = 'stepped on a mine and it exploded';
	}
	toString() {
		return this.player.toString();
	}
}

class Task {
	constructor(cell, action, priority = 0) {
		this.cell     = cell;
		this.action   = action;
		this.priority = 0;
	}
}

class Minesweeper extends MessageGame {
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
		if (typeof(options.width) === 'undefined') {
			options.width = 10;
		}
		if (typeof(options.height) === 'undefined') {
			options.height = 10;
		}
		if (typeof(options.mines) === 'undefined') {
			options.mines = 10;
		}
		options.width  = Math.min(+options.width, 10);
		options.height = Math.min(+options.height, 10);
		options.mines  = Math.min(+options.mines, options.width * options.height - 9);
		super(context, players, options);
		this.init();
	}
	init() {
		super.init();
		this.embed.footer = {
			text: `${MOVE_LEFT}/${MOVE_RIGHT}/${MOVE_UP}/${MOVE_DOWN} = Move\n${ACTION} = Reveal Area\n${FLAG} = Set/Pickup Flag`
		};
		
		this.game = new Array(this.options.height).fill(0).map((row,y) => new Array(this.options.width).fill(0).map((col,x) => new Cell(x,y,HIDDEN)));
		this.mines = [];
		this.flagsRemaining = this.options.mines;
		
		// place the players in the middle of the grid
		let center = new Cell(this.options.width / 2 - this.players.length / 2, this.options.height / 2);
		this.avatars = this.players.map((player,p) => new Avatar(player, center.x + p, center.y));
		
		this.updateEmbed();
	}
	placeMines() {
		this.mines = [];
		let x, y, mine;
		do {
			x = random(this.options.width);
			y = random(this.options.height);
			mine = new Mine(x,y);
			if (mine.far(this.avatar) && !this.mines.some(m => m.equals(mine))) {
				this.mines.push(mine);
				this.game[y][x] = mine;
			}
		} while (this.minesPlaced < this.options.mines);
	}
	get minesPlaced() {
		return this.mines.length;
	}
	get minesFlagged() {
		return this.mines.filter(m => m.flagged).length;
	}
	get minesExploded() {
		return this.mines.filter(m => m.visible).length;
	}
	get minesRemaining() {
		return this.mines.filter(m => m.hidden && !m.flagged).length;
	}
	get avatar() {
		return this.avatars[this.playerIdx];
	}
	handlePlayerMove(reaction) {
		switch (reaction) {
			case MOVE_LEFT:
				if (this.avatar.x == 0) return;
				this.avatar.x--;
				break;
			case MOVE_RIGHT:
				if (this.avatar.x == this.options.width - 1) return;
				this.avatar.x++;
				break;
			case MOVE_UP:
				if (this.avatar.y == 0) return;
				this.avatar.y--;
				break;
			case MOVE_DOWN:
				if (this.avatar.y == this.options.height - 1) return;
				this.avatar.y++;
				break;
			case ACTION:
				this.revealArea();
				break;
			case FLAG:
				this.setOrPickupFlag();
				break;
		}
		
		this.finishMove();
		return true;
	}
	handleBotMove() {
		// prepare the bot's todo lists for flagging and revealing
		if (!this.avatar.todo) {
			this.avatar.todo = [];
		} else {
			// cells in the todo list must still be hidden and unflagged
			this.avatar.todo = this.avatar.todo.filter(task => task.cell.hidden && !task.cell.flagged).sort((t1,t2) => {
				if (t1.priority > t2.priority) return 1;
				if (t1.priority < t2.priority) return -1;
				return 0;
			});
		}
		let destination;
		
		// get the current state of the game grid
		let currentCell  = this.getCellAt(this.avatar);
		let otherPlayers = this.avatars.filter(a => a != this.avatar);
		let revealed = [];
		let hidden   = [];
		let flagged  = [];
		let unflagged = [];
		this.game.forEach(row => row.forEach(col => {
			// ignore grid spaces masked by other players
			if (otherPlayers.some(player => player.equals(col))) return;
			if (col.hidden) hidden.push(col);
			else revealed.push(col);
			if (col.flagged) flagged.push(col);
			else unflagged.push(col);
		}));

		// if the bot is out of flags, such as when another player misplaced a flag,
		// find one it did not set and pick it up to reuse
		if (this.flagsRemaining == 0) {
			let misplacedFlags = flagged.filter(flag => flag.flaggedBy != this.avatar);
			let closestFlag = this.avatar.getClosest(misplacedFlags);
			if (closestFlag.equals(currentCell)) {
				this.setOrPickupFlag();
			} else {
				destination = misplacedFlags;
			}
			
		} else if (this.avatar.todo.length) {
			// if the bot has things in its todo list, goto the closest cell in it and perform something
			let nextTask = this.avatar.getClosest(this.avatar.todo, task => task.cell);
			if (nextTask.cell.equals(currentCell)) {
				switch (nextTask.action) {
					case 'flag':
						//console.log('Flagging cell at x:%d y:%d',nextTask.cell.x,nextTask.cell.y);
						this.setOrPickupFlag();
						break;
					case 'reveal':
						//console.log('Revealing area at x:%d y:%d',nextTask.cell.x,nextTask.cell.y);
						this.revealArea();
						break;
				}
				
				this.avatar.todo.splice(this.avatar.todo.indexOf(nextTask),1);
			} else {
				destination = this.avatar.todo.map(task => task.cell);
			}
			
		} else if (currentCell.visible || currentCell.flagged) {
			// if the bot is idle, update its todo lists
			
			let numberedCells = revealed.filter(cell => cell.visible && cell.value > 0);
			let revealedMines = revealed.filter(cell => cell.visible && cell instanceof Mine)
			for (let nCell of numberedCells) {
				// get the hidden neighbor cells surrounding this number cell
				let hiddenNeighborCells = hidden.filter(cell => cell.near(nCell));
				// get the flagged neighbor cells surrounding this number cell
				let flaggedNeighborCells = flagged.filter(cell => cell.near(nCell));
				// if other players died to mines, then those mines are no longer flaggable, but are visible
				let revealedNeighborMines = revealedMines.filter(cell => cell.near(nCell));
				
				// tally how many possible mines there can be
				let impliedMineCount = hiddenNeighborCells.length + revealedNeighborMines.length;
				let knownMineCount   = flaggedNeighborCells.length + revealedNeighborMines.length;
				let actualMineCount  = nCell.value;
				
				if (impliedMineCount == actualMineCount) {
					// mark all hidden cells as being known mines
					let unmarkedCells = hiddenNeighborCells.filter(cell => !cell.flagged);
					for (let cell of unmarkedCells) {
						this.avatar.todo.push(new Task(cell, 'flag'));
					}
				} else if (knownMineCount == actualMineCount) {
					let unmarkedCells = hiddenNeighborCells.filter(cell => !cell.flagged);
					for (let cell of unmarkedCells) {
						this.avatar.todo.push(new Task(cell, 'reveal'));
					}
				}
			}
		}
		
		if (!destination) {
			// if the bot is not standing on a flagged or visible cell, and has nothing to do, do something stupid
			let closestHiddenCell = this.avatar.getClosest(hidden.filter(cell => !cell.flagged));
			if (closestHiddenCell) {
				if (closestHiddenCell.equals(currentCell)) {
					this.revealArea();
				} else {
					destination = closestHiddenCell;
				}
			}
		}
		
		if (destination) {
			let path = Pathfinder.route(this.avatar, destination, {
				avoid: otherPlayers,
				xmax: this.options.width - 1,
				ymax: this.options.height - 1,
				maxDepth: 100
			});
			
			// use the next step in the path as the next destination (the first index is the current position)
			destination = path && path[1];
			
			if (destination) {
				//console.log('Currently x:%d y:%d going to x:%d y:%d',this.avatar.x,this.avatar.y,destination.x,destination.y);
				let absX = Math.abs(this.avatar.x - destination.x);
				let absY = Math.abs(this.avatar.y - destination.y);
				if (absX > absY) {
					if (this.avatar.x < destination.x) {
						this.avatar.x++;
					} else if (this.avatar.x > destination.x) {
						this.avatar.x--;
					} 
				} else if (absY > 0) {
					if (this.avatar.y < destination.y) {
						this.avatar.y++;
					} else if (this.avatar.y > destination.y) {
						this.avatar.y--;
					}
				}
			}
		}
		
		this.finishMove();
	}
	getCellAt(pos) {
		return this.game[pos.y][pos.x];
	}
	getCellNeighbors(cell) {
		let neighbors = [];
		if (this.game[cell.y][cell.x-1]) {
			neighbors.push(this.game[cell.y][cell.x-1]);
		}
		if (this.game[cell.y][cell.x+1]) {
			neighbors.push(this.game[cell.y][cell.x+1]);
		}
		if (this.game[cell.y-1]) {
			neighbors.push(this.game[cell.y-1][cell.x]);
		}
		if (this.game[cell.y+1]) {
			neighbors.push(this.game[cell.y+1][cell.x]);
		}
		return neighbors;
	}
	revealArea() {
		if (!this.minesPlaced) {
			this.placeMines();
		}
		
		let origin = this.getCellAt(this.avatar);
		if (origin instanceof Mine) {
			if (origin.hidden && !origin.flagged) {
				this.avatar.die(origin);
			}
			return;
		}

		let game = this;
		function reveal(cell) {
			if (!cell || cell.visible || cell.flagged) return;
			cell.show();
			cell.value = game.mines.filter(mine => mine.near(cell)).length;
			if (cell.value == 0) {
				game.getCellNeighbors(cell).forEach(reveal);
			}
		}
		reveal(origin);
	}
	setOrPickupFlag() {
		let cell = this.getCellAt(this.avatar);
		if (cell.flagged) {
			if (this.avatar.unflag(cell)) this.flagsRemaining++;
		} else if (cell.hidden && this.flagsRemaining > 0) {
			if (this.avatar.flag(cell)) this.flagsRemaining--;
		}
	}
	revealMines() {
		this.mines.forEach(mine => mine.show());
	}
	checkWinCondition() {
		if (this.inactivePlayers.length == this.players.length) {
			this.revealMines();
			return 'nobody';
		} else {
			return (this.minesRemaining == 0) ? this.player : null;
		}
	}
	get status() {
		if (this.winner == 'nobody') {
			return {
				name: 'Failed',
				value: `${this.players.map(p => p.username).join(', ')} couldn't clear all the mines...`
			};
		} else if (this.winner) {
			return {
				name: 'Game Complete',
				value: `${this.players.map(p => p.username).join(', ')} cleared all ${this.minesPlaced} mines in ${this.turns} turns!`
			};
		} else {
			return {
				name: `Turn ${this.turns}`,
				value: `${this.player.username}'s turn. (Flags: ${this.flagsRemaining}/${this.minesPlaced})`
			};
		}
	}
	get color() {
		if (this.winner) {
			if (this.winner == 'nobody') {
				return 0xFF0000;
			} else {
				return 0x00FF00;
			}
		} else {
			return 0;
		}
	}
	toString() {
		let {width,height} = this.options;
		let grid = [];
		
		// fill in the grid emojis
		this.game.forEach((row,y) => {
			grid.push(row.map(e => e.toString()));
		});
		
		// add the avatars
		this.avatars.forEach(avatar => {
			if (avatar.alive) {
				grid[avatar.y][avatar.x] = avatar.state;
			}
		});
		
		// serialize the grid
		return grid.map(row => row.join('')).join('\n');
	}
	updateEmbed() {
		super.updateEmbed();
		// hide all players when the game is won
		if (!this.winner || this.winner == 'nobody') {
			let avatarFields = this.avatars.map(avatar => {
				let name = avatar.displayName;
				let value = `Score: ${avatar.score} | On: ${this.getCellAt(avatar).toString()}`;
				return { name, value, inline: true };
			});
			this.embed.fields = avatarFields.concat(this.embed.fields);
		}
		return this.embed;
	}
}

// Game configuration
Minesweeper.CONFIG = {
	gameType: MessageGame.COOPERATIVE,
	howToPlay: 'Reveal areas of the map and defuse all the hidden mines.\nNumber squares indicate how many mines are adjacent to it.\nUse the Flag emoji while over a mine to defuse it.',
	canRestart: true,
	shufflePlayers: true,
	showSpectators: true,
	interface: [MOVE_LEFT,MOVE_UP,MOVE_DOWN,MOVE_RIGHT,ACTION,FLAG],
	tokens: ['','🐉','😎','🤠','👽']
};

module.exports = Minesweeper;
