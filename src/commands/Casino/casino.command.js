const Bank = require('../../Bank');
const {Markdown:md,Format:fmt,random} = require('../../Utils');
//const RollDice    = require('./RollDice');
//const CoinToss    = require('./CoinToss');
const SlotMachine = require('./Slots');
const Blackjack   = require('./Blackjack');

class Gamble {
	constructor(bet = 0, credits = 0, min = 0) {
		if (credits < min) throw `You don't have enough credits to bet the minimum of ${Bank.formatCredits(min)}.`;
		if (bet < min) throw `You need to bet at least ${Bank.formatCredits(min)}.`;
		this.bet = Math.max(min,Math.min(Number(bet),credits));
	}
	resolve(fn, ...args) {
		return fn.call(this, this.bet, ...args, (reward, message) => this.result(reward, message));
	}
	result(reward, message = '') {
		if (reward > 0) {
			message += '\nYou won ' + Bank.formatCredits(reward);
		} else if (reward < 0) {
			message += '\nYou lost ' + Bank.formatCredits(reward);
		}
		return {reward,message};
	}
}

function RollDice(bet, callback) {
	var multiplier = 0;
	var r1 = random(1,6);
	var r2 = random(1,6);
	
	if (r1 == r2) {
		if (r1 == 1 || r1 == 6) {
			multiplier = 2;
		} else {
			multiplier = 1;
		}
	} else if (r1 + r2 == 6) {
		multiplier = 0.5;
	} else  {
		multiplier = -1;
	}
	
	return callback(bet * multiplier, `rolled **${r1 == 1 ? ':game_die:' : r1}** and **${r2 == 1 ? ':game_die:' : r2}**.`);
}
function CoinToss(bet, prediction = 'heads', callback) {
	prediction = prediction.toLowerCase();
	switch (prediction) {
		case 'h':
		case 'head':
		case 'heads':
			prediction = 'heads';
			break;
		case 't':
		case 'tail':
		case 'tails':
			prediction = 'tails';
			break;
		default:
			throw 'Only call `heads` or `tails`!';
	}
	
	var result = random('heads','tails');
	return callback(prediction == result ? bet : -bet, `it's ${md.bold(result)}.`);
}

module.exports = {
	'casino': {
		aliases: ['gambling','gamble'],
		category: 'Fun',
		title: 'Casino Minigames',
		info: 'Assortment of fun and risky minigames. Place your bets and win big!',
		subcommands: {
			'dice': {
				title: 'Casino | Dice Roll:game_die:',
				info: 'Roll a pair of dice. Pair of 1\'s or 6\'s = x2. Other pair = x1. Sum of 6 = x0.5. Any other roll = loss.',
				parameters: ['[bet]'],
				fn({client, args, userID}) {
					return Bank.modify(client, userID, user => {
						if (user.investing) {
							throw 'You can\'t gamble when your account is investing.';
						}
						var gamble = new Gamble(args[0], user.credits);
						var {reward,message} = gamble.resolve(RollDice);
						user.changeCredits(reward);
						return message;
					});
				}
			},
			'coin': {
				aliases: ['cointoss','coinflip'],
				title: 'Casino | Coin Toss',
				info: 'Toss a coin and call it right.',
				parameters: ['[bet]', '[heads or tails]'],
				fn({client, args, userID}) {
					return Bank.modify(client, userID, user => {
						if (user.investing) {
							throw 'You can\'t gamble when your account is investing.';
						}
						var gamble = new Gamble(args[0], user.credits);
						var {reward,message} = gamble.resolve(CoinToss, args[1]);
						user.changeCredits(reward);
						return message;
					});
				}
			}
		}
	},
	'slots': {
		aliases: ['slotmachine'],
		category: 'Fun',
		title: 'Slots:slot_machine:',
		info: '3-column slot machine game!',
		parameters: ['[bet]'],
		fn({client, userID, channelID, args}) {
			var user = Bank.get(client, userID);
			if (user.investing) {
				throw 'You can\'t gamble when your account is investing.';
			}
			var gamble = new Gamble(args[0], user.credits);
			var slots  = new SlotMachine(gamble.bet);
			
			var messageID, spinIdx = 0;
			function spin() {
				if (spinIdx < 3) {
					return client.wait(1500)
					.then(() => {
						slots.spin(spinIdx);
						slots.columns[spinIdx++].hidden = false;
						return client.editMessage({
							channelID,
							messageID,
							embed: slots.toEmbed()
						});
					}).then(spin);
				} else {
					var multiplier = slots.calculateMultiplier();
					var reward = slots.bet * multiplier;
					var cost = slots.bet;
					if (reward) {
						Bank.modify(client, userID, user => {
							user.changeCredits(reward - cost);
						});
					}
					if (reward > cost) {
						return md.mention(userID) + ' Reward: `' + slots.bet + ' * ' + multiplier + '` = ' + Bank.formatCredits(reward);
					} else if (reward < cost) {
						return md.mention(userID) + ' Loss: ' + Bank.formatCredits(-cost);
					} else {
						return md.mention(userID) + ' No payout.';
					}
				}
			}
			return client.send(channelID, slots.toEmbed())
			.then(message => {messageID = message.id}).then(spin);
		},
		subcommands: {
			'table': {
				aliases: ['info', 'payout'],
				title: 'Slot Machine:slot_machine: | Payout Table',
				info: 'Displays the multipliers and chances of the slot items.',
				fn() {
					return SlotMachine.showPayoutTable();
				}
			}
		}
	},
	'videoslots': {
		aliases: ['vslots'],
		category: 'Fun',
		title: 'Video Slots:tv::slot_machine:',
		info: 'Video slots, a more advanced version of slots, with 5 columns instead of 3 and multiple ways of winning on a single screen!',
		parameters: ['[bet]'],
		fn({client, context, args}) {
			return 'Not ready yet, sorry!';
			/*
			var user = Bank.get(client, context.userID);
			if (user.investing) {
				throw 'You can\'t gamble when your account is investing.';
			}
			var gamble = new Gamble(args[0], user.credits);
			*/
		}
	},
	'blackjack': {
		category: 'Fun',
		title: 'Blackjack:hearts::diamonds::clubs::spades:',
		info: 'Classic Blackjack card game. Have the highest hand without going over 21 to win. For a more thorough explanation, see the Wikipedia page https://en.wikipedia.org/wiki/Blackjack',
		parameters: ['[bet]'],
		fn({client, context, args}) {
			var user = Bank.get(client, context.userID);
			if (user.investing) {
				throw 'You can\'t gamble when your account is investing.';
			}
			var gamble = new Gamble(args[0], user.credits);
			client.sessions.start(new Blackjack(client, context, gamble.bet, function (reward) {
				var message = md.mention(context.userID);
				if (reward) {
					Bank.modify(client, context.userID, user => {
						user.changeCredits(reward);
					});
					message += ' ' + (reward > 0 ? 'Reward: ' : 'Loss: ') + Bank.formatCredits(reward);
				}
				return message;
			}));
		}
	}
};

