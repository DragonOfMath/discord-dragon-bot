const Bank = require('../../../Bank/Bank');
const {Markdown:md,random} = require('../../../Utils');
const SlotMachine = require('./Slots');
const VideoSlots  = require('./VideoSlots');
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
	let multiplier = 0;
	let r1 = random(1,6);
	let r2 = random(1,6);
	
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
	
	return callback(bet * multiplier, `rolled **${r1 == 1 ? '🎲' : r1}** and **${r2 == 1 ? '🎲' : r2}**.`);
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
	
	let result = random('heads','tails');
	return callback(prediction == result ? bet : -bet, `it's ${md.bold(result)}.`);
}

module.exports = {
	'casino': {
		aliases: ['gambling','gamble','bet'],
		category: 'Economy',
		title: 'Casino Minigames',
		info: 'Assortment of fun and risky minigames. Place your bets and win big!',
		permissions: 'inclusive',
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
						let gamble = new Gamble(args[0], user.credits);
						let {reward,message} = gamble.resolve(RollDice);
						user.changeCredits(reward);
						return message;
					});
				}
			},
			'coin': {
				aliases: ['cointoss','coinflip'],
				title: 'Casino | Coin Toss',
				info: 'Toss a coin and call it right.',
				parameters: ['[bet]', '[heads|tails]'],
				fn({client, args, userID}) {
					return Bank.modify(client, userID, user => {
						if (user.investing) {
							throw 'You can\'t gamble when your account is investing.';
						}
						let gamble = new Gamble(args[0], user.credits);
						let {reward,message} = gamble.resolve(CoinToss, args[1]);
						user.changeCredits(reward);
						return message;
					});
				}
			},/*
			'rps': {
				aliases: ['rockpaperscissors'],
				title: 'Casino | Rock Paper Scissors',
				info: 'Classic hand gesture game but with an ante!',
				parameters: ['[bet]', '<r|rock|p|paper|s|scissors>'],
				fn() {
					
				}
			}*/
		}
	},
	'slots': {
		aliases: ['slotmachine','slots3'],
		category: 'Economy',
		title: 'Slot Machine:slot_machine:',
		info: '3-column slot machine game! Now with extra betting and free spins! To see the payout table, use this command with the `-table` flag.',
		parameters: ['[bet]'],
		flags: ['t|table'],
		permissions: 'inclusive',
		fn({client, context, args, flags}) {
			if (flags.has('t') || flags.has('table') || flags.has('payout')) {
				return SlotMachine.showPayoutTable();
			}
			let bank = Bank.get(client, context.userID);
			if (bank.investing) {
				throw 'You can\'t gamble when your account is investing.';
			}
			let gamble = new Gamble(args[0], bank.credits);
			let slots  = new SlotMachine(context, bank, gamble.bet);
			
			slots.on('creditchange', (amount) => {
				if (!amount) return;
				Bank.modify(client, context.userID, bank => {
					bank.changeCredits(amount);
				});
			});
			
			slots.startGame(client);
		}
	},
	'vslots': {
		aliases: ['videoslots','slots5'],
		category: 'Economy',
		title: 'Video Slots:tv::slot_machine:',
		info: 'Video slots, a more advanced version of slots, with 5 columns instead of 3 and multiple ways of winning on a single screen! Rewards are reduced for balancing.',
		parameters: ['[bet]'],
		flags: ['t|table'],
		permissions: 'inclusive',
		fn({client, context, args, flags}) {
			if (flags.has('t') || flags.has('table') || flags.has('payout')) {
				return VideoSlots.showPayoutTable();
			}
			
			let bank = Bank.get(client, context.userID);
			if (bank.investing) {
				throw 'You can\'t gamble when your account is investing.';
			}
			let gamble = new Gamble(args[0], bank.credits);
			let slots  = new VideoSlots(context, bank, gamble.bet);
			
			slots.on('creditchange', (amount) => {
				if (!amount) return;
				Bank.modify(client, context.userID, bank => {
					bank.changeCredits(amount);
				});
			});
			
			slots.startGame(client);
		}
	},
	'blackjack': {
		category: 'Economy',
		title: 'Blackjack:hearts::diamonds::clubs::spades:',
		info: 'Classic Blackjack card game, now with other players! Have the highest hand without going over 21 to win. For a more thorough explanation, see the Wikipedia page https://en.wikipedia.org/wiki/Blackjack',
		parameters: ['[...co-players]', '[bet]'],
		permissions: 'inclusive',
		fn({client, context, args}) {
			let user = Bank.get(client, context.userID);
			if (user.investing) {
				throw 'You can\'t gamble when your account is investing.';
			}

			let players = args.slice(), bet = 0;
			if (typeof(players[players.length-1]) === 'number') {
				bet = players.pop();
			}
			let gamble = new Gamble(bet, user.credits);

			players = players.map(p => client.users[md.userID(p)]).filter(o => o);
			players.unshift(context.user);

			let blackjack = new Blackjack(context, players, gamble.bet);

			// when the game is closed, apply rewards
			blackjack.on('close', () => {
				let modified = false;
				for (let player of blackjack.players) {
					if (player.isDealer) continue;
					if (player.bot) continue;
					if (!player.reward) continue;
					Bank._modify(client, player.id, user => {
						user.changeCredits(player.reward);
						modified = true;
					});
				}
				if (modified) {
					Bank.save(client);
				}
			});

			blackjack.startGame(client);
		}
	},
	'beg': {
		aliases: ['panhandle'],
		category: 'Economy',
		info: 'Beg for money because you\'re poor lol.',
		permissions: 'inclusive',
		fn({client, userID}) {
			if (Math.random() < 0.5) {
				return random([
					'no',
					'no money for you',
					'stop begging',
					'go beg somewhere else',
					'lol nah',
					'get a job loser',
					'get help',
					'you need professional help',
					'I\'m not gonna feed your gambling addiction',
					'I\'m not giving you money for drugs',
					'I\'m not giving you money for booze',
					'you smell bad',
					'sorry, I don\'t have any spare change',
					'money don\'t grow on trees',
					'I\'m not made of money, well actually I am but',
					'you need jesus, not money :)',
					'sorry mate, can\'t help you',
					'[walks away faster]',
					'sure, take these arcade tokens',
					'ohoho, you want my money? come and take it!',
					'begone thot',
					'keep your filthy peasant hands off me',
					'ew, poor people',
					'stop being poor',
					'`Math.random() < 0.5` returned true, so no money',
					'I regret to inform you that I do not have any currency on me at the moment'
				]);
			} else {
				return Bank.modify(client, userID, account => {
					let money = random(1,10);
					if (Math.random() < 0.1) {
						money *= random(5,10);
					}
					account.changeCredits(money);
					return 'A kind stranger gave you ' + Bank.formatCredits(money);
				});
			}
		}
	}
};

