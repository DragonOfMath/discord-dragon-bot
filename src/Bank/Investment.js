const BankError  = require('./BankError');
const Constants  = require('../Constants/Bank').Investment;
const Resource   = require('../Structures/Resource');
const {Markdown:md,Format:fmt} = require('../Utils');

/**
 * Investment class constructor
 * A type of investment in which a user stores credits that grows over time.
 * @class Investment
 * @extends Resource
 */
class Investment extends Resource {
	constructor(inv) {
		if (typeof(inv.principle) !== 'number') {
			throw new BankError('You must provide a valid amount to invest with!');
		}
		if (inv.principle < Investment.MINIMUM) {
			return new BankError(`Investment amount must be at least ${Investment.MINIMUM}.`);
		}
		super(Constants.TEMPLATE, inv);
	}
	get elapsed() {
		return this.current - this.started;
	}
	get interest() {
		if (this.compounding && !isNaN(this.compounding) && isFinite(this.compounding)) {
			return this.compoundInterest;
		} else {
			return this.continuousInterest;
		}
	}
	get compoundInterest() {
		return Investment.compoundInterest(this.principle, this.elapsed / Investment.TIME_SCALE, this.rate, this.compounding);
	}
	get continuousInterest() {
		return Investment.continuousInterest(this.principle, this.elapsed / Investment.TIME_SCALE, this.rate);
	}
	summary(Bank, Account) {
		return {
			title: 'Investment Transcript',
			timestamp: new Date(this.started),
			fields: [
				{
					name: 'Account',
					value: Account ? md.mention(Account) : '<anonymous>',
					inline: true
				},
				{
					name: 'Interest Earned',
					value: Bank.formatCredits(this.interest),
					inline: true
				},
				{
					name: 'Time Elapsed',
					value: fmt.timestamp(this.elapsed),
					inline: true
				},
				{
					name: 'Interest Rate',
					value: fmt.percent(this.rate) + ' (daily)',
					inline: true
				},
				{
					name: 'Interest Compounding',
					value: isFinite(this.compounding) ? this.compounding + 'x/day' : 'continuous',
					inline: true
				}
			]
		};
	}
	
	static get MINIMUM() {
		return Constants.MINIMUM;
	}
	static get RATE() {
		return Constants.RATE;
	}
	static get COMPOUNDING() {
		return Constants.COMPOUNDING;
	}
	static get TIME_SCALE() {
		return Constants.TIME_SCALE;
	}
	
	static interest(principle, time, rate = this.RATE, compounding = this.COMPOUNDING) {
		if (compounding && isFinite(compounding)) {
			return this.compoundInterest(principle, time, rate, compounding);
		} else {
			return this.continuousInterest(principle, time, rate);
		}
	}
	static compoundInterest(principle, time, rate = this.RATE, compounding = this.COMPOUNDING) {
		return principle * (Math.pow((1 + rate / compounding), compounding * time) - 1);
	}
	static continuousInterest(principle, time, rate = this.RATE) {
		return principle * (Math.exp(rate * time) - 1);
	}
}

module.exports = Investment;
