const MessageGame = require('../../../Sessions/MessageGame');
const {random} = require('../../../Utils');

/**
 * Rules of Bingo:
 * 1) Each player has a 5x5 board randomly generated from 100 emojis. The center is always a free space.
 * 2) The game proceeds by selecting a random unused emoji, then boards are marked where the emoji matches it.
 * 3) When a board has 5 selected emojis in a row, column, or diagonal, that player has a bingo!
 * 4) A player(s) will always have a bingo after all emojis have been used.
 */
 
const EMOJI = [
	'😂','😎','😍','😱','🤠','😭','🙂','🙃','😜','😉',
	'👌','👀','👁','👅','👂','👃','👈','👉','👆','👇',
	'🐵','🐶','🐱','🦊','🐸','🐻','🐼','🐴','🦄','🐲',
	'🍕','🍔','🍟','🌭','🍞','🍗','🎂','🍪','🍝','🍦',
	'🍇','🍈','🍉','🍌','🍎','🍑','🍒','🍆','🥒','🥔',
	'🎈','✨','🎀','👑','💎','💰','💸','💳','⌚','🗿',
	'⚽','⚾','🏀','🏈','🎱','🏐','🎳','🏓','🎣','🏆',
	'🎮','🕹','🎲','🎴','🃏','🀄','♠','♣','♥','♦',
	'🎵','🎼','🎤','🎧','🔔','🥁','🎷','🎸','🎹','🎺',
	'❤','💛','💙','💚','💜','🖤','💕','💞','💓','❣'
];
const BINGO = ['🇧','🇮','🇳','🇬','🇴'];
const FREE = '🆓';
const MARK = '✅';

const CHECKING_TABLE = [
	[0,1,2,3,4],
	[5,6,7,8,9],
	[10,11,12,13,14],
	[15,16,17,18,19],
	[20,21,22,23,24],
	[0,5,10,15,20],
	[1,6,11,16,21],
	[2,7,12,17,22],
	[3,8,13,18,23],
	[4,9,14,19,24],
	[0,6,12,18,24],
	[20,16,12,8,4]
];

class BingoBoard {
	constructor(player) {
		this.player = player;
		this.board = new Array(25);
		for (let i = 0, e; i < this.board.length;) {
			e = random(EMOJI);
			if (!this.board.includes(e)) {
				this.board[i++] = e;
			}
		}
		this.board[12] = FREE;
	}
	check(emojis = []) {
		return CHECKING_TABLE.some(row => row.every(index => this.board[index] == FREE || emojis.includes(this.board[index])));
	}
	toString(emojis) {
		let str = '';
		for (let y = 0, e; y < 5; y++) {
			for (let x = 0; x < 5; x++) {
				e = this.board[y*5+x];
				str += emojis.includes(e) ? MARK : e;
			}
			str += '\n';
		}
		return str;
	}
}

class Bingo extends MessageGame {
	constructor(context, players, options) {
		super(context, players, options);
		// boards do not change between re-initializations
		this.boards = this.players.map(p => new BingoBoard(p));
		this.init();
	}
	init() {
		super.init();
		this.game = []; // emojis selected
		//this.game.push(FREE);
		this.updateEmbed();
	}
	startMove(client) {
		if (!this.winner) {
			setTimeout(() => {
				if (this.closed) return;
				
				// select a new emoji
				let selectedEmoji;
				do {
					selectedEmoji = random(EMOJI);
				} while (this.game.includes(selectedEmoji));
				this.game.push(selectedEmoji);
				
				// players finish simultaneously
				this.finishMove();
				this.edit(client);
			}, 3000); // maximum game length = 5 minutes
		}
	}
	checkWinCondition() {
		let winners = [];
		for (let board of this.boards) {
			if (board.check(this.game)) {
				winners.push(board.player);
			}
		}
		return winners.length ? winners : null;
	}
	get status() {
		// there is never no winner at bingo
		if (this.winner) {
			return {
				name: 'Winner!',
				value: (this.winner instanceof Array ? this.winner.map(p => p.username).join(', ') : this.winner.username) + ' got a Bingo!'
			};
		}
	}
	toString() {
		return 'Emojis: ' + this.game.join();
	}
	updateEmbed() {
		super.updateEmbed();
		
		for (let board of this.boards) {
			this.embed.fields.push({
				name: board.player.username,
				value: board.toString(this.game),
				inline: true
			});
		}
		
		return this.embed;
	}
}

Bingo.CONFIG = {
	gameType: MessageGame.COMPETITIVE,
	displayName: 'Emoji Bingo',
	howToPlay: 'Random emojis are selected until a player\'s board has 5 of them in a row (This requires no user input.)',
	minPlayers: 1,
	maxPlayers: 6,
	minBotPlayers: 0,
	maxBotPlayers: 6,
	shufflePlayers: false,
	showSpectators: false,
	canRestart: true,
	interface: []
};

module.exports = Bingo;
