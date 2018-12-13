const MessageGame = require('../../Sessions/MessageGame');
const {Deck,Hand,CardValues} = require('./Cards');
const {Format:fmt} = require('../../Utils');

const BLACKJACK = 21;
const RISK = 0.25;

class BlackjackHand extends Hand {
	constructor(cards, isDealer = false) {
		super(cards);
		this.bust      = false;
		this.blackjack = false;
		this.stand     = false;
		this.surrender = false;
		this.insurance = 0;
		this.isDealer = isDealer;
	}
	start(deck) {
		this.clear();
		if (this.isDealer) {
			this.drawFromDeck(deck, 1, 1);
		} else {
			this.drawFromDeck(deck, 2);
		}
	}
	get noMoreMoves() {
		return this.stand || this.surrender || this.blackjack || this.bust;
	}
	get blackjackValue() {
		var value = [0], aces = 0;
		for (var card of this.cards) {
			if (card.hidden) continue;
			value[0] += CardValues[card.value];
			if (card.value == 'A') {
				aces++;
			}
		}
		// aces allow the hand to have multiple values (e.g. [1,11], [2,12,22], and so on)
		while (aces-- > 0 && value[value.length-1] < 12) {
			value.push(value[value.length-1]+10);
		}
		return value;
	}
	get canSplit() {
		return this.cards.length == 2 && this.cards[0].numericValue == this.cards[1].numericValue;
	}
	split() {
		if (this.canSplit) {
			return new BlackjackHand(this.cards.splice(1,1), this.isDealer);
		} else {
			return null;
		} 
	}
	check() {
		var value = this.blackjackValue;
		if (value.includes(BLACKJACK)) {
			this.blackjack = true;
		} else if (value[0] > BLACKJACK) {
			this.bust = true;
		} else {
			this.blackjack = false;
			this.bust      = false;
		}
		return value;
	}
	toString(isActive) {
		var hand  = super.toString();
		var value = this.check();
		var state = '';
		if (this.blackjack) {
			state = '**Blackjack!**';
		} else if (this.bust) {
			state = '*Bust.*';
		} else if (this.surrender) {
			state = '*Surrendered.*';
		} else if (this.stand) {
			state = '__Stand__';
		}
		if (this.insurance) {
			state += ' (Insured)';
		}
		return `${isActive?'**Hand**':'Hand'}: ${hand}\nValue: ${value.join('/')} ${state}`;
	}
}

function comparePlayerWithDealer(player, dealer) {
	let dealerHand = dealer.hands[0];
	let dVal = dealerHand.blackjackValue.pop();
	
	let score = 0;
	for (let hand of player.hands) {
		let pVal = hand.blackjackValue.pop();
		if (hand.surrender) {
			player.reward -= player.bet / 2;
			score -= 0.5;
		}
		
		// insurance covers dealer blackjack 2-to-1 on its original down payment
		if (dealerHand.blackjack) {
			player.reward += hand.insurance * 2;
			score += 1;
		}
		if (hand.blackjack) {
			// special house rule
			if (dealerHand.blackjack) {
				player.reward += player.bet;
				score += 1;
			} else {
				player.reward += player.bet * 2;
				score += 2;
			}
			
		} else if (hand.bust) {
			if (dealerHand.bust) {
				player.reward -= player.bet / 2;
				score -= 0.5;
			} else {
				player.reward -= player.bet;
				score -= 1;
			}
			
		} else if (dealerHand.bust || pVal > dVal) {
			player.reward += player.bet;
			score += 1;
		} else if (!dealerHand.bust && pVal < dVal) {
			player.reward -= player.bet;
			score -= 1;
		}
	}
	return score;
}

// define the blackjack interface
const HIT       = '🃏';
const STAND     = '✅';
const DOUBLE    = '✌';
const SPLIT     = '↔';
const INSURANCE = '💰';
const SURRENDER = '🏳';

