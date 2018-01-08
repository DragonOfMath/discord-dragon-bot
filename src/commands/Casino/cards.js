const CardValues = {
	'A':  1,
	'2':  2,
	'3':  3,
	'4':  4,
	'5':  5,
	'6':  6,
	'7':  7,
	'8':  8,
	'9':  9,
	'10': 10,
	'J':  10,
	'Q':  10,
	'K':  10
};

const CardSuits = {
	heart: ':hearts:',
	diamond: ':diamonds:',
	club: ':clubs:',
	spade: ':spades:'
};

class Card {
	constructor(value, suit) {
		this.value = value;
		this.suit  = suit;
	}
	get name() {
		return `${this.name}${CardSuits[this.suit]}`;
	}
	equals(card) {
		return this == card || (this.value == card.value && this.suit == card.suit);
	}
}

class Pile {
	constructor() {
		this.cards = [];
	}
	get length() {
		return this.cards.length;
	}
	has(card) {
		if (!(card instanceof Card)) {
			throw 'Invalid card.';
		}
		return this.cards.some(c => c.name == card.name);
	}
	hasSuit(suit) {
		return this.cards.some(c => (c.suit == suit || c.suit == CardSuits[suit]));
	}
	hasValue(value) {
		return this.cards.some(c => (c.value = value || c.value == CardValues[value]));
	}
	
	add(card) {
		if (!(card instanceof Card)) {
			throw 'Invalid card.';
		}
		this.cards.push(card);
		return this;
	}
	remove(card) {
		if (!(card instanceof Card)) {
			throw 'Invalid card.';
		}
		if (!this.has(card)) {
			throw 'Card not in pile.';
		}
		for (let i = 0, c; i < this.cards.length; i++) {
			c = this.cards[i];
			if (c.equals(card)) {
				this.splice(i,1);
			}
		}
		return this;
	}
}

class Deck extends Pile {
	constructor(mult = 1) {
		super();
		while (mult-- > 0) {
			for (let value in CardValues) {
				for (let suit in CardSuits) {
					this.add(new Card(value, suit));
				}
			}
		}
	}
	shuffle(iterations = 1) {
		while (iterations-- > 0) {
			for (let a = 0, b, temp; a < this.length; a++) {
				b = Math.floor(this.length * Math.random());
				
				temp = this.cards[a];
				this.cards[a] = this.cards[b];
				this.cards[b] = temp;
			}
		}
		return this;
	}
	draw() {
		if (this.length > 0) {
			return this.cards.shift();
		} else {
			throw 'No more cards in deck.';
		}
	}
}

class Hand extends Pile {
	constructor(bet = 0) {
		super();
		this.bet = Number(bet);
	}
	drawFromDeck(deck, count = 1) {
		if (!(deck instanceof Deck)) {
			throw 'Invalid deck source.';
		}
		let cardsDrawn = []
		while (count-- > 0) {
			var c = deck.draw();
			cardsDrawn.push(c);
			this.add(c);
		}
		
		return cardsDrawn;
	}
	returnToDeck(deck) {
		if (!(deck instanceof Deck)) {
			throw 'Invalid deck source.';
		}
		while (this.length > 0) {
			deck.add(this.cards.shift());
		}
		return this;
	}
	get blackjackValue() {
		let value = [0], aces = 0;
		for (let card of this.cards) {
			value[0] += CardValues[card.value];
			if (card.value == 'A') {
				aces++;
			}
		}
		// aces allow the hand to have multiple values (e.g. [1,11], [2,12,22], and so on)
		while (aces-- > 0) {
			value.push(value[value.length-1]+10);
		}
		return value;
	}
}

module.exports = {
	CardSuits,
	CardValues,
	Card,
	Pile,
	Deck,
	Hand
};