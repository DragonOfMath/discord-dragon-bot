const Bank = require('../../Bank');
const {Markdown:md,Format:fmt,random} = require('../../Utils');
//const RollDice    = require('./RollDice');
//const CoinToss    = require('./CoinToss');
//const SlotMachine = require('./Slots');
//const Blackjack   = require('./Blackjack');

class Gamble {
	constructor(bet = 0, credits = 0, min = 0) {
		if (bet < min) throw `You need to bet at least ${Bank.formatCredits(min)}.`;
		this.bet = Math.max(min,Math.min(Number(bet),credits));
	}
	resolve(fn, ...args) {
		return fn.call(this, this.bet, ...args, (reward, message) => this.result(reward, message));
	}
	result(reward, message) {
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
		info:'Assortment of fun and risky minigames. Place your bets and win big!',
		subcommands: {
			'dice': {
				title: 'Casino | Dice Roll:game_die:',
				info: 'Roll a pair of dice. Pair of 1\'s or 6\'s = x2. Other pair = x1. Sum of 6 = x0.5. Any other roll = loss.',
				parameters: ['[bet]'],
				fn({client, args, userID}) {
					return Bank.modify(client, userID, user => {
						if (user.investing) {
							throw 'You can\'t play games when your account is investing.';
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
							throw 'You can\'t play games when your account is investing.';
						}
						var gamble = new Gamble(args[0], user.credits);
						var {reward,message} = gamble.resolve(CoinToss, args[1]);
						user.changeCredits(reward);
						return message;
					});
				}
			},
			'slots': {
				aliases: [],
				title: 'Casino | Slots:slot_machine:',
				info: 'Slot machine game. Three columns with a variety of objects, get certain combinations to win!',
				parameters: ['[bet]'],
				fn({client, args}) {
					return 'Not ready yet, sorry!';
				}
			},
			'videoslots': {
				aliases: ['vslots'],
				title: 'Casino | Video Slots:tv::slot_machine:',
				info: 'Video slots, a more advanced version of slots, with 5 columns instead of 3 and multiple ways of winning on a single screen!',
				parameters: ['[bet]'],
				fn({client, args}) {
					return 'Not ready yet, sorry!';
				}
			},
			'blackjack': {
				title: 'Casino | Blackjack',
				info: 'Classic Blackjack card game. Have the highest hand without going over 21 to win. For a more thorough explanation, see the Wikipedia page https://en.wikipedia.org/wiki/Blackjack',
				parameters: ['[bet]'],
				fn({client, userID, channelID, args}) {
					return 'Not ready yet, sorry!';
					//client.sessions.start(new Blackjack(client, userID, channelID));
					//return 'A new Blackjack session has started. Players may join and make their bets before the host begins the round.';
				}
			}
		}
	}
};

