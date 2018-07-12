const Lottery = require('./Lottery');
const Bank = require('../../Bank');
const {Markdown:md,Format:fmt} = require('../../Utils');

module.exports = {
	'lottery': {
		category: 'Fun',
		title: ':confetti_ball: Lottery',
		info: `Participate in the global lottery. Specify how many tickets you wish to by at ${Bank.formatCredits(Lottery.TICKET_COST)} each, up to ${md.bold(Lottery.TICKET_LIMIT)} tickets. Every ${md.bold(fmt.time(Lottery.DURATION))} the bot will pick a number, and if one of your tickets includes that number, you win the jackpot! Tickets will be reset at that time, so the jackpot can keep growing.`,
		parameters: ['amount'],
		permissions: 'inclusive',
		fn({client, userID, args}) {
			return Lottery.buyTickets(client, userID, args[0]);
		},
		subcommands: {
			'tickets': {
				aliases: ['numbers'],
				title: ':confetti_ball: Lottery | My Tickets',
				info: 'List the ticket numbers you\'ve purchased.',
				fn({client, userID, args}) {
					let tickets = Lottery.getUserTickets(client, userID);
					if (tickets.length) {
						return 'Your ticket numbers are: ' + tickets.map(md.code).join(', ');
					} else {
						return 'You have not purchased any tickets!';
					}
				}
			},
			'info': {
				title: ':confetti_ball: Lottery | Info',
				info: 'Get the current jackpot, the total number of tickets purchased globally, the time remaining, and the last winning number of the Lottery.',
				fn({client}) {
					return Lottery.get(client).embed();
				}
			},
			'time': {
				aliases: ['countdown'],
				title: ':confetti_ball: Lottery | Time Remaining',
				info: 'Get the time left until the lottery round is over.',
				fn({client}) {
					let t = Lottery.get(client).timeRemaining;
					return 'The lottery round ends in: ' + md.bold(fmt.time(t));
				}
			},
			'winner': {
				aliases: ['last'],
				title: ':confetti_ball: Lottery | Winner',
				info: 'Get the winning number of the last lottery round.',
				fn({client}) {
					let wn = Lottery.get(client).last;
					return 'The winning number of the last lottery round is: ' + md.code(wn);
				}
			},
			'jackpot': {
				aliases: ['jp', 'total'],
				title: ':confetti_ball: Lottery | Jackpot',
				info: 'Check the current jackpot of the lottery.',
				fn({client, context, args}) {
					let jp = Lottery.get(client).jackpot;
					return 'The current jackpot is: ' + Bank.formatCredits(jp);
				}
			},
			'end': {
				aliases: ['finish'],
				title: ':confetti_ball: Lottery | End',
				info: 'End the lottery round before it is officially over.',
				permissions: 'private',
				suppress: true,
				fn({client}) {
					let lottoResults = Lottery.main(client, true);
					return 'The lottery round has ended manually. The winning number was: ' + md.code(lottoResults.last)
						+ '\nThere were ' + md.bold(fmt.plural('winner', lottoResults.winners.length)) + '.';
				}
			},
			'cancel': {
				aliases: ['forfeit'],
				title: ':confetti_ball: Lottery | Cancel',
				info: 'Cancel the current lottery and refund all participants. Specify whether to reset the jackpot or not.',
				parameters: ['[resetJackpot]'],
				permissions: 'private',
				suppress: true,
				fn({client, args}) {
					Lottery.cancel(client, args[0]);
					return 'The current lottery round has been reset and all tickets have been refunded.' + (args[0] ? ' Also, the jackpot has returned to its starting value.' : '');
				}
			},
			'custom': {
				aliases: ['override'],
				title: ':confetti_ball: Lottery | Custom Jackpot',
				info: 'Set a custom jackpot for the Lottery.',
				parameters: ['amount'],
				permissions: 'private',
				suppress: true,
				fn({client, args}) {
					return Lottery.modify(client, lotto => {
						lotto.jackpot = args[0];
						return 'Jackpot set to: ' + Bank.formatCredits(lotto.jackpot);
					});
				}
			}
		}
	}
};
