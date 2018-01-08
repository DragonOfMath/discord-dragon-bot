const FilePromise = require('./FilePromise');
const {Markdown:md,Format:fmt,paginate} = require('./Utils');

const HEADER      = ':dragon::bank:Dragon Bank:tm:'
const CURRENCY    = ':dragon:$'
const ROUNDING    = 1
const PAGINATION  = 25

const DEFAULT_AMOUNT     = 1000

const INTEREST_RATE      = 0.02
const INTEREST_COMPOUND  = 1

const INVESTMENT_COST    = 250
const INVESTMENT_MINIMUM = 1000
const INVESTMENT_WAIT    = 60 * 60 * 1000

const DAILY_PAYROLL      = 500
const DAILY_WAIT         = 24 * 60 * 60 * 1000

class BankAccount {
	/*
		created = timestamp of the creation of the account
		credits = amount of cash in the account
		open    = can add/remove cash
		dead    = can use bank commands
		investing = is in an investment period
		investingSince = time that investing started
		authorized = has special privileges
	*/
	constructor(userID, acct) {
		Object.defineProperty(this, 'id', {
			value: userID,
			enumerable: false
		})
		if (typeof(acct) === 'object') {
			this.created = acct.created
			this.credits = Number(acct.credits)
			this.open    = acct.open || false
			this.dead    = acct.dead || false
			this.investing = acct.investing || false
			this.investingSince = acct.investingSince || 0
			this.authorized = acct.authorized || false
			this.dailyReceived = acct.dailyReceived || 0
		} else {
			this.create()
		}
	}
	get exists() {
		return !!this.created
	}
	get filename() {
		return `${__dirname}/history/history_${this.id}.log`
	}
	create(amt = DEFAULT_AMOUNT) {
		if (this.exists) {
			throw 'Account is already created.'
		}
		
		this.created        = timestamp()
		this.credits        = amt
		this.open           = true
		this.dead           = false
		this.investing      = false
		this.investingSince = 0
		
		return this.record({action: 'created', balance: amt})
	}
	readHistory() {
		return FilePromise.read(this.filename, false)
		.then(history => history.split('\n').filter(Boolean).map(JSON.parse).map(h => addProperty(h,'user',this.id)))
	}
	record(data = {}) {
		let h = {
			time: timestamp(),
			t: milliseconds(),
			data
		}
		return FilePromise.appendSync(this.filename, JSON.stringify(h) + '\n')
	}
	recordCreditChange(type, amt) {
		if (typeof(amt) !== 'number') {
			amt = Number(amt)
		}
		let prev = this.credits
		let next = prev + amt
		if (next < 0) {
			throw `Insufficient funds for ${type} (${prev} -> ${next})`
		}
		// the a3person phenomenon
		if (isNaN(next) || !isFinite(next)) {
			throw 'Congrats. You crashed the bank.'
		}
		
		prev = Number(prev.toFixed(ROUNDING))
		next = Number(next.toFixed(ROUNDING))
		if (typeof(next) !== 'number') {
			console.error(typeof(prev),typeof(amt),typeof(next))
			throw `Problem with the credits becoming a non-number (this should never happen!). Prev=${prev} (${typeof(prev)}), Change=${amt} (${typeof(amt)}), New=${next} (${typeof(next)}). Go fix it, Math.`
		}
		this.credits = next
		return this.record({
			action: type,
			prev,
			transfer: amt,
			next
		})
	}
	open() {
		if (this.open) throw 'Account is already open.'
		
		this.open = true
		this.dead = false
		this.investing = false
		this.investingSince = 0
		return this.record({action: 'reopened'})
	}
	close(permanent = false) {
		if (!this.open && this.dead == permanent) throw 'Account already closed.'
		
		this.open = false
		if (permanent) {
			this.investing = false // shut down investing
			this.investingSince = 0
			this.dead = true
			return this.record({action: 'closed permanently'})
		} else {
			return this.record({action: 'closed'})
		}
	}
	delete() {
		return FilePromise.deleteSync(this.filename)
	}
	authorize() {
		if (this.dead)    throw 'Account is closed indefinitely.'
		this.authorized = true
	}
	unauthorize() {
		if (this.dead)    throw 'Account is closed indefinitely.'
		this.authorized = false
	}
	deposit(amt = 0) {
		if (this.dead)    throw 'Account is closed indefinitely.'
		if (!this.open)   throw 'Account is currently closed.'
		if (typeof(amt) !== 'number') {
			amt = Number(amt)
		}
		if (isNaN(amt) || amt <= 0) {
			throw 'Invalid amount.'
		}
		return this.recordCreditChange('deposit', amt)
	}
	withdraw(amt = 0) {
		if (this.dead)    throw 'Account is closed indefinitely.'
		if (!this.open)   throw 'Account is currently closed.'
		if (typeof(amt) !== 'number') {
			amt = Number(amt)
		}
		if (isNaN(amt) || amt <= 0) {
			throw 'Invalid amount.'
		}
		return this.recordCreditChange('withdrawal', -amt)
	}
	transfer(to, amt = 0) {
		if (this.dead)    throw 'Account is closed indefinitely.'
		if (!this.open)   throw 'Account is currently closed.'
		if (this.investing) throw 'Account is currently in an investment period. Transactions are forbidden during this time.'
		if (to.dead)      throw 'Recipient account is closed indefinitely.'
		if (to.closed)    throw 'Recipient account is currently closed.'
		if (typeof(amt) !== 'number') {
			amt = Number(amt)
		}
		if (isNaN(amt) || amt <= 0) {
			throw 'Invalid amount.'
		}
		return this.recordCreditChange('transfer', -amt)
		.then(() => to.recordCreditChange('transfer', amt)) 
	}
	startInvesting() {
		if (this.dead)      throw 'Account is closed indefinitely.'
		if (!this.open)     throw 'Account is currently closed.'
		if (this.investing) throw 'Account is already in an investment period.'
		
		if (this.credits < INVESTMENT_MINIMUM) {
			throw `Account does not meet the requirements to start investing (Balance must be at least ${formatCredits(INVESTMENT_MINIMUM)}).`
		}
		
		this.investingSince = milliseconds()
		this.investing = true
		
		return this.recordCreditChange('investing started', -INVESTMENT_COST).then(() => {
			return `You have paid ${formatCredits(INVESTMENT_COST)} to invest. Your account will be locked for a minimum of 1 hour, and you cannot make transactions. However, your account will earn interest over time, which you can monitor with ${md.code('bank.invest check')}.`
		})
	}
	stopInvesting() {
		if (this.dead)       throw 'Account is closed indefinitely.'
		if (!this.investing) throw 'Account is not in an investment period.'
		
		let timeElapsed = milliseconds() - this.investingSince
		let timeRemaining = INVESTMENT_WAIT - timeElapsed
		if (timeRemaining > 0) {
			throw 'Account may not be reopened for another ' + formatTime(timeRemaining) + '.'
		}
		
		let interestEarned = compoundInterest(this.credits, INTEREST_RATE, INTEREST_COMPOUND, timeElapsed/INVESTMENT_WAIT)
		interestEarned = Number(interestEarned.toFixed(ROUNDING))
		
		this.investingSince = 0
		this.investing = false
		
		return this.recordCreditChange('investing stopped', interestEarned)
		.then(() => this.generateInvestmentTranscript('Investment Summary', timeElapsed, interestEarned))
	}
	generateAccountSummary() {
		return {
			description: 'ID: '        + md.bold(this.id) +
			           '\nBalance: '   + formatCredits(this.credits) + 
					   '\nCurrently: ' + md.bold(this.investing?'Investing':this.open?'Open':this.dead?'Closed Indefinitely':'Closed')
		}
	}
	generateInvestmentTranscript(title = 'Investment Transcript', timeElapsed, interestEarned) {
		if (this.dead)       throw 'Account is closed indefinitely.'
		
		if (typeof(interestEarned) !== 'number') {
			interestEarned = Number(interestEarned.toFixed(ROUNDING))
		}
		let netGain = interestEarned - INVESTMENT_COST
		let timeToUnlock = INVESTMENT_WAIT - timeElapsed
		return {
			title,
			fields: [
				{
					name: 'Time Elapsed',
					value: fmt.timestamp(timeElapsed) + (timeToUnlock > 0 ? ` (Unlocks in ${fmt.timestamp(timeToUnlock)})` : ''),
					inline: true
				},
				{
					name: 'Interest Earned',
					value: formatCredits(interestEarned) + ' at ' + fmt.percent(INTEREST_RATE) + ' (hourly)',
					inline: true
				},
				{
					name: 'Net Gain',
					value: `Interest - Cost (${INVESTMENT_COST}) = ${formatCredits(netGain)}`,
					inline: true
				}
			]
		}
	}
	generateHistoryTranscript(page = 1) {
		if (typeof(page) !== 'number') {
			page = Number(page)
		}
		if (isNaN(page) || page < 0) {
			page = 1
		}
		return this.readHistory()
		.then(history => generateHistoryTranscript(history, page))
	}
	addDaily() {
		if (this.dead)      throw 'Account is closed indefinitely.'
		if (!this.open)     throw 'Account is currently closed.'
		if (this.investing) throw 'Account is currently investing. Daily cash cannot be received during this time.'
		
		let now = milliseconds()
		let timeElapsed   = now - this.dailyReceived
		let timeRemaining = DAILY_WAIT - timeElapsed
		if (timeRemaining > 0) {
			throw `Wait ${formatTime(timeRemaining)} before receiving your daily money!`
		}
		
		this.dailyReceived = now
		return this.recordCreditChange('daily', DAILY_PAYROLL)
	}
}

