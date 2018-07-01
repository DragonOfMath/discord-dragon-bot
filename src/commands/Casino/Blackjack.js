const Bank = require('../../Bank');
const Session = require('../../Session');
const {Markdown:md,random} = require('../../Utils');
const {Deck,Hand,CardValues} = require('./Cards');

const choiceIndex = {
	'hit':       ['hit', 'hitme', 'hit me'],
	'stand':     ['stand', 'done', 'finish'],
	'double':    ['double', 'doubledown', 'double down', 'i\'m feeling lucky'],
	'insurance': ['insurance', 'insure me'],
	'surrender': ['surrender', 'i surrender'],
	//'split':   ['split'],
	'cancel':    ['cancel']
};

const BLACKJACK = 21;

class BlackjackPlayer extends Hand {
	constructor(dealer = false, bet = 0) {
		super();
		this.bet = Number(bet);
		this.isDealer  = dealer;
		this.bust      = false;
		this.blackjack = false;
	}
	start(deck) {
		this.bust      = false;
		this.blackjack = false;
		if (this.isDealer) {
			this.drawFromDeck(deck, 1, 1);
		} else {
			this.drawFromDeck(deck, 2);
		}
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
	toString() {
		var hand  = super.toString();
		var value = this.check();
		var state = '';
		if (this.blackjack) {
			state = '**Blackjack!**';
		} else if (this.bust) {
			state = '*Bust.*';
		}
		return 'Hand:  ' + hand            + '\n'
		     + 'Value: ' + value.join('/') + '\n'
			 + state;
	}
}

class Blackjack extends Session {
	static generateID(context) {
		return `blackjack-${context.channelID}-${context.userID}`;
	}
	constructor(client, context, bet, callback) {
		super({
			id: Blackjack.generateID(context),
			info: 'Class Blackjack card game versus the bot.',
			settings: {
				expires: 30000,
				reset: true,
				max: -1,
				cancel: 5,
				silent: false
			},
			data: {},
			permissions: {
				type: 'inclusive',
				servers: {
					[context.serverID]: {
						users: [context.userID],
						channels: [context.channelID]
					}
				}
			},
			resolver({client, message, userID}) {
				var choice = message.toLowerCase();
				for (var ch in choiceIndex) {
					if (choiceIndex[ch].includes(choice)) return ch;
				}
			},
			events: {
				start() {
					// deal cards
					this.deck.shuffle(4);
					this.player.start(this.deck);
					this.bot.start(this.deck);
					this.winner = null;
					this.client.send(this.last_channel_id, this.toEmbed());
				},
				goodbye() {
					client.send(this.last_channel_id, 'You waited too long. Game forfeited.');
				},
				cancel() {
					this.close();
					return 'Game canceled.';
				},
				// Add a card to your hand. If your hand does not go over 21, you are still in the round.
				hit() {
					if (this.options.includes('hit')) {
						this.player.drawFromDeck(this.deck, 1);
						return this.proceed();
					} else {
						return 'Invalid choice.';
					}
				},
				// Finish adding cards to your hand and await for other players and the dealer to finish.
				stand() {
					if (this.options.includes('stand')) {
						this.player.check();
						return this.finish();
					} else {
						return 'Invalid choice.';
					}
				},
				// Add one more card and double your bet. Only if you\'re willing to be risky.
				double() {
					if (this.options.includes('double down')) {
						this.player.bet *= 2;
						this.player.drawFromDeck(this.deck, 1);
						this.player.check();
						return this.finish();
					} else {
						return 'Invalid choice.';
					}
				},
				// Place a side bet when the dealer has an Ace; if they get a blackjack, you keep your money.
				insurance() {
					if (this.options.includes('insurance')) {
						this.insurance = true;
						return this.proceed();
					} else {
						return 'Invalid choice.';
					}
				},
				// Relinquish only half your bet instead of your full bet if you think you\'ll lose this turn.
				surrender() {
					if (this.options.includes('surrender')) {
						this.player.bet /= 2;
						this.insurance = false;
						this.player.check();
						return this.finish();
					} else {
						return 'Invalid choice.';
					}
				},
				// If the player's hand includes two cards of the same value, they may split their hand into two and draw a new card for each.
				split() {
					if (this.options.includes('split')) {
						this.player.splitHand();
						return this.proceed();
					} else {
						return 'Invalid choice.';
					}
				}
			}
		});
		
		this.client = client;
		this.playerID = context.userID;
		this.insurance = false;
		this.deck   = new Deck(4);
		this.bot    = new BlackjackPlayer(true);
		this.player = new BlackjackPlayer(false, bet);
		this.winner = null;
		this.oncomplete = callback;
	}
	proceed() {
		this.player.check();
		if (this.player.bust || this.player.blackjack) {
			return this.finish();
		} else {
			return this.toEmbed();
		}
	}
	finish() {
		// reveal dealer cards
		this.bot.show();
		
		var pVal = this.player.blackjackValue,
		    pVal = pVal[pVal.length-1];
		var dVal = this.bot.blackjackValue,
		    dVal = dVal[dVal.length-1];
		if (!this.player.bust) {
			while (dVal < pVal) {
				this.bot.drawFromDeck(this.deck, 1);
				dVal = this.bot.blackjackValue, dVal = dVal[dVal.length-1];
			}
		} else {
			// no need to draw extra cards if the player is bust
		}
		this.bot.check();
		
		var reward = 0;
		if (this.bot.bust || (!this.player.bust && pVal > dVal)) {
			reward = this.player.bet;
			this.winner = this.player;
		} else if (this.player.bust || pVal < dVal) {
			reward = -this.player.bet;
			this.winner = this.bot;
		} else {
			reward = 0;
			this.winner = 'tie';
		}
		if (this.insurance && !this.player.bust && this.bot.blackjack) {
			reward = this.player.bet;
			this.winner = this.player;
		}
		
		this.close();
		return {
			message: this.oncomplete(reward),
			embed: this.toEmbed()
		};
	}
	get status() {
		if (this.winner == this.player) {
			return {
				name: 'Win',
				value: 'You win against the bot!'
			};
		} else if (this.winner == this.bot) {
			return {
				name: 'Lose',
				value: 'The bot wins!'
			};
		} else if (this.winner == 'tie') {
			return {
				name: 'Tie',
				value: 'Neither won or lost.'
			}
		} else {
			return null;
		}
	}
	get options() {
		var options = [];
		if (this.winner == null) {
			var value = this.player.blackjackValue;
			if (value[value.length-1] < BLACKJACK) {
				options.push('hit');
			}
			if (value[0] < BLACKJACK) {
				options.push('stand');
			}
			if (value[0] > 12 && value[0] < BLACKJACK) {
				options.push('surrender');
			}
			if (value[value.length-1] > 9 && value[value.length-1] < BLACKJACK) {
				options.push('double down');
			}
			if (this.bot.hasValue('A') && !this.insurance) {
				options.push('insurance');
			}
		}
		return options;
	}
	toEmbed() {
		var embed = {
			title: 'Blackjack:hearts::diamonds::clubs::spades:',
			fields: []
		};
		embed.fields.push({
			name: 'Player\'s Hand',
			value: this.player.toString(),
			inline: true
		});
		embed.fields.push({
			name: 'Bot (Dealer)',
			value: this.bot.toString(),
			inline: true
		});
		var status = this.status;
		if (status) {
			embed.fields.push(status);
		} else {
			var options = this.options;
			if (options.length) {
				embed.description = 'Options: ' + options.join(', ');
			}
		}
		
		return embed;
	}
}

module.exports = Blackjack;
