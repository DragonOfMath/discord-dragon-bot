const Investment = require('./Investment');
const BankError  = require('./BankError');
const Constants  = require('../Constants/Bank').Account;
const Resource   = require('../Structures/Resource');
const FileLogger = require('../Debugging/FileLogger');
const {Format:fmt} = require('../Utils');

/**
 * @class BankAccount
 * @extends Resource
 * Represents a user's virtual account for the Dragon Bank:tm:.
 * Methods here are for purely account-specific actions, and should not resort to using the Bank.
*/
class BankAccount extends Resource {
	/**
	 * BankAccount constructor
	 * @param {Snowflake}          userID             - the owner ID of the account
	 * @param {Object}             acct               - RESTful account data
	 * @param {Number|String|Date} acct.created       - timestamp of the creation of the account
	 * @param {Number}             acct.created       - number of credits in the account
	 * @param {Boolean}            acct.authorized    - whether the account is authorized for special purposes
	 * @param {Number}             acct.state         - current state of the account (See Constants.Bank.Account.STATE)
	 * @param {Array<Object>}      [acct.investments] - any investments the account is going through
	 */
	constructor(userID, acct) {
		if (!userID) {
			throw new BankError('Bank Account requires a User ID');
		}
		if (typeof(acct) === 'object' && !acct.state) {
			// old bank data
			acct.state = acct.dead ? Constants.STATE.DEAD : 
			             acct.investing ? Constants.STATE.BUSY : 
						 (acct.open || acct.open === undefined) ? Constants.STATE.OPEN : 
						 Constants.STATE.CLOSED;
			delete acct.open;
			delete acct.dead;
			delete acct.investing;
			acct.credits = Number(acct.credits);
		}
		super(Constants.TEMPLATE, acct);
		if (isNaN(this.credits)) {
			this.credits = 1000;
		}
		
		this.makeProp('id', userID);

		// create a file logger for this account's history
		this.makeProp('file', new FileLogger(`${__dirname}/history/history_${userID}.log`));

		// restore investments
		this.investments = this.investments.map(i => (i instanceof Investment ? i : new Investment(i)));
	}
	toString() {
		return '[BankAccount <@' + this.id + '>]';
	}
	/**
	 * Status: Open
	 * The account is free to receive/send credits, start investments, and add dailies.
	 */
	get open() {
		this.state == Constants.STATE.OPEN;
	}
	/**
	 * Status: Closed
	 * The account may not receive/send credits, start investments, or add dailies.
	 * However, it is still useful.
	 */
	get closed() {
		return this.state == Constants.STATE.CLOSED;
	}
	/**
	 * Status: Dead
	 * Account is permanently locked, may not be reopened, transferred, etc.
	 */
	get dead() {
		return this.state == Constants.STATE.DEAD;
	}
	/**
	 * Status: Busy
	 * ??? I don't know what this is for yet.
	 */
	get busy() {
		return this.state == Constants.STATE.BUSY;
	}
	/**
	 * Status: Investing
	 * Whether the account has active investments.
	 */
	get investing() {
		return this.investments.length > 0;
	}
	/**
	 * Get Account History
	 * Retrieve information from the account's history logs.
	 */
	history() {
		try {
			return this.file.read()
			.then(history => {
				return history.map(i => {
					i.user = this.id;
					return i;
				});
			})
			.catch(e => []);
		} catch (e) {
			return Promise.resolve([]);
		}
	}
	/**
	 * Delete Account History
	 * Deletes the account's history logs.
	 * This is more for testing purposes and will be deprecated later.
	 */
	deleteHistory() {
		return this.file.delete();
	}
	/**
	 * Write an entry to the account's history logs.
	 * @param {Object} [data] - optional data to write along with the account's details
	 */
	record(data = {}) {
		return this.file.write(Object.assign(data, this));
	}
	/**
	 * Change the account's credits and record this change.
	 * @param {String} info   - the context information about the change, e.g. a deposit
	 * @param {Number} amount - the amount to add or remove
	 */
	recordCreditChange(info, amount) {
		let prev = this.credits;
		this.changeCredits(amount);
		return this.record({
			action: info,
			prev,
			transfer: amount
		});
	}
	/**
	 * Safely change the account's credits, or throw an error.
	 * @param {Number} amount - the amount to add or remove
	 */
	changeCredits(amount) {
		amount   = Number(amount);
		let prev = Number(this.credits);
		let next = Number(prev + amount);
		if (isNaN(next) || !isFinite(next)) {
			throw new BankError(`New balance is ${next}! Previous was ${prev}, Change was ${amount}.`);
		}
		if (next < 0) {
			throw new BankError(`Insufficient funds: (${prev} -> ${next})`);
		}
		return this.credits = next;
	}
	/**
	 * Re-open the account for normal use again.
	 */
	openAccount() {
		if (this.closed || this.dead) {
			this.state = Constants.STATE.OPEN;
			return this.record({action: 'reopened'});
		} else {
			throw new BankError('Account is already open');
		}
	}
	/**
	 * Close the account, temporarily preventing use.
	 */
	closeAccount() {
		if (this.dead) {
			throw new BankError('Account is shut down');
		}else if (this.closed) {
			throw new BankError('Account already closed');
		} else {
			this.state = Constants.STATE.CLOSED;
			this.record({action: 'closed'});
		}
	}
	/**
	 * Force the account into lockdown, permanently preventing all use.
	 */
	shutdownAccount() {
		if (this.dead) {
			throw new BankError('Account is already shut down.');
		} else {
			this.state = Constants.STATE.DEAD;
			this.record({action: 'closed permanently'});
		}
	}
	/**
	 * Adds authorization privileges.
	 */
	authorize() {
		if (this.dead) {
			throw new BankError('Account is shut down.');
		} else {
			this.authorized = true;
		}
	}
	/**
	 * Removes authorization privileges.
	 */
	unauthorize() {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else {
			this.authorized = false;
		}
	}
	/**
	 * Get the total credits in account plus all principles being invested.
	 */
	balance() {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else {
			return this.credits + this.investments.reduce((s,i) => s += i.principle, 0);
		}
	}
	/**
	 * Add credits to the account.
	 * @param {Number} amount 
	 */
	deposit(amount) {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else if (this.closed) {
			throw new BankError('Account is currently closed');
		}
		amount = Number(amount);
		if (isNaN(amount) || amount <= 0) {
			throw new BankError('Invalid amount');
		}
		this.recordCreditChange('deposit', amount);
		return this;
	}
	/**
	 * Remove credits from the account.
	 * @param {Number} amount 
	 */
	withdraw(amount) {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else if (this.closed) {
			throw new BankError('Account is currently closed');
		}
		amount = Number(amount);
		if (isNaN(amount) || amount <= 0) {
			throw new BankError('Invalid amount');
		}
		this.recordCreditChange('withdrawal', -amount);
		return this;
	}
	/**
	 * Transfer credits from this account to another.
	 * @param {BankAccount} to - the target account
	 * @param {Number} amount - how many credits to transfer
	 */
	transfer(to, amount) {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else if (this.closed) {
			throw new BankError('Account is currently closed');
		} else if (to.dead) {
			throw new BankError('Recipient account is shut down');
		} else if (to.closed) {
			throw new BankError('Recipient account is currently closed');
		}
		amount = Number(amount);
		if (isNaN(amount) || amount <= 0) {
			throw new BankError('Invalid amount');
		}
		this.recordCreditChange('transfer', -amount);
		to.recordCreditChange('transfer', amount);
		return this;
	}
	/**
	 * Start an investment with the given amount. TODO: add custom rate/compounding
	 * @param {Number} amount - the principle of the investment
	 */
	startInvestment(amount) {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else if (this.closed) {
			throw new BankError('Account is currently closed');
		}
		amount = Math.min(Number(amount), this.credits);
		if (isNaN(amount) || amount <= 0) {
			throw new BankError('Invalid amount');
		}
		let investment = new Investment({principle: amount});
		this.recordCreditChange('investing started', -amount);
		return this.investments.push(investment);
	}
	/**
	 * Stop an investment and add its final amount to the account's credits.
	 * @param {Number} [id] - the ID of the investment (defaults to 0)
	 */
	stopInvestment(id = 0) {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else if (this.closed) {
			throw new BankError('Account is currently closed');
		} else if (!this.investing) {
			throw new BankError('Account is not investing');
		}
		let investment = this.investments[id];
		if (!investment) {
			throw new BankError('Invalid investment ID: ' + id);
		}
		this.investments.splice(id, 1);
		
		let interestEarned = investment.interest;
		this.recordCreditChange('investing stopped', interestEarned);
		
		return investment;
	}
	/**
	 * Get the investment by ID.
	 * @param {Number} [id] - the ID of the investment (defaults to 0)
	 */
	getInvestment(id = 0) {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else if (this.closed) {
			throw new BankError('Account is currently closed');
		} else if (!this.investing) {
			throw new BankError('Account is not investing');
		}
		let investment = this.investments[id];
		if (!investment) {
			throw new BankError('Invalid investment ID: ' + id);
		}
		return investment;
	}
	/**
	 * Get a summary of all concurrent investments.
	 */
	getInvestments(bank) {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else if (this.closed) {
			throw new BankError('Account is currently closed');
		} else if (!this.investing) {
			throw new BankError('Account is not investing');
		}
		return {
			fields: this.investments.map(iv => iv.shortSummary(bank))
		};
	}
	/**
	 * Receive the daily payroll if it has been at least a day since the last usage.
	 */
	daily() {
		if (this.dead) {
			throw new BankError('Account is shut down');
		} else if (this.closed) {
			throw new BankError('Account is currently closed');
		} else if (this.investing) {
			throw new BankError('Account is currently investing, so it may not receive daily money');
		}
		let timeRemaining = this.dailyCooldown;
		if (timeRemaining > 0) {
			throw new BankError(`Wait ${fmt.time(timeRemaining)} before receiving your daily money!`);
		}
		this.dailyReceived = Date.now();
		
		let amt = Constants.DAILY.AMOUNT;
		return this.recordCreditChange('daily', amt).then(() => amt);
	}
	/**
	 * Create a random confirmation code. Don't know the use of this yet.
	 */
	static generateConfirmationCode() {
		return Math.floor(0xFFFFFF * Math.random()).toString(16).padStart(6, '0'); 
	}
}

module.exports = BankAccount;
