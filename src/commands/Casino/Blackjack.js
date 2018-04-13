const Bank = require('../../Bank');
const Session = require('../../Session');
const {Markdown:md,Format:fmt,random} = require('../../Utils');
const {Deck,Hand,CardSuits} = require('./Cards');

const BLACKJACK_HEADER = 'Blackjack' + Object.keys(CardSuits).map(x => CardSuits[x]).join('');
const BLACKJACK_BET_MINIMUM = 100;

const choiceIndex = {
	'hit':       ['hit', 'hitme', 'hit me'],
	'stand':     ['stand', 'done', 'finish'],
	'double':    ['double', 'doubledown', 'double down', 'i\'m feeling lucky'],
	'insurance': ['insurance', 'insure me'],
	'surrender': ['surrender', 'i surrender']
};

class BlackjackPlayer extends Hand {
	constructor(dealer = false) {
		super(BLACKJACK_BET_MINIMUM);
		this.isDealer = dealer;
		this.bust = false;
		this.blackjack = false;
	}
	start(deck) {
		this.bust = false;
		this.blackjack = false;
		if (this.isDealer) {
			this.drawFromDeck(deck, 1, 1);
		} else {
			this.drawFromDeck(deck, 2);
		}
	}
	get blackjackValue() {
		let value = [0], aces = 0;
		for (let card of this.cards) {
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
	toString() {
		var hand  = super.toString();
		var value = this.blackjackValue;
		var state = '';
		if (value.includes(21)) {
			this.blackjack = true;
			state = '**Blackjack!**';
		} else if (value[0] > 21) {
			this.bust = true;
			state = '*Bust.*';
		} else {
			
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
	constructor(client, context, bet) {
		super({
			id: Blackjack.generateID(context),
			title: 'Blackjack',
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
				channels: [context.channelID],
				users:    [context.userID],
				servers:  [context.serverID]
			},
			resolver({client, message, userID}) {
				switch (message.toLowerCase()) {
					case 'hit':
					case 'hitme':
					case 'hit me':
						return 'hit'; // Add a card to your hand. If your hand does not go over 21, you are still in the round.
					case 'stand':
					case 'done':
					case 'finish':
						return 'stand'; // Finish adding cards to your hand and await for other players and the dealer to finish.
					case 'double':
					case 'doubledown':
					case 'double down':
						return 'double'; // Add one more card and double your bet. Only if you\'re willing to be risky.
					case 'surrender':
						return 'surrender'; // Relinquish only half your bet instead of your full bet if you think you\'ll lose this turn.
					case 'insurance':
						//return 'insurance'; // Place a side bet when the dealer has an Ace; if they get a blackjack, you keep your money.
						break;
					case 'cancel':
						return 'cancel';
				}
			},
			events: {
				start() {
					// deal cards
					this.deck.shuffle(2);
					this.player.start(this.deck);
					this.bot.start(this.deck);
					this.winner = null;
					
					this.client.wait(3000)
					.then(() => this.toEmbed())
					.then(e => this.client.send(this.last_channel_id, e));
				}
				goodbye() {
					return 'You waited too long. Game forfeited.';
				},
				cancel() {
					this.close();
					return 'Game canceled.';
				},
				hit() {
					this.player.drawFromDeck(this.deck, 1);
					return this.proceed();
				},
				stand() {
					return this.finish();
				},
				double() {
					this.bet *= 2;
					this.player.drawFromDeck(this.deck, 1);
					return this.proceed();
				},
				insurance() {
					this.insurance = this.bet;
					return this.proceed();
				},
				surrender() {
					this.bet /= 2;
					return this.finish();
				}
			}
		});
		
		this.client = client;
		this.bet    = bet;
		this.insurance = 0;
		this.deck   = new Deck(4);
		this.bot    = new BlackjackPlayer(true);
		this.player = new BlackjackPlayer();
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
				value: '????'
			};
		} else {
			return null;
		}
	}
	get options() {
		var options = [];
		if (this.winner == null) {
			options.push('stand');
			var value = this.player.blackjackValue
			if (value < 21) {
				options.push('hit');
			}
			if (value > 9) {
				options.push('double down');
			}
			if (value > 12) {
				options.push('surrender');
			}
			if (this.bot.hasValue(1)) {
				options.push('insurance');
			}
		}
		return options;
	}
	toEmbed() {
		var embed = {
			title: BLACKJACK_HEADER,
			fields: []
		};
		embed.fields.push({
			name: 'Player\'s Hand',
			value: this.player.toString(),
			inline: true
		});
		embed.fields.push({
			name: 'Bot\'s Hand',
			value: this.bot.toString(),
			inline: true
		});
		var status = this.status;
		if (status) {
			embed.fields.push(status);
		}
		var options = this.options;
		if (options.length) {
			embed.description = 'Options: ' + options.join(', ');
		}
		return embed;
	}
}

module.exports = Blackjack;
