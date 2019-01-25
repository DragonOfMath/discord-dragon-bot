const MessageGame = require('../../../Sessions/MessageGame');
const {Markdown:md,random,Pointer2D} = require('../../../Utils');

// navigation
const MOVE_RIGHT = '➡';
const MOVE_LEFT  = '⬅';
const MOVE_UP    = '⬆';
const MOVE_DOWN  = '⬇';

const HIT   = '💥';
const MISS  = '❌';
const SPACE = '⬛';
const SHIP  = '🚢';
const CURSOR = '⬜';

const WIDTH  = 10;
const HEIGHT = 10;

const SHIPS = {
	'Carrier': 5,
	'Battleship': 4,
	'Cruiser': 3,
	'Submarine': 3,
	'Destroyer': 2
};

class BSCell {
	constructor() {
		this.ship   = null;
		this.hit    = false;
		this.hidden = false;
	}
	toString() {
		return this.hit ? (this.ship ? HIT : MISS) : (this.ship && !this.hidden ? SHIP : SPACE);
	}
}
class BSShip {
	constructor(name) {
		this.name = name;
		this.cells = [];
	}
	get size() {
		return this.cells.length;
	}
	get remaining() {
		return this.cells.reduce((r,c) => c.hit ? r : r+1, 0);
	}
	get destroyed() {
		return this.cells.every(cell => cell.hit);
	}
	addCell(cell) {
		if (!cell.ship && !this.cells.includes(cell)) {
			this.cells.push(cell);
			cell.ship = this;
		}
	}
	toString() {
		return this.destroyed ? md.strikethrough(this.name) : `${this.name} (${this.remaining}/${this.size})`;
	}
}
class BSGrid {
	constructor(player) {
		this.player = player;
		this.grid   = new Array(WIDTH * HEIGHT).fill(0).map(() => new BSCell());
		this.ships  = [];
		for (let name in SHIPS) {
			this.placeShip(new BSShip(name), SHIPS[name]);
		}
	}
	show() {
		this.grid.forEach(c => c.hidden = false);
	}
	hide() {
		this.grid.forEach(c => c.hidden = true);
	}
	get(point) {
		if (point.OOB(WIDTH,HEIGHT)) return null;
		return this.grid[point.y * WIDTH + point.x];
	}
	getShip(point) {
		let ship = [];
		let root = this.get(point);
		return root && root.ship;
	}
	placeShip(ship, size) {
		let ptr = new Pointer2D();
		let attempts = 100;
		
		findValidPlacement:
		do {
			ptr.x = random(WIDTH);
			ptr.y = random(HEIGHT);
			ptr.random();
			for (let i = 0; i < size; i++) {
				let pnt = ptr.next(i);
				if (pnt.OOB(WIDTH,HEIGHT)
				|| this.get(pnt).ship)
					continue findValidPlacement;
			}
			for (let i = 0; i < size; i++) {
				ship.addCell(this.get(ptr.next(i)));
			}
			return this.ships.push(ship);
		} while (attempts--);
		
		throw 'Failed to place ' + ship.toString();
	}
	toString(cursor) {
		let str = '';
		for (let r = 0; r < HEIGHT; r++) {
			for (let c = 0; c < WIDTH; c++) {
				if (cursor && c == cursor.x && r == cursor.y) {
					str += CURSOR;
				} else {
					str += this.grid[r * WIDTH + c].toString();
				}
			}
			str += '\n';
		}
		return str;
	}
}

