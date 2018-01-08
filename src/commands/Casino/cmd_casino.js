const Bank = require('../../Bank');
const {Markdown:md,Format:fmt,random} = require('../../Utils');
const SlotMachine = require('./Slots');
const Blackjack   = require('./Blackjack');

function RollDice(bet) {
	let multiplier = 0;
	
	let roll1 = random(1,6);
	let roll2 = random(1,6);
	
	if (roll1 + roll2 == 6) {
		multiplier = 0.5;
	} else if (roll1 == roll2) {
		if (roll1 == 1 || roll1 == 6) {
			multiplier = 2;
		} else {
			multiplier = 1;
		}
	} else {
		multiplier = -1;
	}
	
	return {
		reward: bet * multiplier,
		message: `Rolled **${roll1 == 1 ? ':die:' : roll1}** and **${roll2 == 1 ? ':die:' : roll2}**. You ` + (reward > 0 ? 'won ' : 'lost ') + md.bold(fmt.currency(Math.abs(reward),Currency,Rounding))
	};
}
function CoinToss(bet, prediction = 'heads') {
	prediction = prediction.toLowerCase();
	switch (prediction) {
		case 'h':
		case 'head':
			prediction = 'heads'
			break
		case 't':
		case 'tail':
			prediction = 'tails'
			break
		default:
			throw 'Only call `heads` or `tails`!'
	}
	
	let result = random(['heads','tails'])
	let won = prediction == result
	return {
		reward: won ? bet : -bet,
		message: md.bold(result == 'heads' ? 'Heads' : 'Tails') + '. You ' + (won ? 'won ' : 'lost ') + md.bold(fmt.currency(Math.abs(reward),Currency,Rounding))
	}
}

module.exports = {
	'casino': {
		category: 'Fun',
		title: 'Casino Minigames',
		info:'Assortment of fun and risky minigames. Place your bets and win big!',
		subcommands: {
			'dice': {
				title: 'Casino | Dice Roll:die:',
				info: 'Roll a pair of dice. Pair of 1\'s or 6\'s = x2. Other pair = x1. Sum of 6 = x0.5. Any other roll = loss.',
				parameters: ['bet'],
				fn({client, args, userID}) {
					return Bank.modify(client, userID, user => {
						if (user.investing) {
							throw 'You can\'t play games when your account is investing.';
						}
						var bet = Math.max(0,Math.min(Number(args[0]),user.credits));
						var {reward,message} = RollDice(bet);
						user.credits += reward;
						return message;
					});
				}
			},
			'coin': {
				aliases: ['cointoss','coinflip'],
				title: 'Casino | Coin Toss',
				info: 'Toss a coin, and if you call it right, you win, otherwise, you lose.',
				parameters: ['bet', '[heads or tails]'],
				fn({client, args, userID}) {
					return Bank.modify(client, userID, user => {
						if (user.bank.investing) {
							throw 'You can\'t play games when your account is investing.'
						}
						var prediction = args[1]
						var bet = Math.max(0,Math.min(Number(args[0]),user.bank.credits));
						var {reward,message} = CoinToss(bet, prediction);
						user.credits += reward;
						return message;
					});
				}
			},
			'slots': {
				aliases: [],
				category: 'Fun',
				title: 'Casino | Slots:slot_machine:',
				info: '',
				parameters: ['[bet]'],
				fn({client, args}) {
					return 'Not ready yet, sorry!';
				}
			},
			'blackjack': {
				category: 'Fun',
				title: 'Casino | Blackjack',
				info: 'Classic Blackjack card game. Have the highest hand without going over 21 to win. For a more thorough explanation, see the [Wikipedia page](https://en.wikipedia.org/wiki/Blackjack).',
				fn({client, userID, channelID}) {
					if (client.sessions.has(channelID)) {
						throw 'A session is currently in progress in this channel.';
					}
					return 'Not ready yet, sorry!';
					//client.sessions.start(new Blackjack(client, userID, channelID));
					//return 'A new Blackjack session has started. Players may join and make their bets before the host begins the round.';
				}
			}
		}
	}
};

