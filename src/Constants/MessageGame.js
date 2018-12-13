const CASUAL      = '🙂';
const COOPERATIVE = '🤝';
const COMPETITIVE = '⚔';

module.exports = {
	UPDATE_SPEED: 2500,
	TYPES: {
		CASUAL,      // game is singleplayer (or automated)
		COOPERATIVE, // game is multiplayer, players work together
		COMPETITIVE  // game is multiplayer, players compete against each other
	},
	CONFIG: {
		displayName: '',       // the string to display as the game's title
		howToPlay: '',         // short instructions on how to play
		gameType: CASUAL,      // the game type, either casual, co-op, or competitive
		minPlayers: 1,         // the minimum players required to play this game
		maxPlayers: 2,         // the maximum players that can be picked to play this game
		minBotPlayers: 0,      // the minimum number of in-game bots
		maxBotPlayers: 2,      // the maximum number of in-game bots
		maxTurns: 1000,        // the maximum number of player turns that can occur before the game is forcibly ended due to length
		timeLimit: 30,         // the time each player has to make a move during their turn, else they are automatically forfeited; -1 for no limit
		canRestart: false,     // whether the game can be re-initialized and played again
		shufflePlayers: false, // whether to randomize the order of players before play
		showSpectators: false, // whether to list the players spectating, either from penalty or in-game death
		interface: [],         // the reaction interface for the message
		tokens: null           // the optional tokens for representing players
	},
	PRESETS: {
		[CASUAL]: {
			minPlayers: 1,
			maxPlayers: 1,
			minBotPlayers: 0,
			maxBotPlayers: 1,
			maxTurns: Infinity,
			timeLimit: -1,
			canRestart: true,
			shufflePlayers: false,
			showSpectators: false
		},
		[COOPERATIVE]: {
			minPlayers: 1,
			maxPlayers: 4,
			minBotPlayers: 0,
			maxBotPlayers: 4,
			maxTurns: 1000,
			timeLimit: 60,
			canRestart: true,
			shufflePlayers: true,
			showSpectators: true
		},
		[COMPETITIVE]: {
			minPlayers: 1,
			maxPlayers: 4,
			minBotPlayers: 0,
			maxBotPlayers: 4,
			maxTurns: 1000,
			timeLimit: 30,
			canRestart: true,
			shufflePlayers: true,
			showSpectators: false
		}
	},
	COLORS: {
		WIN: 0x00FF00,
		LOSE: 0xFF0000,
		DRAW: 0x0000FF,
		TIE: 0xFFFFFF
	}
};
