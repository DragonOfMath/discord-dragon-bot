const FileLogger = require('./FileLogger');
const Resource   = require('./Resource');
const {Markdown:md,Format:fmt,paginate} = require('./Utils');

const HEADER      = ':dragon::bank:Dragon Bank:tm:';
const CURRENCY    = ':dragon:$';
const ROUNDING    = 1;
const PAGINATION  = 20;

const DEFAULT_AMOUNT     = 1000;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

const INTEREST_RATE      = 0.05;
const INTEREST_COMPOUND  = 1;

const INVESTMENT_COST    = 250;
const INVESTMENT_MINIMUM = 1000;
const INVESTMENT_WAIT    = 1 * HOUR;
const INVESTMENT_TIME_SCALE = 1 * DAY;

const DAILY_PAYROLL      = 500;
const DAILY_WAIT         = 1 * DAY;

const STATE = {
	OPEN:   'open',
	BUSY:   'busy',
	CLOSED: 'closed',
	DEAD:   'dead'
};

const BANK_TEMPLATE = {
	state: STATE.OPEN,
	created: (x) => (x ? (typeof(x) === 'number' ? x : Date.parse(x)) : Date.now()),
	credits: DEFAULT_AMOUNT,
	authorized: false,
	investingSince: 0,
	dailyReceived: 0
};

