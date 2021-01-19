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
const CardSuits = [
	':hearts:',
	':diamonds:',
	':clubs:',
	':spades:'
];

class Card {
	constructor(value, suit, hidden = true) {
		this.value  = value; // String
		this.suit   = suit;  // String
		this.hidden = hidden;
	}
	get name() {
		return this.hidden ? '??' : (this.value + this.suit);
	}
	get numericValue() {
		return CardValues[this.value];
	}
	equals(card) {
		return this == card || (this.value == card.value && this.suit == card.suit);
	}
}

class Pile {
	constructor(cards = []) {
		this.cards = cards;
	}
	get length() {
		return this.cards.length;
	}
	has(card) {
		if (!(card instanceof Card)) {
			throw 'Invalid card.';
		}
		return this.cards.some(c => !c.hidden && c.name == card.name);
	}
	hasSuit(suit) {
		return this.cards.some(c => !c.hidden && (c.suit == suit || c.suit == CardSuits[suit]));
	}
	hasValue(value) {
		return this.cards.some(c => !c.hidden && (c.value == value || c.numericValue == value));
	}
	clear() {
		this.cards = [];
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
	hide() {
		this.cards.forEach(c => c.hidden = true);
	}
	show() {
		this.cards.forEach(c => c.hidden = false);
	}
	toString() {
		return this.cards.map(c => c.name).join(',');
	}
}

class Deck extends Pile {
	constructor(mult = 1) {
		super();
		while (mult-- > 0) {
			for (var value in CardValues) {
				for (var suit of CardSuits) {
					this.add(new Card(value, suit, true));
				}
			}
		}
	}
	shuffle(iterations = 1) {
		this.hide();
		while (iterations-- > 0) {
			for (var a = 0, b, temp; a < this.length; a++) {
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
	drawFromDeck(deck, count = 1, hiddenCount = 0) {
		if (!(deck instanceof Deck)) {
			throw 'Invalid deck source.';
		}
		let cardsDrawn = [];
		while (count-- > 0) {
			var c = deck.draw();
			c.hidden = false;
			cardsDrawn.push(c);
			this.add(c);
		}
		while (hiddenCount-- > 0) {
			var c = deck.draw();
			c.hidden = true;
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
}

module.exports = {
	CardSuits,
	CardValues,
	Card,
	Pile,
	Deck,
	Hand
};
