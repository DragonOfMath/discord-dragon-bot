const Bank = require('../../Bank');
const {Markdown:md,Format:fmt,random} = require('../../Utils');
const SlotMachine = require('./Slots');
const Blackjack   = require('./Blackjack');

function betResults(reward, message) {
	if (reward > 0) {
		message += '\nYou won ' + Bank.formatCredits(reward);
	} else if (reward < 0) {
		message += '\nYou lost ' + Bank.formatCredits(reward);
	}
	
	return {reward,message};
}

function RollDice(bet = 0) {
	if (isNaN(bet)) {
		bet = 0;
	}
	var multiplier = 0;
	
	var roll1 = random(1,6);
	var roll2 = random(1,6);
	
	if (roll1 == roll2) {
		if (roll1 == 1 || roll1 == 6) {
			multiplier = 2;
		} else {
			multiplier = 1;
		}
	} else if (roll1 + roll2 == 6) {
		multiplier = 0.5;
	} else  {
		multiplier = -1;
	}

	return betResults(bet * multiplier, `rolled **${roll1 == 1 ? ':game_die:' : roll1}** and **${roll2 == 1 ? ':game_die:' : roll2}**.`);
}
function CoinToss(bet = 0, prediction = 'heads') {
	if (isNaN(bet)) {
		prediction = bet;
		bet = 0;
	}
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
	
	var result = random(['heads','tails']);
	return betResults(prediction == result ? bet : -bet, `it's ${md.bold(result)}.`);
}

module.exports = {
	'casino': {
		category: 'Fun',
		title: 'Casino Minigames',
		info:'Assortment of fun and risky minigames. Place your bets and win big!',
		subcommands: {
			'dice': {
				title: 'Casino | Dice Roll:game_die:',
				info: 'Roll a pair of dice. Pair of 1\'s or 6\'s = x2. Other pair = x1. Sum of 6 = x0.5. Any other roll = loss.',
				parameters: ['bet'],
				fn({client, args, userID}) {
					return Bank.modify(client, userID, user => {
						if (user.investing) {
							throw 'You can\'t play games when your account is investing.';
						}
						var bet = Math.max(0,Math.min(Number(args[0]),user.credits));
						var {reward,message} = RollDice(bet);
						user.changeCredits(reward);
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
						if (user.investing) {
							throw 'You can\'t play games when your account is investing.';
						}
						var prediction = args[1];
						var bet = Math.max(0,Math.min(Number(args[0]),user.credits));
						var {reward,message} = CoinToss(bet, prediction);
						user.changeCredits(reward);
						return message;
					});
				}
			},
			'slots': {
				aliases: [],
				title: 'Casino | Slots:slot_machine:',
				info: '',
				parameters: ['[bet]'],
				fn({client, args}) {
					return 'Not ready yet, sorry!';
				}
			},
			'blackjack': {
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