class Blackjack extends MessageGame {
	constructor(context, players = [], bet = 0) {
		players.push(context.client);
		super(context, players);
		
		// extend each player object with additional properties
		this.players.forEach(player => {
			player.hands       = [];
			player.isDealer    = false;
			player.originalBet = bet;
			player.reward      = 0;
		});
		
		this.dealer = this.players[this.players.length-1];
		this.dealer.isDealer = true;
		
		this.init();
	}
	init() {
		super.init();
		this.embed.footer = {
			text: `${HIT} = Hit\n${STAND} = Stand\n${DOUBLE} = Double\n${SPLIT} = Split\n${INSURANCE} = Insurance\n${SURRENDER} = Surrender`
		};

		this.deck = new Deck(4);
		this.deck.shuffle(4);
		
		// give each player a starting hand
		for (let player of this.players) {
			player.bet = player.originalBet;
			player.hands = [];
			
			let hand = new BlackjackHand([], player.isDealer);
			hand.start(this.deck);
			player.hands.push(hand);
		}
		
		this.handIdx = 0;
		this.updateEmbed();
	}
	get hands() {
		return this.players.reduce((hands, player) => hands.concat(player.hands), []);
	}
	get turnHand() {
		return this.players[this.playerIdx].hands[this.handIdx];
	}
	handlePlayerMove(reaction) {
		if (!this.getOptions().includes(reaction)) return;

		switch (reaction) {
			case HIT:
				this.handleHit();
				break;
			case STAND:
				this.handleStand();
				break;
			case DOUBLE:
				this.handleDouble();
				break;
			case INSURANCE:
				this.handleInsurance();
				break;
			case SPLIT:
				this.handleSplit();
				break;
			case SURRENDER:
				this.handleSurrender();
				break;
		}

		// check hand
		this.turnHand.check();
		if (this.turnHand.noMoreMoves) {
			this.finishMove();
		} else {
			this.updateEmbed();
		}
		return true;
	}
	handleBotMove() {
		if (this.player.isDealer) {
			return this.handleDealerMove();
		}

		let myVal = this.turnHand.blackjackValue.pop();
		let myOptions = this.getOptions();

		// get insurance
		if (myOptions.includes(INSURANCE)) {
			this.handleInsurance();
		}
		if (myOptions.includes(SPLIT) && Math.random() < RISK) {
			this.handleSplit();
		} else if (myVal < 17) {
			// draw a card (and add some risk)
			if (myOptions.includes(DOUBLE) && Math.random() < RISK) {
				this.handleDouble();
			} else {
				this.handleHit();
			}
		} else {
			// don't take anymore risks?
			this.handleStand();
		}

		// check hand
		this.turnHand.check();
		if (this.turnHand.noMoreMoves) {
			this.finishMove();
		} else {
			this.updateEmbed();
		}
		return true;
	}
	handleDealerMove() {
		// reveal dealer cards
		let dealer = this.dealer.hands[0];
		dealer.show();
		
		let lowestpVal = BLACKJACK + 1, bestpVal = 0;
		for (let hand of this.hands) {
			if (hand.isDealer) continue;
			let pVal = hand.blackjackValue.pop();
			if (pVal < lowestpVal) {
				lowestpVal = pVal;
			}
			if (pVal <= BLACKJACK && pVal > bestpVal) {
				bestpVal = pVal;
			}
		}
		if (lowestpVal <= BLACKJACK) {
			let dealerVal = dealer.blackjackValue.pop();
			while (dealerVal < lowestpVal && dealerVal < 19) {
				dealer.drawFromDeck(this.deck, 1);
				dealerVal = dealer.blackjackValue.pop();
			}
			while (dealerVal < bestpVal && dealerVal < 17) {
				dealer.drawFromDeck(this.deck, 1);
				dealerVal = dealer.blackjackValue.pop();
			}
		} else {
			// no need to draw extra cards if it cannot win
		}

		dealer.check();
		
		for (let player of this.players) {
			if (player.isDealer) continue;
			let result = comparePlayerWithDealer(player, this.dealer);
			if (result > 0) {
				this.winner = (this.winner || []);
				this.winner.push(player);
			}
		}

		if (!this.winner) {
			this.winner = this.dealer;
		}

		this.updateEmbed();
	}
	handleHit() {
		this.turnHand.drawFromDeck(this.deck, 1);
	}
	handleStand() {
		this.turnHand.stand = true;
	}
	handleDouble() {
		this.player.bet *= 2;
		this.turnHand.drawFromDeck(this.deck, 1);
		this.turnHand.stand = true;
	}
	handleInsurance() {
		// pay a separate bet for insurance
		this.turnHand.insurance = this.player.bet / 2;
		this.player.reward -= this.turnHand.insurance;
	}
	handleSplit() {
		let oldHand = this.turnHand;
		let newHand = this.turnHand.split();
		oldHand.drawFromDeck(this.deck, 1);
		newHand.drawFromDeck(this.deck, 1);
		this.player.hands.push(newHand);
	}
	handleSurrender() {
		this.turnHand.insurance = false;
		this.turnHand.surrender = true;
	}
	finishMove() {
		this.handIdx++;
		if (this.handIdx < this.player.hands.length) {
			this.updateEmbed();
		} else {
			this.handIdx = 0;
			super.finishMove();
		}
	}
	
