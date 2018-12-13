const Constants   = require('../../Constants/Pokemon');
const Session     = require('../../Sessions/Session');
const MessageGame = require('../../Sessions/MessageGame');

const Pokemon   = require('./Pokemon');
const PokeError = require('./PokeError');

const ATTACK   = '⚔';
const BLOCK    = '🛡';
const SPECIAL  = '🔥';
const USE_ITEM = '💊';
const RETREAT  = '💨';
const OPTIONS = [ATTACK,BLOCK,SPECIAL,USE_ITEM,RETREAT];

const MOVE_UP    = '⬆';
const MOVE_DOWN  = '⬇';
const SELECT     = '🆗';
const CANCEL     = '🔙';
const NAVIGATION = [MOVE_UP,MOVE_DOWN,SELECT,CANCEL];

class PokemonBattle extends MessageGame {
	constructor(context, trainer, opponent) {
		super(context, [context.user]);
		this.trainers = this.players.map(p => {
			
		});
	}
	get trainer() {
		
	}
	get pokemon() {
		return this.trainer.activePokemon;
	}
	get opponentTrainer() {
		
	}
	get opponentPokemon() {
		return this.opponentTrainer.activePokemon;
	}
	toString() {
		
	}
	updateEmbed() {
		super.updateEmbed();
		
		this.embed.image = {url: this.pokemon.sprite};
		this.embed.thumbnail = {url: this.opponentPokemon.sprite};
		
		return this.embed;
	}
}

PokemonBattle.CONFIG = {
	gameType: MessageGame.COMPETITIVE,
	displayName: Constants.HEADER + ' Battle',
	howToPlay: 'Strategize and select options that give you the advantage.\nWin and your pokemon gains XP!'
	minPlayers: 2,
	maxPlayers: 2,
	minBotPlayers: 0,
	maxBotPlayers: 2,
	canRestart: false,
	showSpectators: false,
	interface: [...OPTIONS,...NAVIGATION]
};

module.exports = PokemonBattle;