class BankAccount extends Resource {
	/*
		created = timestamp of the creation of the account
		credits = amount of cash in the account
		status  = open, busy, closed, or dead
			open   = can add/remove cash at will
			busy   = investing, which restricts some usage
			closed = transferring cash is prohibited, but the account can still be used
			dead   = all usage of the account is prohibited
		investing  = time that investing started, or 0 if not investing
		authorized = has special privileges
	*/
	constructor(userID, acct) {
		if (typeof(acct) === 'object' && !acct.state) {
			// old bank data
			acct.state = acct.dead ? STATE.DEAD : 
			             acct.investing ? STATE.BUSY : 
						 acct.open ? STATE.OPEN : 
						 STATE.CLOSED;
			delete acct.open;
			delete acct.dead;
			delete acct.investing;
			acct.credits = Number(acct.credits);
		}
		super(BANK_TEMPLATE, acct);
		this.makeProp('id', userID);
	}
	create(amt = DEFAULT_AMOUNT) {
		if (this.exists) {
			throw 'Account is already created.';
		}
		
		super.create();
		
		this.record({action: 'created'});
		return 'Your account has been successfully created. To view your account, use ' + md.code('bank.summary');
	}
	get exists() {
		return !!this.created;
	}
	get open() {
		this.state == STATE.OPEN;
	}
	set open(x) {
		this.state = typeof(x) === 'boolean' && x ? STATE.OPEN : this.state;
	}
	get closed() {
		return this.state == STATE.CLOSED;
	}
	set closed(x) {
		this.state = typeof(x) === 'boolean' && x ? STATE.CLOSED : this.state;
	}
	get dead() {
		this.state == STATE.DEAD;
	}
	set dead(x) {
		this.state = typeof(x) === 'boolean' && x ? STATE.DEAD : this.state;
	}
	get investing() {
		return this.investingSince > 0;
	}
	set investing(x) {
		this.investingSince = typeof(x) === 'number' ? x : 0;
		if (this.investing) {
			this.state = STATE.BUSY;
		}
	}
	get filename() {
		return `${__dirname}/history/history_${this.id}.log`;
	}
	get history() {
		return FileLogger.read(this.filename).map(i => addProperty(i,'user',this.id));
	}
	record(data = {}) {
		FileLogger.write(this.filename, Object.assign(data, this));
		return md.mention(this.id) + ' Your account state has been preserved.';
	}
	recordCreditChange(type, amt) {
		let prev = this.credits;
		this.changeCredits(amt);
		return this.record({
			action: type,
			prev,
			transfer: amt
		});
	}
	changeCredits(amt) {
		if (typeof(amt) !== 'number') {
			amt = Number(amt);
		}
		let prev = this.credits;
		let next = prev + amt;
		if (next < 0) {
			throw `Insufficient funds for ${type} (${prev} -> ${next})`;
		}
		
		if (isNaN(next) || !isFinite(next)) {
			throw 'Expected balance is NaN or Infinity.';
		}
		
		next = Number(next.toFixed(ROUNDING));
		if (isNaN(next)) {
			throw `Expected balance after truncation is NaN. Prev=${prev} (${typeof(prev)}), Change=${amt} (${typeof(amt)}), New=${next} (${typeof(next)}). This should never happen!`;
		}
		return this.credits = next;
	}
	delete() {
		FileLogger.delete(this.filename);
		return 'Your history has been cleared.';
	}
	open() {
		if (this.closed || this.dead) {
			this.open = true;
			this.investing = 0;
			this.record({action: 'reopened'});
			return md.mention(this.id) + ' Your account has been reopened!';
		} else {
			return 'Account is already open.';
		}
	}
	close() {
		if (this.dead) {
			return 'Account is shut down.';
		}else if (this.closed) {
			return 'Account already closed.';
		} else {
			this.closed = true;
			this.investing = 0;
			this.record({action: 'closed'});
			return 'Your account has been closed. Transactions are no longer allowed, but it may still be used.';
		}
	}
	shutdown() {
		if (this.dead) {
			return 'Account is already shut down.';
		} else {
			this.dead = true;
			this.investing = 0;
			this.record({action: 'closed permanently'});
			return 'Your account has been shut down. Contact an admin if you wish to have it reopened.';
		}
	}
	authorize() {
		if (this.dead) {
			return 'Account is shut down.';
		} else {
			this.authorized = true;
			return 'Your account has been authorized.';
		}
	}
	unauthorize() {
		if (this.dead) {
			return 'Account is shut down.';
		} else {
			this.authorized = false;
			return 'Your account has been de-authorized.';
		}
	}
	checkBalance() {
		if (this.dead) {
			return 'Account is shut down.';
		} else {
			return md.mention(this.id) + ' You have ' + formatCredits(this.credits) + '.';
		}
	}
	deposit(amt = 0) {
		if (this.dead) {
			return 'Account is shut down.';
		} else if (this.closed) {
			return 'Account is currently closed.';
		} else {
			if (typeof(amt) !== 'number') {
				amt = Number(amt);;
			}
			if (isNaN(amt) || amt <= 0) {
				throw 'Invalid amount.';
			}
			this.recordCreditChange('deposit', amt);
			return 'Your account balance has received ' + formatCredits(amt) + '.';
		}
	}
	withdraw(amt = 0) {
		if (this.dead) {
			return 'Account is shut down.';
		} else if (this.closed) {
			return 'Account is currently closed.';
		} else {
			if (typeof(amt) !== 'number') {
				amt = Number(amt);
			}
			if (isNaN(amt) || amt <= 0) {
				throw 'Invalid amount.';
			}
			this.recordCreditChange('withdrawal', -amt);
			return 'Your account balance has been deducted by ' + formatCredits(amt) + '.';
		}
	}
	transfer(to, amt = 0) {
		if (this.dead) {
			return 'Account is shut down.';
		} else if (this.closed) {
			return 'Account is currently closed.';
		} else if (this.investing) {
			return 'Account is currently in an investment period. Transactions are forbidden during this time.';
		} else if (to.dead) {
			return 'Recipient account is shut down.';
		} else if (to.closed) {
			return 'Recipient account is currently closed';
		} else {
			if (typeof(amt) !== 'number') {
				amt = Number(amt);
			}
			if (isNaN(amt) || amt <= 0) {
				throw 'Invalid amount.';
			}
			this.recordCreditChange('transfer', -amt);
			to.recordCreditChange('transfer', amt);
			return md.mention(this.id) + ' has transferred ' + formatCredits(amt) + ' to ' + md.mention(to.id) + '.';
		}
	}
	startInvesting() {
		if (this.dead) {
			return 'Account is shut down.';
		} else if (this.closed) {
			return 'Account is currently closed.';
		} else if (this.investing) {
			return 'Account is already in an investment period.';
		} else {
			if (this.credits < INVESTMENT_MINIMUM) {
				return `Account does not meet the requirements to start investing (Balance must be at least ${formatCredits(INVESTMENT_MINIMUM)}).`;
			}
			
			this.investing = Date.now();
			this.recordCreditChange('investing started', -INVESTMENT_COST);
			return `You have paid ${formatCredits(INVESTMENT_COST)} to invest. Your account will be locked for a minimum of ${formatTime(INVESTMENT_WAIT)}, and you cannot make transactions. However, your account will earn interest over time, which you can monitor with ${md.code('bank.invest check')}.`;
		}
	}
	stopInvesting() {
		if (this.dead) {
			return 'Account is shut down.';
		} else if (this.closed) {
			return 'Account is currently closed.';
		} else if (!this.investing) {
			return 'Account is not in an investment period.';
		} else {
			var timeElapsed = Date.now() - this.investingSince;
			var timeRemaining = INVESTMENT_WAIT - timeElapsed;
			if (timeRemaining > 0) {
				return 'Account may not be reopened for another ' + formatTime(timeRemaining) + '.';
			}
			
			var interestEarned = interest(this.credits, timeElapsed/INVESTMENT_TIME_SCALE);
			interestEarned = Number(interestEarned.toFixed(ROUNDING));
			
			this.open = true;
			this.investing = 0;
			this.recordCreditChange('investing stopped', interestEarned);
			
			return this.generateInvestmentTranscript('Investment Summary', timeElapsed, interestEarned);
		}
	}
	generateAccountSummary() {
		return {
			description: 'For the account of ' + md.mention(this.id),
			fields: [
				{
					name: 'Balance',
					value: formatCredits(this.credits)
				},
				{
					name: 'State',
					value: this.investing ? 'Investing' : this.open ? 'Open' : this.dead ? 'Closed Indefinitely' : 'Closed'
				}
			]
		};
	}
	generateInvestmentTranscript(title = 'Investment Transcript', timeElapsed, interestEarned) {
		if (this.dead) {
			return 'Account is shut down.';
		} else if (this.closed) {
			return 'Account is currently closed.';
		} else {
			if (typeof(interestEarned) !== 'number') {
				interestEarned = Number(interestEarned.toFixed(ROUNDING));
			}
			var netGain = interestEarned - INVESTMENT_COST;
			var timeToUnlock = INVESTMENT_WAIT - timeElapsed;
			return {
				title,
				description: 'For the account of ' + md.mention(this.id),
				fields: [
					{
						name: 'Time Elapsed',
						value: fmt.timestamp(timeElapsed) + (timeToUnlock > 0 ? ` (Unlocks in ${fmt.timestamp(timeToUnlock)})` : ''),
						inline: true
					},
					{
						name: 'Interest Earned',
						value: formatCredits(interestEarned) + ' at ' + fmt.percent(INTEREST_RATE) + ' (daily)',
						inline: true
					},
					{
						name: 'Net Gain',
						value: `Interest - Cost (${INVESTMENT_COST}) = ${formatCredits(netGain)}`,
						inline: true
					}
				]
			};
		}
	}
	generateHistoryTranscript(page = 1) {
		return generateHistoryTranscript(this.history, page);
	}
	addDaily() {
		if (this.dead) {
			return 'Account is shut down.';
		} else if (this.closed) {
			return 'Account is currently closed.';
		} else if (this.investing) {
			return 'Account is currently investing. Daily cash cannot be received during this time.';
		} else {
			var now = Date.now();
			var timeElapsed   = now - this.dailyReceived;
			var timeRemaining = DAILY_WAIT - timeElapsed;
			if (timeRemaining > 0) {
				throw `Wait ${formatTime(timeRemaining)} before receiving your daily money!`;
			}
			
			this.dailyReceived = now;
			this.recordCreditChange('daily', DAILY_PAYROLL)
			return ' You received your daily ' + formatCredits(DAILY_PAYROLL) + '.';
		}
	}
}