class Battleship extends MessageGame {
	constructor(context, players) {
		if (!(players instanceof Array)) {
			players = [players];
		} else if (players.length == 1) {
			players.push(context.client);
		}
		super(context, players);
		this.init();
	}
	get nextPlayerIdx() {
		return (this.playerIdx + 1) % 2;
	}
	get nextPlayer() {
		return this.players[this.nextPlayerIdx];
	}
	init() {
		super.init();
		this.cursor = new Pointer2D(0,0);
		this.game = this.players.map(p => new BSGrid(p));
		this.game[0].show();
		if (this.players[0].bot) {
			this.game[1].show();
		} else {
			this.game[1].hide();
		}
		this.log = [];
		this.updateEmbed();
	}
	handlePlayerMove(reaction, context) {
		switch (reaction) {
			case HIT:
				return this.makeMove(this.cursor);
			case MOVE_RIGHT:
				this.cursor.right();
				break;
			case MOVE_LEFT:
				this.cursor.left();
				break;
			case MOVE_UP:
				this.cursor.up();
				break;
			case MOVE_DOWN:
				this.cursor.down();
				break;
		}
		let next = this.cursor.next();
		if (!next.OOB(WIDTH,HEIGHT)) {
			this.cursor = next;
			this.updateEmbed();
			return true;
		}
	}
	handleBotMove(client) {
		let enemy = this.game[this.nextPlayerIdx];
		
		let hits    = [];
		let misses  = [];
		let unknown = [];
		let targets = [];
		
		// categorize the cells
		for (let r = 0; r < HEIGHT; r++) {
			for (let c = 0; c < WIDTH; c++) {
				let pnt = new Pointer2D(c,r);
				let cell = enemy.get(pnt);
				
				if (cell.ship && cell.ship.destroyed) {
					misses.push(pnt); // ignore cells of destroyed ships
				} else if (cell.hit) {
					if (cell.ship) hits.push(pnt);
					else misses.push(pnt);
				} else {
					unknown.push(pnt);
				}
			}
		}
		
		// find crippled ships based on orientation
		for (let pnt of hits) {
			// get the (predicted) orientation of a ship
			let orientation = 0;
			let hasOrientation = false;
			for (let d = 0; d < 4; d++) {
				orientation = pnt.dir;
				let next = pnt.next();
				pnt.clockwise();
				if (next.OOB(WIDTH,HEIGHT)) continue;
				if (hits.find(pnt2 => pnt2.equals(next))) {
					hasOrientation = true;
					break;
				}
			}
			
			if (hasOrientation) {
				// populate the targets array with points along oriented hits
				pnt.dir = orientation;
				for (let i = 1, reflections = 0;;i++) {
					let next = pnt.next(i);
					if (next.OOB(WIDTH,HEIGHT) || misses.find(pnt2 => pnt2.equals(next))) {
						// reached a dead end, so scan the other way
						pnt.reflect();
						i = 0;
						if (++reflections == 2) {
							// if both ends are misses, then the orientation is not at all what was predicted
							hasOrientation = false;
							break;
						}
					} else if (next = unknown.find(pnt2 => pnt2.equals(next))) {
						if (!targets.includes(next)) {
							targets.push(next);
						}
						break;
					}
				}
			}
			if (!hasOrientation) for (let d = 0; d < 4; d++) {
				let next = pnt.next();
				pnt.clockwise();
				if (next.OOB(WIDTH,HEIGHT)) continue;
				if (next = unknown.find(pnt2 => pnt2.equals(next))) {
					if (!targets.includes(next)) {
						targets.push(next);
					}
				}
			}
		}
		
		// if no targets found, select a random unknown cell
		if (!targets.length) targets = unknown;
		
		return this.makeMove(random(targets));
	}
	makeMove(point) {
		if (!point || point.OOB(WIDTH,HEIGHT)) return false; // point is out of bounds
		
		// the move affects the other player's grid
		let cell = this.game[this.nextPlayerIdx].get(point);
		if (cell.hit) return false; // cell was already hit
		cell.hit = true;
		if (cell.ship) {
			if (cell.ship.destroyed) {
				this.log.push(`${this.player} ${HIT} (${point.x},${point.y}) and sunk the ${cell.ship.name}!`);
			} else {
				this.log.push(`${this.player} ${HIT} (${point.x},${point.y})`);
			}
		} else {
			this.log.push(`${this.player} ${MISS} (${point.x},${point.y})`);
		}
		
		this.finishMove();
		return true;
	}
	checkWinCondition() {
		for (let grid of this.game) {
			if (grid.ships.every(ship => ship.destroyed)) {
				this.game.forEach(g => g.show());
				return this.game.find(g => g != grid).player;
			}
		}
	}
	toString() {
		// show the last 3 actions
		return this.log.slice(Math.max(0,this.log.length-5)).join('\n');
	}
	updateEmbed() {
		super.updateEmbed();
		
		this.embed.fields = [
			{
				name: 'Enemy Grid',
				value: this.game[1].toString(!this.winner && !this.player.bot && this.cursor),
				inline: true
			},
			{
				name: 'Enemy Ships',
				value: this.game[1].ships.map(s => s.toString()).join('\n'),
				inline: true
			},
			{name:'\u200B',value:'\u200B'},
			{
				name: 'My Grid',
				value: this.game[0].toString(),
				inline: true
			},
			{
				name: 'My Ships',
				value: this.game[0].ships.map(s => s.toString()).join('\n'),
				inline: true
			},
			{name:'\u200B',value:'\u200B'}
		
		].concat(this.embed.fields);
		
		return this.embed;
	}
}

Battleship.CONFIG = {
	gameType: MessageGame.COMPETITIVE, // multiplayer not supported yet
	displayName: 'Battleship',
	howToPlay: 'Aim your cursor along the grid and take down all the enemy ships before they take down yours!',
	minPlayers: 2,
	maxPlayers: 2,
	minBotPlayers: 1,
	maxBotPlayers: 2,
	maxTurns: 2 * WIDTH * HEIGHT,
	canRestart: true,
	shufflePlayers: false,
	showSpectators: false,
	interface: [MOVE_LEFT,MOVE_UP,HIT,MOVE_DOWN,MOVE_RIGHT]
};

module.exports = Battleship;