	get status() {
        if (this.winner) {
            return super.status;
        } else {
            return {
                name: `${this.player.username}'s turn`,
                value: this.timer ? `You have ${this.timer} seconds.` : 'Waiting for player...'
            };
        }
    }
	get color() {
		if (this.winner) {
			if (this.winner == this.dealer) {
				return 0xFF0000;
			} else if (this.winner == 'tie') {
				return 0xFFFFFF;
			} else {
				return 0x00FF00;
			}
		} else {
			return 0;
		}
	}
	getOptions() {
		let options = [];
		if (!this.winner) {
			let value = this.turnHand.blackjackValue;
			if (value[value.length-1] < BLACKJACK) {
				options.push(HIT);
			}
			if (value[0] < BLACKJACK) {
				options.push(STAND);
			}
			if (value[0] > 12 && value[0] < BLACKJACK) {
				options.push(SURRENDER);
			}
			if (value[value.length-1] > 9 && value[value.length-1] < BLACKJACK) {
				options.push(DOUBLE);
			}
			if (this.dealer.hands[0].hasValue('A') && !this.insurance) {
				options.push(INSURANCE);
			}
			if (this.turnHand.canSplit) {
				options.push(SPLIT);
			}
		}
		return options;
	}
	checkWinCondition() {
		// win condition is checked on last player only
		return null;
	}
	toString() {
		if (this.player.isDealer) return '';
		let options = this.getOptions();
		if (options.length) {
			return 'Options: ' + options.join(' ');
		} else {
			return '';
		}
	}
	updateEmbed() {
		super.updateEmbed();
		this.embed.title = Blackjack.displayName;
		
		// create the fields for the players/dealer
		let playerFields = this.players.map((player,idx) => {
			let name = player.username + (player.isDealer ? ' (Dealer)' : '') + (idx == this.playerIdx ? '*' : '');
			let value = player.hands.map((hand,hidx) => hand.toString(idx == this.playerIdx && hidx == this.handIdx)).join('\n');
			if (player.reward) {
				value += '\n' + (player.reward > 0 ? 'Reward: ' : 'Loss: ') + fmt.currency(player.reward);
			}
			return { name, value, inline: !player.isDealer };
		});
		
		// move the dealer to the first index
		playerFields.unshift(playerFields.pop());
		
		// combine with the embeds
		this.embed.fields = playerFields.concat(this.embed.fields);

		return this.embed;
	}
}

// Game configuration
Blackjack.CONFIG = {
	gameType: MessageGame.COMPETITIVE,
	howToPlay: 'Draw cards ("hit") until your hand value reaches 21 or you *bust* by going over. "Stand" means to stop drawing and finish your turn. "Double down" means to double your bet.',
	minPlayers: 1,
	maxPlayers: 10,
	minBotPlayers: 1,
	maxBotPlayers: 10,
	canRestart: true,
	shufflePlayers: false,
	showSpectators: false,
	interface: [HIT,STAND,DOUBLE,SPLIT,INSURANCE,SURRENDER]
};

module.exports = Blackjack;
