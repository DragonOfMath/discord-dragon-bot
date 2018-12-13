const MessageGame = require('../../../Sessions/MessageGame');

const BOWL = '🎳';

const STRIKE = 'X';
const SPARE = '/';

const MAX_PINS = 10;
const MAX_ROUNDS = 10;

const TABLE = [
	[5,5,5,5,10,10,15,20,25,25,20],
	[10,15,35,25,35,35,25,25,20,20]
];

class Scoreboard {
	constructor(players) {
		for (let player of players) {
			this[player.id] = []
		}
	}
	initRound(last = false) {
		for (let id in this) {
			this[id].push([]);
		}
	}
	getScore(player) {
		player = player.id || player;
		let score = 0;
		for (let round of this[player]) {
			
		}
		return score;
	}
}

class Bowling extends MessageGame {
	constructor(context, players = []) {
		super(context, players);
	}
	init() {
		super.init();
		this.game = new Scoreboard(this.players);
		this.round = 0;
		this.pins = MAX_PINS;
	}
	startMove() {
		
	}
	handlePlayerMove(reaction) {
		if (reaction == BOWL) {
			this.bowl();
			return true;
		}
	}
	handleBotMove() {
		this.bowl();
	}
	bowl() {
		let playerScore = this.game[this.player.id];
		if (playerScore[this.round])
		this.finishMove();
	}
}

Bowling.CONFIG = {
	gameType: MessageGame.COMPETITIVE,
	displayName: '🎳 Bowling',
	howToPlay: 'Try to knock down all the pins each round.\nMore strikes = more points. Score the highest to win.',
	minPlayers: 2,
	maxPlayers: 4,
	minBotPlayers: 0,
	maxBotPlayers: 4,
	maxTurns: Infinity,
	canRestart: true,
	interface: [BOWL]
};

module.exports = Bowling;
