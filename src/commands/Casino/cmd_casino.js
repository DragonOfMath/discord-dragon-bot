const Bank = require('../../Bank');
const {Markdown:md,Format:fmt,random} = require('../../Utils');
const SlotMachine = require('./slots');
const {Deck,Hand,CardSuits} = require('./cards');

const BlackjackHeader = 'Casino Blackjack' + Object.keys(CardSuits).map(x => CardSuits[x]).join('');
const BlackjackMinimumBet = 100;

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

module.exports = {};
/*
let casino = {
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
					try {
						let bet = 0
						let reward = 0
						let message = ''
						client.database.get('users').modify(userID, user => {
							if (user.bank) {
								if (user.bank.investing) {
									throw 'You can\'t play games when your account is investing.'
								}
								bet = Math.max(0,Math.min(Number(args[0]),user.bank.credits))
								;({reward,message} = RollDice(bet))
								user.bank.credits += reward
							} else {
								;({reward,message} = RollDice(0))
								message += ' (If you would like to add some risky fun, setup your bank account with `!bank.open`)'
							}
							return user
						}).save()
						return message
					} catch (e) {
						return ':warning: **Error**: ' + e
					}
				}
			},
			'coin': {
				aliases: ['cointoss','coinflip'],
				title: 'Casino | Coin Toss',
				info: 'Toss a coin, and if you call it right, you win, otherwise, you lose.',
				parameters: ['bet', '[heads or tails]'],
				fn({client, args, userID}) {
					try {
						let bet = 0
						let prediction = args[1]
						let reward = 0
						let message = ''
						client.database.get('users').modify(userID, user => {
							if (user.bank) {
								if (user.bank.investing) {
									throw 'You can\'t play games when your account is investing.'
								}
								bet = Math.max(0,Math.min(Number(args[0]),user.bank.credits))
								;({reward,message} = CoinToss(bet, prediction))
								user.bank.credits += reward
							} else {
								;({reward,message} = CoinToss(0, prediction))
								message += ' (If you would like to add some risky fun, setup your bank account with `!bank.open`)'
							}
							return user
						}).save()
						return message
					} catch (e) {
						return ':warning: **Error**: ' + e
					}
				}
			},
			'slots': {
				aliases: [],
				category: 'Fun',
				title: 'Casino | Slots:slot_machine:',
				info: '',
				parameters: ['[bet]'],
				fn({client, args}) {
					let bet = Number(args[0]) || 100
					
					return 'Not implemented yet, sorry!'
				}
			},
			'blackjack': {
				category: 'Fun',
				title: 'Casino | Blackjack',
				info: 'Classic Blackjack card game. Have the highest hand without going over 21 to win. For a more thorough explanation, see the [Wikipedia page](https://en.wikipedia.org/wiki/Blackjack).',
				subcommands: {
					'new': {
						info: 'Starts a game of Blackjack. Players may join and make their bets before a round starts.'
					},
					'stop': {
						aliases: ['end'],
						info: 'Stops the Blackjack game. You can only use this when a round is not in progress.'
					},
					'join': {
						info: 'Join a Blackjack game.',
					},
					'leave': {
						aliases: ['goodbye','quit'],
						info: 'Leave a Blackjack game.'
					},
					'bet': {
						info: 'Sets your bet, which must be at least the minimum and cannot exceed your bank.',
						parameters: ['amount']
					},
					'play': {
						aliases: ['begin', 'start'],
						info: 'Starts a round ("shoe") of Blackjack. No players may join or leave until the round is over.'
					},
					'hit': {
						aliases: ['hitme'],
						info: 'Add a card to your hand. If your hand does not go over 21, you are still in the round.'
					},
					'stand': {
						aliases: ['done', 'finish'],
						info: 'Finish adding cards to your hand and await for other players and the dealer to finish.'
					},
					'double': {
						aliases: ['doubledown'],
						info: 'Add one more card and double your bet. Only if you\'re willing to be risky.'
					},
					'surrender': {
						info: 'Relinquish only half your bet instead of your full bet if you think you\'ll lose this turn.'
					},
					'insurance': {
						info: 'Place a side bet when the dealer has an Ace; if they get a blackjack, you keep your money.'
					}
				}
			}
		}
	}
}

*/