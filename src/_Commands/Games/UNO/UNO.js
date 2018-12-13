const LiveMessage = require('../../../Sessions/LiveMessage');
const MessageGame = require('../../../Sessions/MessageGame');
const {Array,Markdown:md} = require('../../../Utils');

const RED    = '❤';
const GREEN  = '💚';
const BLUE   = '💙';
const YELLOW = '💛';

const NUMBERS  = [`0⃣`,`1⃣`,`2⃣`,`3⃣`,`4⃣`,`5⃣`,`6⃣`,`7⃣`,`8⃣`,`9⃣`];
const SKIP     = '🚫';
const REVERSE  = '🔃';
const PLUS2    = '+2';
const PLUS4    = '+4';
const WILDCARD = '🃏';

const COLOR = [RED,GREEN,BLUE,YELLOW];
const VALUE = [...NUMBERS,SKIP,REVERSE,PLUS2,PLUS4,WILDCARD];
const COUNT = VALUE.reduce((o,x) => {
	switch (x) {
		case 0:
		case PLUS4:
		case WILDCARD:
			o[x] = 1;
			break;
		default:
			o[x] = 2;
			break;
	}
	return o;
}, {});

class UnoCard {
	constructor(value, color) {
		this.value = value;
		this.color = (value == 13 || value == 14) ? WILDCARD : color;
	}
	get image() {
		
	}
	get isSpecial() {
		return this.value > 9;
	}
	toString() {
		return COLOR[this.color] + VALUE[this.value];
	}
}

class UnoPile {
	constructor(cards = []) {
		this.cards = cards;
	}
	toString() {
		return this.cards.map(card => card.toString()).join();
	}
}

class UnoDeck extends UnoPile {
	constructor() {
		this.cards = [];
		for (let value in VALUE) {
			for (let color in COLOR) {
				for (let c = 0; c < COUNT[VALUE[value]]; c++) {
					this.cards.push(new UnoCard(value, color));
				}
			}
		}
	}
	shuffle() {
		this.cards = this.cards.shuffle();
	}
}

class UnoDiscard extends UnoPile {
	constructor() {
		super();
	}
}

class UnoHand extends UnoPile {
	constructor() {
		super();
	}
	drawFromDeck(deck, count = 1) {
		while (count-- > 0 && deck.cards.length) {
			this.cards.push(deck.cards.pop());
		}
	}
}

class UnoPlayerDisplay extends LiveMessage {
	constructor() {
		
	}
}

class UNO extends MessageGame {
	constructor(context, players, emojis) {
		super(context, players);
		this.emojis = emojis;
		this.init();
	}
	init() {
		super.init();
		this.updateEmbed();
	}
	updateEmbed() {
		super.updateEmbed();
		
		return this.embed();
	}
}

UNO.CONFIG = {
	displayName: 'UNO',
	howToPlay: 'Players take turns to add a card of matching color or value to the discard pile.\nThey may draw from the deck that turn, but must play the card they drew or end their turn.\nUsing special cards like +2 and reverse will change the gameplay.\nFirst player to discard their entire hand wins!\nFor more info, see: https://en.wikipedia.org/wiki/Uno_(card_game)',
	shufflePlayers: true,
	canRestart: true,
	minPlayers: 2,
	maxPlayers: 10,
	minBotPlayers: 0,
	maxBotPlayers: 10,
	maxTurns: Infinity,
	interface: []
};

module.exports = UNO;
