const Maze = require('./Maze');
const MessageGame = require('../../../Sessions/MessageGame');
const {Jimp,Pathfinder,Pointer2D} = require('../../../Utils');

const MOVE_UP = '⬆';
const MOVE_DOWN = '⬇';
const MOVE_RIGHT = '➡';
const MOVE_LEFT = '⬅';
const HINT = '🆓';
const SOLVE = '✅';
const DOWNLOAD = '💾';

class MazeGame extends MessageGame {
	constructor(context, options = {}) {
		if (typeof(options.width) === 'undefined') {
			options.width = 50;
		}
		if (typeof(options.height) === 'undefined') {
			options.height = 50;
		}
		super(context, [], options);
		this.init();
	}
	init() {
		super.init();
		this.embed.footer = {
			text: `${MOVE_LEFT}/${MOVE_RIGHT}/${MOVE_UP}/${MOVE_DOWN} = Move\n${HINT} = Hint\n${SOLVE} = Auto-Solve\n${DOWNLOAD} = Download`
		};
		
		// create the maze bitmap
		this.game = Maze.generate(this.options.width, this.options.height);
		
		// resync the width/height
		this.options.width = this.game.bitmap.width;
		this.options.height = this.game.bitmap.height;
		
		// assign the start and finish
		let exits = Maze.getExits(this.game);
		if (exits[0].x == 0 || exits[0].y == 0) {
			this.entrance = exits[0];
			this.exit     = exits[1];
		} else {
			this.entrance = exits[1];
			this.exit     = exits[0];
		}
		
		// set the player's avatar to the start
		this.avatar = new Pointer2D(this.entrance);
		
		this.updateEmbed();
	}
	handlePlayerMove(reaction, client) {
		switch (reaction) {
			case MOVE_LEFT:
				this.avatar.dir = Pointer2D.DIRS.LEFT;
				break;
			case MOVE_RIGHT:
				this.avatar.dir = Pointer2D.DIRS.RIGHT;
				break;
			case MOVE_UP:
				this.avatar.dir = Pointer2D.DIRS.UP;
				break;
			case MOVE_DOWN:
				this.avatar.dir = Pointer2D.DIRS.DOWN;
				break;
			case SOLVE:
				this.player.auto = true
			case HINT:
				this.handleBotMove();
				return true;
			case DOWNLOAD:
				return void this.game.getBufferAsync(Jimp.MIME_PNG).then(file => {
					console.log('Sending maze for player ' + this.player.id);
					client.upload(this.player.id, file, 'maze.png', 'Here is the full view of the maze (you may need to view in a photo viewer and zoom in):');
				}).catch(e => {
					client.error(e);
				});
		}
		let next = this.avatar.next();
		if (Maze.isPassage(this.game, next)) {
			this.avatar.forward();
			this.finishMove();
			return true;
		}
	}
	handleBotMove() {
		let that = this;
		let path = Pathfinder.route(this.avatar, this.exit, {
			map(cell) {
				return Maze.isPassage(that.game, cell);
			},
			xmax: this.options.width - 1,
			ymax: this.options.height - 1
		});
		if (path) {
			//console.log(path);
			this.avatar.goto(path[1]);
			this.finishMove();
		} else {
			console.error('Path not found?', this.avatar, this.exit);
		}
	}
	checkWinCondition() {
		return this.avatar.equals(this.exit) ? this.player : null;
	}
	get status() {
		if (this.winner) {
			return {
				name: 'Game Complete',
				value: `${this.winner.username} solved the maze!`
			};
		} else {
			return null;
		}
	}
	toString() {
		let width  = Math.min(13, this.options.width);
		let height = Math.min(13, this.options.height);
		let startx = Math.max(0, Math.min(this.avatar.x - Math.floor(width / 2), this.options.width - width));
		let starty = Math.max(0, Math.min(this.avatar.y - Math.floor(height / 2), this.options.height - height));
		let endx = startx + width;
		let endy = starty + height;
		
		let viewport = [];
		for (let y = starty; y < endy; y++) {
			let row = [];
			for (let x = startx; x < endx; x++) {
				if (Maze.isPassage(this.game, {x,y})) {
					row.push('⬜');
				} else {
					row.push('⬛');
				}
			}
			viewport.push(row);
		}
		
		// add the goal
		if (this.exit.x >= startx && this.exit.x < endx && this.exit.y >= starty && this.exit.y < endy) {
			viewport[this.exit.y-starty][this.exit.x-startx] = '🏁';
		}
		
		// add the player's avatar
		viewport[this.avatar.y-starty][this.avatar.x-startx] = this.player.avatar;
		
		// serialize the viewport
		return viewport.map(row => row.join('')).join('\n');
	}
	updateEmbed() {
		super.updateEmbed();
		this.embed.fields.unshift({
			name: 'Exit',
			value: `X:${this.exit.x} Y:${this.exit.y}`,
			inline: true
		});
		this.embed.fields.unshift({
			name: this.player.username,
			value: `X:${this.avatar.x} Y:${this.avatar.y}`,
			inline: true
		});
		return this.embed;
	}
}

MazeGame.CONFIG = {
	gameType: MessageGame.CASUAL,
	displayName: 'Maze Runner',
	howToPlay: 'Help Draggy reach the exit!',
	interface: [MOVE_LEFT,MOVE_UP,MOVE_DOWN,MOVE_RIGHT,HINT,SOLVE,DOWNLOAD],
	tokens: ['','🐉']
};

module.exports = MazeGame;