class Bank {
	static get header() {
		return HEADER;
	}
	static get currency() {
		return CURRENCY;
	}
	static get rounding() {
		return ROUNDING;
	}
	static get startingAmount() {
		return DEFAULT_AMOUNT;
	}
	static get interestRate() {
		return INTEREST_RATE;
	}
	static get interestCompounding() {
		return INTEREST_COMPOUND;
	}
	static get investmentCost() {
		return INVESTMENT_COST;
	}
	static get investmentMinimum() {
		return INVESTMENT_MINIMUM;
	}
	static get investmentWait() {
		return INVESTMENT_WAIT;
	}
	static get investmentTimeScale() {
		return INVESTMENT_TIME_SCALE;
	}
	static get historyPagination() {
		return PAGINATION;
	}
	static get dailyPayroll() {
		return DAILY_PAYROLL;
	}
	static get dailyWait() {
		return DAILY_WAIT;
	}
	static formatCredits(c) {
		return formatCredits(c);
	}
	static formatTime(t) {
		return formatTime(t);
	}
	static get(client, userID) {
		if (!client.users[userID]) {
			throw `Invalid user: \`${userID}\``;
		}
		var user = client.database.get('users').get(userID);
		user.bank = new BankAccount(userID, user.bank);
		return user.bank;
	}
	static set(client, userID, acct) {
		if (!client.users[userID]) {
			throw `Invalid user: \`${userID}\``;
		}
		var user = client.database.get('users').get(userID);
		user.bank = acct;
		return this;
	}
	static modify(client, userID, fn) {
		if (!client.users[userID]) {
			throw `Invalid user: \`${userID}\``;
		}
		var message = '';
		client.database.get('users').modify(userID, user => {
			user.bank = new BankAccount(userID, user.bank);
			message = fn(user.bank, user);
			return user;
		}).save();
		return typeof(message) === 'string' ? `${md.mention(userID)} ${message}` : message;
	}
	static save(client) {
		client.database.get('users').save();
		return this;
	}
	static getBalance(client, userID) {
		return this.get(client, userID).checkBalance();
	}
	static open(client, userID) {
		return this.modify(client, userID, bank => bank.create());
	}
	static close(client, userID) {
		return this.modify(client, userID, bank => bank.shutdown());
	}
	static reopen(client, userID) {
		return this.modify(client, userID, bank => bank.open());
	}
	static delete(client, userID) {
		var table = client.database.get('users');
		var user = table.get(userID);
		user.bank = new BankAccount(userID, user.bank);
		user.bank.delete(); // deletes the history log file
		delete user.bank;   // deletes the bank account object from the record
		table.save();   // updates the record on file
		return md.mention(userID) + ' Your account has been deleted.';
	}
	static deposit(client, userID, amount = 0) {
		return this.modify(client, userID, bank => bank.deposit(amount));
	}
	static withdraw(client, userID, amount = 0) {
		return this.modify(client, userID, bank => bank.withdraw(amount));
	}
	static transfer(client, fromUserID, toUserID, amount) {
		var src = this.get(client, fromUserID);
		var tgt = this.get(client, toUserID);
		
		var message = src.transfer(tgt, amount);
		
		this.set(client, fromUserID, src).set(client, toUserID, tgt).save(client);
		
		return message;
	}
	static invest(client, userID, option) {
		var response = null;
		return this.modify(client, userID, bank => {
			switch (option.toLowerCase()) {
				case 'check':
					if (!bank.investing) {
						return 'Account is not investing.';
					}
					var timeElapsed    = Date.now() - bank.investingSince;
					var interestEarned = interest(bank.credits, timeElapsed/INVESTMENT_TIME_SCALE);
					return bank.generateInvestmentTranscript('Investment Progress', timeElapsed, interestEarned);
				case 'start':
					return bank.startInvesting();
				case 'stop':
					return bank.stopInvesting();
				default:
					return {
						title: `Help`,
						description: `For all intended purposes, the current interest rate is ${md.bold(fmt.percent(INTEREST_RATE))}, compounded ${md.bold(INTEREST_COMPOUND + ' time(s) per day')}, and the cost to start investing is ${formatCredits(INVESTMENT_COST)} while your balance is at least ${formatCredits(INVESTMENT_MINIMUM)}.`,
						fields: [
							{
								name: 'Starting an Investment',
								value: 'To start investing, use ' + md.code(client.PREFIX + 'bank.invest start') + '. The cost to start investing will be paid, and for the duration of the investment, you cannot transfer credits or receive a daily payroll. You will also be unable to unlock your account until at least an hour has passed. ' + md.bold('Should you choose to forcibly ' + md.code('reopen') + ' your account, your investment will be terminated without any earned interest.')
							},
							{
								name: 'While Investing',
								value: 'To check on your investing, use ' + md.code(client.PREFIX + 'bank.invest check') + '. The total time that has elapsed since you started will be shown, along with the estimated interest and net gain you will earn. The formula used for calculating interest is A = Pe^(rt)'
							},
							{
								name: 'Stopping an Investment',
								value: 'To stop investing, use ' + md.code(client.PREFIX + 'bank.invest stop') + '. If at least an hour has passed, investing will cease, and the earned interest will be calculated and added to your account balance. You will then be able to transfer credits and receive daily payroll again.'
							}
						]
					};
			}
		})
	}
	static daily(client, userID) {
		return this.modify(client, userID, bank => bank.addDaily());
	}
	static summary(client, userID) {
		return this.get(client, userID).generateAccountSummary();
	}
	static history(client, userID, page) {
		return this.get(client, userID).generateHistoryTranscript(page);
	}
	static purgeHistory(client, userID) {
		return this.modify(client, userID, bank => bank.delete());
	}
	static pushHistory(client, userID) {
		return this.get(client, userID).record();
	}
	static revertToHistory(client, userID, histID) {
		var acct = this.get(client, userID);
		var r = acct.history.find(h => h.t == histID);
		if (r) {
			acct.init(r.data);
			Bank.set(client, userID, acct).save(client);
			return md.mention(userID) + ' Your account has been reverted to data from ' + r.timestamp;
		} else {
			return `There is no entry with the ID ${histID} in the history log for that user.`;
		}
	}
	static ledger(client, server, userID, page) {
		var users = getUsersOfThisServer(client, server);
		var globalHistory = [];
		for (var u of users) {
			try {
				globalHistory = globalHistory.concat(u.history);
			} catch (e) {
				console.error(`Could not read history of user ${u.id}: ${e}`);
			}
		}
		return generateHistoryTranscript(globalHistory, page);
		
		/* Legacy code, do not use.
		try {
			var filenames = users.map(u => u.filename);
			return FilePromise.readAll(filenames, false)
			.catch(err => {
				// Not all files could be read, so try reading each one sequentially
				let filesRead = {}
				function read(f,i) {
					return FilePromise.read(f[i], false)
					.then(file => {filesRead[f[i]] = file;console.log('File read:',f[i])})
					.catch(err => {console.log('File skipped:',f[i])})
					.then(() => {
						if (i < f.length - 1) {
							return read(f, i+1)
						} else {
							return filesRead
						}
					})
				}
				return read(filenames,0)
			})
			.then(files => {
				let history = []
				for (let user of users) {
					let uhist = files[user.filename]
					if (!uhist) continue;
					uhist = uhist.split('\n').filter(Boolean).map(JSON.parse).map(item => addProperty(item,'user',user.id))
					history = history.concat(uhist)
				}
				return history
			})
			.then(history => generateHistoryTranscript(history, page))
		} catch (e) {
			console.error(e);
		}
		*/
	}
	static leaderboard(client, server, page) {
		try {
			var users = getUsersOfThisServer(client, server);
			return generateLeaderboard(client, server, users, page);
		} catch (e) {
			console.error(e);
		}
	}
	static auth(client, userID) {
		return this.modify(client, userID, bank => bank.authorize());
	}
	static unauth(client, userID) {
		if (userID == client.ownerID) {
			throw md.mention(userID) + ' cannot be unauthorized!';
		}
		return this.modify(client, userID, bank => bank.unauthorize());
	}
	static checkAuth(client, userID) {
		return this.get(client, userID).authorized;
	}
}

