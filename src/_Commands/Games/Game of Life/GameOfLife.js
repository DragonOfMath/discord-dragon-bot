const MessageGame = require('../../../Sessions/MessageGame');
const {Array,random} = require('../../../Utils');

const PLAY_PAUSE = '⏯';
const FAST_FORWARD = '⏩';
const STEP_FORWARD = '⏭';

const ON = '⬛';
const OFF = '⬜';
function toEmoji(x) {
    return x ? ON : OFF;
}

class GameOfLife extends MessageGame {
    constructor(context, options = {}) {
        super(context, [context.user], options);
        this.init();
    }
    init() {
		super.init();
		this.game = new Array(this.options.height).fill(0).map(() =>
						new Array(this.options.width).fill(0).map(() =>
							random(true)));
        this.generation = 0;
		this.speed = 0;
		this.updateEmbed();
    }
	startMove(client) {
		setTimeout(() => {
			if (!this.speed) return;
			this.handleBotMove(this.speed);
			this.finishMove();
            this.edit(client);
		}, 2000);
	}
	handlePlayerMove(reaction) {
		 switch (reaction) {
			case PLAY_PAUSE:
				this.speed = this.speed ? 0 : 1;
				break;
			case FAST_FORWARD:
				this.speed = Math.min(this.speed + 2, 5);
				break;
			case STEP_FORWARD:
				this.speed = 0;
				this.handleBotMove(1);
				break;
		}
		this.finishMove();
		return true;
	}
	handleBotMove(steps) {
		let width = this.options.width;
        let height = this.options.height;
		for (let g = 0; g < steps; g++) {
			this.game = this.game.map((row,r) => row.map((col,c) => {
				let neighbors = 0;
				for (let nr = r - 1; nr <= r + 1; nr++) {
					for (let nc = c - 1; nc <= c + 1; nc++) {
						if (nr == r && nc == c) continue;
						if (this.options.wrap && this.game[(nr+width)%width][(nc+height)%height]) neighbors++;
						else if (this.game[nr] && this.game[nr][nc]) neighbors++;
					}
				}
				return col ?
					this.options.survive.includes(neighbors) :
					this.options.birth.includes(neighbors);
			}));
			this.generation++;
		}
	}
	checkWinCondition() {
		return null;
	}
	get status() {
		return null;
	}
	get color() {
		return 0;
	}
	toString() {
		return this.game.map(row => row.map(toEmoji).join('')).join('\n');
	}
    updateEmbed() {
		super.updateEmbed();
        this.embed.footer = {
            text: `${this.options.width}x${this.options.height} | Generation ${this.generation} (B${this.options.birth.join('')}/S${this.options.survive.join('')}) | ${this.speed?this.speed+'x Speed':'Paused'}`
        };
		return this.embed;
    }
}

GameOfLife.CONFIG = {
	gameType: MessageGame.CASUAL,
	displayName: 'Conway\'s Game of Life',
	howToPlay: 'Just watch the mindless automata live and die according to simple logic.',
	interface: [PLAY_PAUSE,FAST_FORWARD,STEP_FORWARD]
};

module.exports = GameOfLife;
