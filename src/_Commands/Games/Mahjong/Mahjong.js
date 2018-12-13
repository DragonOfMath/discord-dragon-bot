const MessageGame = require('../../../Sessions/MessageGame');

// Assets from Wikipedia
const IMAGES = {
	DOTS: [
		'https://upload.wikimedia.org/wikipedia/commons/4/4a/MJt1.png',
		'https://upload.wikimedia.org/wikipedia/commons/6/61/MJt2.png',
		'https://upload.wikimedia.org/wikipedia/commons/a/a4/MJt3.png',
		'https://upload.wikimedia.org/wikipedia/commons/7/72/MJt4.png',
		'https://upload.wikimedia.org/wikipedia/commons/5/5c/MJt5.png',
		'https://upload.wikimedia.org/wikipedia/commons/7/72/MJt6.png',
		'https://upload.wikimedia.org/wikipedia/commons/6/6f/MJt7.png',
		'https://upload.wikimedia.org/wikipedia/commons/1/18/MJt8.png',
		'https://upload.wikimedia.org/wikipedia/commons/a/a1/MJt9.png'
	],
	BAMBOO: [
		'https://upload.wikimedia.org/wikipedia/commons/3/37/MJs1.png',
		'https://upload.wikimedia.org/wikipedia/commons/5/5e/MJs2.png',
		'https://upload.wikimedia.org/wikipedia/commons/a/a7/MJs3.png',
		'https://upload.wikimedia.org/wikipedia/commons/d/df/MJs4.png',
		'https://upload.wikimedia.org/wikipedia/commons/b/bf/MJs5.png',
		'https://upload.wikimedia.org/wikipedia/commons/c/cb/MJs6.png',
		'https://upload.wikimedia.org/wikipedia/commons/e/ea/MJs7.png',
		'https://upload.wikimedia.org/wikipedia/commons/9/99/MJs8.png',
		'https://upload.wikimedia.org/wikipedia/commons/8/80/MJs9.png'
	],
	CHARACTERS: [
		'https://upload.wikimedia.org/wikipedia/commons/1/1c/MJw1.png',
		'https://upload.wikimedia.org/wikipedia/commons/c/c3/MJw2.png',
		'https://upload.wikimedia.org/wikipedia/commons/9/9e/MJw3.png',
		'https://upload.wikimedia.org/wikipedia/commons/e/e8/MJw4.png',
		'https://upload.wikimedia.org/wikipedia/commons/e/ed/MJw5.png',
		'https://upload.wikimedia.org/wikipedia/commons/5/58/MJw6.png',
		'https://upload.wikimedia.org/wikipedia/commons/8/8b/MJw7.png',
		'https://upload.wikimedia.org/wikipedia/commons/e/e1/MJw8.png',
		'https://upload.wikimedia.org/wikipedia/commons/f/f3/MJw9.png'
	],
	WINDS: {
		EAST: 'https://upload.wikimedia.org/wikipedia/commons/7/74/MJf1.png',
		SOUTH: 'https://upload.wikimedia.org/wikipedia/commons/0/08/MJf2.png',
		WEST: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/MJf3.png',
		NORTH: 'https://upload.wikimedia.org/wikipedia/commons/9/96/MJf4.png'
	},
	DRAGONS: {
		RED: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/MJd1.png',
		GREEN: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/MJd2.png',
		WHITE: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/MJd3.png'
	},
	FLOWERS: {
		PLUM: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/MJh5.png',
		ORCHID: 'https://upload.wikimedia.org/wikipedia/commons/0/02/MJh6.png',
		CHRYSANTHEMUM: 'https://upload.wikimedia.org/wikipedia/commons/6/66/MJh7.png',
		BAMBOO: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/MJh8.png'
	},
	SEASONS: {
		SPRING: 'https://upload.wikimedia.org/wikipedia/commons/8/86/MJh1.png',
		SUMMER: 'https://upload.wikimedia.org/wikipedia/commons/6/68/MJh2.png',
		AUTUMN: 'https://upload.wikimedia.org/wikipedia/commons/7/76/MJh3.png',
		WINTER: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/MJh4.png'
	}
};

class MahjongTile {
	
}

class MahjongPile {
	
}

class MahjongTable extends MahjongPile {
	
}

class MahjongHand extends MahjongPile {
	
}

class MahjongHandDisplay extends LiveMessage {
	
}

class Mahjong extends MessageGame {
	
}

Mahjong.CONFIG = {
	displayName: 'Mahjong',
	howToPlay: 'https://en.wikipedia.org/wiki/Mahjong',
	shufflePlayers: true,
	canRestart: true,
	minPlayers: 4,
	maxPlayers: 4,
	minBotPlayers: 0,
	maxBotPlayers: 4,
	maxTurns: 64
};

module.exports = Mahjong;