/* Additional Utilities */

function formatCredits(c) {
	return md.bold(fmt.currency(c,CURRENCY,ROUNDING));
}
function formatTime(t) {
	return md.bold(fmt.time(t));
}
function interest(principle, time) {
	var formula = 0 ? linearInterest : compoundInterest;
	return formula(principle, INTEREST_RATE, INTEREST_COMPOUND, time);
}
function linearInterest(principle, rate, compounds, time) {
	return principle * (rate * compounds * time - 1);
}
function compoundInterest(principle, rate, compounds, time) {
	return principle * (Math.pow((1 + rate / compounds), compounds * time) - 1);
}
function continuousInterest(principle, rate, time) {
	return principle * (Math.exp(rate * time) - 1);
}
function getUsersOfThisServer(client, server) {
	var userTable = client.database.get('users');
	return userTable.filter(u => server.members[u] && userTable.get(u).bank).map(u => new BankAccount(u, userTable.get(u).bank));
}
function generateHistoryTranscript(history = [], page = 1) {
	history = history.sort((a,b) => a.t > b.t ? -1 : a.t < b.t ? 1 : 0);

	return paginate(history, page, PAGINATION, function (h, i) {
		return {
			name: `ID: ${h[i].t} | ${h[i].timestamp}`,
			value: md.mention(h[i].user) + ': ' + h[i].toDataString()
		};
	});
}
function generateLeaderboard(client, server, users, page = 1) {
	// sort users by credits
	users = users.sort((a,b) => {
		if (a.credits < b.credits) return 1;
		if (a.credits > b.credits) return -1;
		return 0;
	});
	
	return paginate(users, page, PAGINATION, function (u, i) {
		var id = u[i].id;
		return {
			name: `#${i+1} | ${server.members[id].nick || client.users[id].username}`,
			value: formatCredits(u[i].credits),
			inline: true
		};
	});
}
function addProperty(obj, prop, val) {
	obj[prop] = val;
	return obj;
}

module.exports = Bank;