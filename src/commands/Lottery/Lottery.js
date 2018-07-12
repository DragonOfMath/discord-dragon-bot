const Bank     = require('../../Bank');
const Resource = require('../../Resource');
const {Markdown:md,Format:fmt,random} = require('../../Utils');

const LOTTERY_USER_TEMPLATE = {
	tickets: []
};

class LotteryAccount extends Resource {
	constructor(data) {
		super(LOTTERY_USER_TEMPLATE, data);
	}
	hasTicket(n) {
		return this.tickets.includes(n);
	}
	addTickets(count) {
		for (var i = 0; i < count; i++) {
			this.tickets.push(Lottery.random);
		}
	}
}

const LOTTERY_TEMPLATE = {
	jackpot: 10000,
	last: 0,
	next: nextLotteryTime,
	winners: [],
	tickets: 0
};

class Lottery extends Resource {
	constructor(data) {
		super(LOTTERY_TEMPLATE, data);
	}
	embed() {
		return {
			fields: [
				{
					name: 'Current Jackpot',
					value: Bank.formatCredits(this.jackpot),
					inline: true
				},
				{
					name: 'Tickets Purchased',
					value: this.tickets,
					inline: true
				},
				{
					name: 'Time Remaining',
					value: fmt.time(this.timeRemaining),
					inline: true
				},
				{
					name: 'Previous Winning Number',
					value: md.code(this.last),
					inline: true
				}
			]
		};
	}
	get timeRemaining() {
		let now = Date.now();
		//console.log(this.next,'-',now,'=',this.next-now);
		return this.next - now;
	}
	set timeRemaining(tr) {
		this.next = Date.now() + tr;
	}
	
	static get random() {
		return random(Lottery.TICKET_RANGE);
	}
	static get(client) {
		var DATA = client.database.get('client').get(client.id);
		return new Lottery(DATA.lottery);
	}
	static set(client, lotto) {
		client.database.get('client').modify(client.id, DATA => {
			DATA.lottery = lotto;
			return DATA;
		}).save();
	}
	static modify(client, fn) {
		var msg = '';
		client.database.get('client').modify(client.id, DATA => {
			DATA.lottery = new Lottery(DATA.lottery);
			msg = fn(DATA.lottery);
			return DATA;
		}).save();
		return msg;
	}
	static getUser(client, userID) {
		var DATA = client.database.get('users').get(userID);
		return new LotteryAccount(DATA.lottery);
	}
	static modifyUser(client, userID, fn) {
		var msg = '';
		client.database.get('users').modify(userID, DATA => {
			DATA.lottery = new LotteryAccount(DATA.lottery);
			var bank = Bank.get(client, userID);
			msg = fn(DATA.lottery, bank);
			return DATA;
		}).save();
		return msg;
	}
	static main(client, force) {
		let lotto = this.get(client);
		if (lotto.timeRemaining > 0 && !force) return;
		
		let jackpot = lotto.jackpot;
		let chosen  = Lottery.random;
		
		let winners = this.getUsersWithTicket(client, chosen);
		
		if (winners.length > 0) {
			// if there's more than one winner, split the jackpot evenly
			jackpot = Math.round(jackpot / winners.length);
			let message;
			for (let id of winners) {
				message = 'Congrats, ' + md.mention(id) + '!';
				if (winners.length > 1) {
					message += ' You and ' + fmt.plural('other', winners.length - 1) + ' won the Lottery together!';
				} else {
					message += ' You won the Lottery!';
				}
				message += '\nThe lucky number was ' + md.code(chosen) + '.';
				message += '\nJackpot reward: ' + Bank.formatCredits(jackpot);
				
				Bank.deposit(client, id, jackpot);
				client.send(id, message);
			}
			jackpot = Lottery.STARTING_JACKPOT;
		}
		
		this.purgeTickets(client);
		
		lotto.jackpot = jackpot;
		lotto.tickets = 0;
		lotto.last    = chosen;
		lotto.winners = winners;
		lotto.timeRemaining = Lottery.DURATION;
		this.set(client, lotto);
		
		return lotto;
	}
	static buyTickets(client, userID, tickets = 1) {
		if (isNaN(tickets) || tickets < 1) {
			throw 'Please specify that you are purchasing 1 or more tickets.';
		}
		
		return this.modifyUser(client, userID, (acct, bank) => {
			if (acct.tickets.length == Lottery.TICKET_LIMIT) {
				throw 'You cannot purchase anymore tickets!';
			}
			if (acct.tickets.length + tickets > Lottery.TICKET_LIMIT) {
				tickets = Lottery.TICKET_LIMIT - acct.tickets.length;
			}
			let cost = tickets * Lottery.TICKET_COST;
			if (bank.credits < cost) {
				throw 'You do not have enough credits to buy ' + fmt.plural('ticket', tickets) + '! (Cost: ' + Bank.formatCredits(cost) + ')';
			}
			bank.changeCredits(-cost);
			acct.addTickets(tickets);
			
			let addToJackpot = cost * Lottery.JACKPOT_MULTIPLIER;
			return this.modify(client, lotto => {
				lotto.jackpot += addToJackpot;
				lotto.tickets += tickets;
				
				return 'You have purchased ' + fmt.plural('ticket', tickets) + ' for ' + Bank.formatCredits(cost) + ', valid for ' + fmt.time(lotto.timeRemaining);
			});
		});
	}
	static getUserTickets(client, userID) {
		return this.getUser(client, userID).tickets;
	}
	static getUsersWithTicket(client, ticket) {
		return client.database.get('users').filter((id, user) => {
			return user.lottery && user.lottery.tickets.includes(ticket);
		});
	}
	static purgeTickets(client, refund = false) {
		var userTable = client.database.get('users');
		for (var userID in userTable) {
			var DATA = userTable.get(userID);
			if (DATA.lottery && DATA.lottery.tickets.length) {
				let acct = DATA.lottery = new LotteryAccount(DATA.lottery);
				if (refund) {
					let refundAmt = acct.tickets.length * Lottery.TICKET_COST;
					Bank._modify(client, userID, bank =>
						bank.changeCredits(refundAmt));
				}
				acct.tickets = [];
				userTable.set(userID, DATA);
			}
		}
		userTable.save();
	}
	static cancel(client, resetJackpot = false) {
		this.purgeTickets(client, true);
		this.modify(client, lotto => {
			if (resetJackpot) {
				lotto.jackpot = Lottery.STARTING_JACKPOT;
			}
			lotto.tickets = 0;
			lotto.last = 0;
			lotto.winners = [];
			lotto.next = nextLotteryTime();
		});
	}
}

Lottery.TICKET_COST  = 50;
Lottery.TICKET_LIMIT = 100;
Lottery.TICKET_RANGE = 10000;
Lottery.DURATION     = 12 * 60 * 60 * 1000;
Lottery.JACKPOT_MULTIPLIER = 1.5;
Lottery.STARTING_JACKPOT = LOTTERY_TEMPLATE.jackpot;

function nextLotteryTime(t) {
	return t || (Date.now() + Lottery.DURATION);
}

module.exports = Lottery;
