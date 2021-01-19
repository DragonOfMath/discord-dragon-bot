const MessageGame = require('./MessageGame');
const LiveMessage = require('./LiveMessage');

/**
 * MultiMessageGame class
 * @class
 * An interface for multiple linked live messages.
 * Used for games such as UNO, Poker, Chess, trading, and so on.
 */
class MultiMessageGame extends MessageGame {
	constructor(context, players, options) {
		super(context, players, options);
		for (let player of this.players) {
			if (player.bot) continue;
			player.liveMessage = new LiveMessage(player.id);
		}
	}
	async startGame(client) {
		let playerInterface = this.constructor.CONFIG.player.interface || [];
		for (let player of this.players) {
			if (player.liveMessage) {
				await player.liveMessage.setupReactionInterface(client, playerInterface);
			}
		}
		return super.startGame(client);
	}
	updateEmbed() {
		for (let player of this.players) {
			if (player.liveMessage) {
				player.liveMessage.updateEmbed(this);
			}
		}
		return this.embed;
	}
}

MultiMessageGame.CONFIG = {
	interface: [],
	player: {
		interface: []
	}
};

module.exports = MultiMessageGame;
