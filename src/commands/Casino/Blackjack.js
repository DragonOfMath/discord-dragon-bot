const {Deck,Hand,CardSuits} = require('./cards');
const Bank = require('../../Bank');

const HEADER = 'Blackjack' + Object.keys(CardSuits).map(x => CardSuits[x]).join('');
const BLACKJACK_BET_MINIMUM = 100;
const STAGE = {
	WAITING: 0,
	READY: 1
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

class Blackjack {
	constructor(client, host, channel) {
		if (Bank.get(client, host).credits < BLACKJACK_BET_MINIMUM) {
			throw 'You need at least ' + Bank.formatCredits(BLACKJACK_BET_MINIMUM) + ' to host a game of Blackjack.';
		}
		this.client = client;
		this.deck = new Deck(4); // play with 4 decks of cards.
		this.host = host;
		this.channelID = channel;
		this.stage = STAGE.WAITING;
		this.users = {
			'Bot':  new BlackjackPlayer(true),
			[host]: new BlackjackPlayer()
		};
	}
	join(user) {
		if (this.users[user]) {
			throw 'User is already part of this game.';
		}
		this.users[user] = new BlackjackPlayer();
	}
	leave(user) {
		if (!this.users[user]) {
			throw 'User is not part of this game.';
		}
		delete this.users[user];
	}
	start() {
		this.stage = STAGE.READY;
		for (var id in this.users) {
			this.users[id].returnToDeck(this.deck);
		}
		this.deck.shuffle(2);
		for (var id in this.users) {
			this.users[id].start(deck);
		}
		this.client.wait(3000)
		.then(this.displayGameProgress)
		.then(e => this.client.send(this.channelID, e));
	}
	stop() {
		for (var id in this.users) {
			delete this.users[id];
		}
	}
	setBet(user, bet) {
		if (bet < BLACKJACK_BET_MINIMUM) {
			throw md.mention(userID) + ', you must make a minimum bet of ' + Bank.formatCredits(BLACKJACK_BET_MINIMUM);
		}
		this.users[user].bet = bet;
	}
}

function displayGameProgress(data) {
	var embed = {
		title: HEADER,
		fields: []
	};
	for (var id of data.users) {
		embed.fields.push({
			name: md.mention(id),
			value: data.users[id].toString(),
			inline: true
		});
	}
	return embed;
}

function BlackjackSession(client, host, channelID) {
	return {
		id: channelID,
		title: 'Blackjack',
		info: '',
		settings: {
			expires: 60000,
			reset: true,
			max: -1,
			cancel: -1,
			silent: false
		},
		data: {
			game: this
		},
		permissions: {
			channels: [channelID]
		},
		resolver({client, message, userID}) {
			var mention  = md.mention(userID);
			var isPlayer = this.data.users.includes(userID);
			var isHost   = this.data.host == userID;
			var isWaiting = this.data.stage == STAGE.WAITING;
			var isReady   = this.data.stage == STAGE.READY;
			
			switch (message.toLowerCase()) {
				case 'stop':
				case 'end':
					if (!isPlayer) return;
					if (!isHost)   throw mention + ', only the host may force the game to stop.';
					return 'stop'; // Stop the Blackjack game abruptly.
				case 'start':
				case 'begin':
				case 'ready':
					if (!isPlayer)  return;
					if (!isHost)    throw mention + ', only the host may start the round.';
					if (!isWaiting) throw 'The round has already started.';
					return 'start'; // Starts a round ("shoe") of Blackjack. No players may join or leave until the round is over.
				case 'join':
					if (isPlayer)   throw mention + ', you already joined.';
					if (!isWaiting) throw mention + ', you may not join while a game is in play.';
					return 'join';
				case 'goodbye':
				case 'quit':
				case 'leave':
					if (!isPlayer)  return;
					if (!isWaiting) throw mention + ', you may not leave while a game is in play.';
					return 'leave';
				case 'bet':
					if (!isPlayer) return;
					if (!isWaiting) throw mention + ', you cannot change your bet during a round.';
					return 'bet'; // Sets your bet, which must be at least the minimum and cannot exceed your bank.
				
				case 'hit':
				case 'hitme':
				case 'hit me':
					if (!isPlayer) return;
					if (!isReady)  return;
					return 'hit'; // Add a card to your hand. If your hand does not go over 21, you are still in the round.
				case 'stand':
				case 'done':
				case 'finish':
					if (!isPlayer) return;
					if (!isReady)  return;
					return 'stand'; // Finish adding cards to your hand and await for other players and the dealer to finish.
				case 'double':
				case 'doubledown':
					if (!isPlayer) return;
					if (!isReady)  return;
					return 'double'; // Add one more card and double your bet. Only if you\'re willing to be risky.
				case 'surrender':
					if (!isPlayer) return;
					if (!isReady)  return;
					return 'surrender'; // Relinquish only half your bet instead of your full bet if you think you\'ll lose this turn.
				case 'insurance':
					if (!isPlayer) return;
					if (!isReady)  return;
					//return 'insurance'; // Place a side bet when the dealer has an Ace; if they get a blackjack, you keep your money.
					break;
				case 'split':
					if (!isPlayer) return;
					if (!isReady)  return;
					//return 'split'; 
					break;
			}
		},
		events: {
			start({client, userID}) {
				this.data.game.start();
				return 'The game has started.';
			},
			stop({client, userID}) {
				this.data.game.stop();
				this.fire('close');
				return 'The host has stopped the game.';
			},
			join({client, userID}) {
				this.data.game.join(userID);
				return md.mention(user) + ' has joined the game.';
			},
			leave({client, userID}) {
				this.data.game.leave(userID);
				if (userID == this.data.game.host) {
					this.fire('close');
					return md.mention(userID) + ' has left, forcing the game to stop.';
				} else {
					return md.mention(userID) + ' has left this game.';
				}
			},
			bet({client, userID, message}) {
				var bet = ~~message.match(/\d+/)[0];
				this.data.game.setBet(userID, bet);
				return md.mention(userID) + ', your bet has been set to ' + Bank.formatCredits(bet);
			},
			start({client, userID}) {
				
				this.fire('startBlackjack', client);
				return 'The host has started the round. No players may join or leave.';
			},
			hit({client, userID}) {
				
			}
		}
	};
}

module.exports = Blackjack;