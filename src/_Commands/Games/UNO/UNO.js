const Asset = require('../../../Structures/Asset');
const MessageGame = require('../../../Sessions/MessageGame');
const LiveMessage = require('../../../Sessions/LiveMessage');
const {Array,Markdown:md,DiscordUtils} = require('../../../Utils');

const WILDCARD_COLOR = '*';
const CARD_COLORS = ['red','green','blue','yellow'];
const CARD_VALUES = [0,1,2,3,4,5,6,7,8,9,'skip','reverse','plus2','plus4','wildcard'];
const CARD_NAMES  = CARD_VALUES.slice(13);
for (let color of CARD_COLORS) {
	for (let value of CARD_VALUES.slice(0,13)) {
		CARD_NAMES.push(`${color}_${value}`);
	}
}

const CARD_COUNTS = {};
for (let value of CARD_VALUES) {
	switch (value) {
		case 0:
		case 'plus4':
		case 'wildcard':
			CARD_COUNTS[value] = 1;
			break;
		default:
			CARD_COUNTS[value] = 2;
			break;
	}
}

const DRAW_CARD = '🃏';

function isWildcard(value) {
	return value === 'plus4' || value === 'wildcard';
}

class UnoCard {
	constructor(value, color) {
		this.value = value;
		this.color = isWildcard(value) ? WILDCARD_COLOR : color;
	}
	get isNumber() {
		return Number(this.value) == this.value;
	}
	get isAction() {
		return CARD_VALUES.indexOf(this.value) > 9;
	}
	get isWildcard() {
		return isWildcard(this.value);
	}
	get name() {
		if (this.isWildcard) {
			return this.value;
		} else {
			return `${this.color}_${this.value}`;
		}
	}
	get emojiID() {
		return UNO.emojis[this.name];
	}
	get reaction() {
		return this.name + ':' + this.emojiID;
	}
	toString() {
		return md.emoji(this.emoji) + (this.isWildcard && this.color !== WILDCARD_COLOR ? '(' + this.color + ')' : '');
	}
	canUse(onCard) {
		return (onCard.isWildcard || this.isWildcard) || 
		       (onCard.value == this.value || onCard.color == this.color);
	}
}

class UnoPile {
	constructor(cards = []) {
		this.cards = cards;
	}
	transferCards(targetPile, count = 1) {
		count = Math.min(count, this.cards.length);
		while (count-- > 0) {
			targetPile.cards.push(this.cards.pop());
		}
	}
	get bottomCard() {
		return this.cards[0];
	}
	get topCard() {
		return this.cards[this.cards.length-1];
	}
	toString() {
		return this.cards.map(card => card.toString()).join();
	}
}

class UnoDeck extends UnoPile {
	constructor() {
		super();
		for (let color of CARD_COLORS) {
			for (let value of CARD_VALUES) {
				for (let c = 0; c < CARD_COUNTS[value]; c++) {
					this.cards.push(new UnoCard(value, color));
				}
			}
		}
	}
	shuffle() {
		this.cards = this.cards.shuffle();
	}
}

class UnoHand extends UnoPile {
	get reactions() {
		return this.cards.map(card => card.reaction).reduce((a,c) => {
			if (!a.includes(c)) a.push(c);
			return a;
		}, []);
	}
	drawFromDeck(deck, count) {
		deck.transferCards(this, count);
	}
}

class UnoPlayerDisplay extends LiveMessage {
	constructor(player) {
		super(player.id);
		this.player = player;
	}
	updateEmbed() {
		this.embed = this.embed || {};
		this.embed.title = `UNO - ${this.player.username}'s Hand`;
		this.embed.description = this.player.cards.toString();
		if (this.player.skipNextTurn) {
			this.embed.footer = {text:'A Skip Turn was used on you.'};
		} else {
			delete this.embed.footer;
		}
		return this.embed;
	}
}

class UNO extends MessageGame {
	constructor(context, players) {
		if (!UNO.emojis) {
			UNO.emojis = getUnoCardEmoteIDs(context.client);
		}
		super(context, players);
		this.game = {
			deck: new UnoDeck(),
			discard: new UnoPile()
		};
		this.players.forEach(player => {
			player.hand = new UnoHand();
			player.skipNextTurn = false;
			player.liveMessage = !player.bot && new UnoPlayerDisplay(player);
			player.liveMessage.on('reaction', e => this.handlePlayerMove(e));
		});
		this.init();
	}
	init() {
		super.init();
		this.direction = 1;
		for (let player of this.players) {
			player.hand.transferCards(this.game.deck, 999);
			player.skipNextTurn = false;
		}
		this.game.discard.transferCards(this.game.deck, 999);
		this.game.deck.shuffle();
		for (let player of this.players) {
			player.hand.drawFromDeck(this.game.deck, 7);
		}
		this.updateEmbed();
	}
	async startGame(client) {
		this.message = 'Setting up game, please wait...';
		this.embed = null;
		await super.startGame(client);
		for (let player of this.players) {
			await player.liveMessage.setupReactionInterface(client, [DRAW_CARD, ...player.cards.reactions]);
		}
		this.message = '';
		this.updateEmbed();
		await this.edit(client);
	}
	updateEmbed() {
		super.updateEmbed();
		
		return this.embed;
	}
	static initEmojis(client) {
		if (this.emojis) return;
		this.emojis = {};
		for (let sID in client.servers) {
			let server = client.servers[sID];
			if (server.name.startsWith('UNO Card Storage')) {
				for (let eID in server.emojis) {
					let emoji = server.emojis[eID];
					this.emojis[emoji.name] = emoji;
				}
			}
		}
	}
}
UNO.emojis = null;

function getUnoCardEmoteIDs(client) {
	let unoCardServers = DiscordUtils.search(client.servers, server => server.name.includes('UNO Card Storage'));
	if (unoCardServers.length == 0) {
		throw 'Unable to retrieve UNO card emotes.';
	}
	let unoCardEmotes  = DiscordUtils.getAllEmojis(unoCardServers);
	if (unoCardEmotes.length == 0) {
		throw 'No UNO card emotes found.';
	}
	return unoCardEmotes.reduce((IDs,card) => {
		IDs[card.name] = card.id;
		return IDs;
	}, {});
}

UNO.CONFIG = {
	displayName: 'UNO',
	howToPlay: 'Players take turns to add a card of matching color or value to the discard pile.\nThey may draw from the deck that turn, but must play the card they drew or end their turn.\nUsing special cards like +2 and reverse will change the gameplay.\nFirst player to discard their entire hand wins!\nFor more info and rules, see: https://en.wikipedia.org/wiki/Uno_(card_game)',
	shufflePlayers: true,
	canRestart: true,
	minPlayers: 2,
	maxPlayers: 4,
	minBotPlayers: 0,
	maxBotPlayers: 4,
	maxTurns: Infinity,
	interface: []
};

module.exports = UNO;