class Bank {
	static get header() {
		return HEADER
	}
	static get currency() {
		return CURRENCY
	}
	static get rounding() {
		return ROUNDING
	}
	static get startingAmount() {
		return DEFAULT_AMOUNT
	}
	static get interestRate() {
		return INTEREST_RATE
	}
	static get interestCompounding() {
		return INTEREST_COMPOUND
	}
	static get investmentCost() {
		return INVESTMENT_COST
	}
	static get investmentMinimum() {
		return INVESTMENT_MINIMUM
	}
	static get investmentWait() {
		return INVESTMENT_WAIT
	}
	static get historyPagination() {
		return PAGINATION
	}
	static get dailyPayroll() {
		return DAILY_PAYROLL
	}
	static get dailyWait() {
		return DAILY_WAIT
	}
	static formatCredits(c) {
		return formatCredits(c)
	}
	static formatTime(t) {
		return formatTime(t)
	}
	static get(client, userID) {
		if (!client.users[userID]) {
			throw `Invalid user: \`${userID}\``
		}
		let user = client.database.get('users').get(userID)
		user.bank = new BankAccount(userID, user.bank)
		return user.bank
	}
	static set(client, userID, acct) {
		let user = client.database.get('users').get(userID)
		user.bank = acct
		return this
	}
	static modify(client, userID, fn) {
		if (!client.users[userID]) {
			throw `Invalid user: \`${userID}\``
		}
		let message = ''
		client.database.get('users').modify(userID, user => {
			user.bank = new BankAccount(userID, user.bank)
			message = fn(user.bank, user)
			return user
		}).save()
		return typeof(message) === 'string' ? `${md.mention(userID)} ${message}` : message
	}
	static save(client) {
		client.database.get('users').save()
		return this
	}
	static getBalance(client, userID) {
		let user = this.get(client, userID)
		return `${md.mention(userID)} You have ${formatCredits(user.credits)}.`
	}
	static open(client, userID) {
		this.modify(client, userID, bank => bank.create(DEFAULT_AMOUNT))
		return md.mention(userID) + ' Your account has been successfully created. To view your account, use ' + md.code('bank.summary')
	}
	static close(client, userID) {
		this.modify(client, userID, bank => bank.close(true))
		return md.mention(userID) + ' Your account has been closed indefinitely. Contact an admin if you wish to have it reopened.'
	}
	static reopen(client, userID) {
		this.modify(client, userID, bank => bank.open(DEFAULT_AMOUNT))
		return md.mention(userID) + ' Your account has been reopened!'
	}
	static delete(client, userID) {
		let table = client.database.get('users')
		let user = table.get(userID)
		user.bank = new BankAccount(userID, user.bank)
		user.bank.delete() // deletes the history log file
		delete user.bank   // deletes the bank account object from the record
		table.save()   // updates the record on file
		return md.mention(userID) + ' Your account has been deleted.'
	}
	static deposit(client, userID, amount = 0) {
		this.modify(client, userID, bank => bank.deposit(amount))
		return md.mention(userID) + ' Your account balance has received ' + formatCredits(amount) + '.'
	}
	static withdraw(client, userID, amount = 0) {
		this.modify(client, userID, bank => bank.withdraw(amount))
		return md.mention(userID) + ' Your account balance has been deducted by ' + formatCredits(amount) + '.'
	}
	static transfer(client, fromUserID, toUserID, amount) {
		let src = this.get(client, fromUserID)
		let tgt = this.get(client, toUserID)
		
		src.transfer(tgt, amount)
		
		this.set(client, fromUserID, src)
		this.set(client, toUserID, tgt)
		this.save(client)
		
		return md.mention(fromUserID) + ' has transferred ' + formatCredits(amount) + ' to ' + md.mention(toUserID) + '.'
	}
	static invest(client, userID, option) {
		let response = null
		return this.modify(client, userID, bank => {
			switch (option.toLowerCase()) {
				case 'check':
					if (!bank.investing) {
						throw 'Account is not investing.'
					}
					let timeElapsed    = milliseconds() - bank.investingSince
					let interestEarned = compoundInterest(bank.credits, INTEREST_RATE, INTEREST_COMPOUND, timeElapsed/INVESTMENT_WAIT)
					return bank.generateInvestmentTranscript('Investment Progress', timeElapsed, interestEarned)
				case 'start':
					return bank.startInvesting()
				case 'stop':
					return bank.stopInvesting()
				default:
					return {
						title: `Help`,
						description: `For all intended purposes, the current interest rate is ${md.bold(fmt.percent(INTEREST_RATE))}, compounded ${md.bold(INTEREST_COMPOUND + ' time(s) per hour')}, and the cost to start investing is ${formatCredits(INVESTMENT_COST)} while your balance is at least ${formatCredits(INVESTMENT_MINIMUM)}.`,
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
					}
			}
		})
	}
	static daily(client, userID) {
		this.modify(client, userID, bank => bank.addDaily())
		return md.mention(userID) + ' You received your daily ' + formatCredits(DAILY_PAYROLL) + '.'
	}
	static summary(client, userID) {
		return this.get(client, userID).generateAccountSummary()
	}
	static history(client, userID, page) {
		return this.get(client, userID).generateHistoryTranscript(page)
	}
	static purgeHistory(client, userID) {
		this.modify(client, userID, bank => bank.delete())
		return `${md.mention(userID)} your history has been cleared.`
	}
	static ledger(client, server, userID, page) {
		try {
			if (typeof(page) !== 'number') {
				page = Number(page)
			}
			if (isNaN(page) || page < 0) {
				page = 1
			}
			
			let userTable = client.database.get('users')
			let users = userTable.filter(u => !!server.members[u] && !!userTable.get(u).bank).map(u => new BankAccount(u, userTable.get(u).bank))
			let filenames = users.map(u => u.filename)
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
			console.error(e)
		}
	}
	static auth(client, userID) {
		this.modify(client, userID, bank => bank.authorize())
		return md.mention(userID) + ' you have been authorized.'
	}
	static unauth(client, userID) {
		if (userID == client.ownerID) {
			throw md.mention(userID) + ' cannot be unauthorized!'
		}
		this.modify(client, userID, bank => bank.unauthorize())
		return md.mention(userID) + ' you have been unauthorized.'
	}
	static checkAuth(client, userID) {
		return this.get(client, userID).authorized
	}
}

/* Additional Utilities */

function formatCredits(c) {
	return md.bold(fmt.currency(c,CURRENCY,ROUNDING));
}
function formatTime(t) {
	return md.bold(fmt.time(t));
}
function timestamp() {
	return new Date().toLocaleString();
}
function milliseconds() {
	return Date.now();
}
function hoursElapsed(time) {
	return (milliseconds() - time) / INVESTMENT_WAIT;
}
function compoundInterest(principle, rate, compounds, time) {
	return principle * (Math.pow((1 + rate / compounds), compounds * time) - 1);
}
function continuousInterest(principle, rate, time) {
	return principle * (Math.exp(rate * time) - 1);
}
function generateHistoryTranscript(history = [], page = 1) {
	history = history.sort((a,b) => a.t > b.t ? -1 : a.t < b.t ? 1 : 0);

	return paginate(history, page, PAGINATION, function (h, i) {
		return {
			name: 'ID: ' + h[i].t,
			value: md.mention(h[i].user) + ': ' + Object.keys(h[i].data).map(k => `${k}: ${h[i].data[k]}`).join(', ')
		};
	});
}
function addProperty(obj, prop, val) {
	obj[prop] = val;
	return obj;
}

module.exports = Bank;