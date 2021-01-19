const BankAccount  = require('./BankAccount');
const BankError    = require('./BankError');
const Constants    = require('../Constants/Bank');
const {Markdown:md,Format:fmt,paginate,Array,DiscordUtils} = require('../Utils');

class Bank {
	static get header() {
		return Constants.HEADER;
	}
	static validateUser(client, server, user, selfID) {
		user = user.id || user;
		user = md.userID(user) || user;
		if (!user || (server && !server.members[user])) {
			throw new BankError('Invalid user ID: ' + user);
		} else if (selfID && user == selfID) {
			throw new BankError('Target user cannot be yourself');
		} else if (user == client.id) {
			throw new BankError('Target user cannot be this bot');
		}
		return user;
	}
	static formatCredits(c) {
		return md.bold(fmt.currency(c,Constants.CURRENCY,Constants.ROUNDING));
	}

	static table(client) {
		return client.database.get('users');
	}
	static get(client, userID) {
		//userID = this.validateUser(client, null, userID, null);
		if (!(userID in client.users)) {
			throw new Error(`Invalid user ID: ${userID}`);
		}
		let user = client.database.get('users').get(userID);
		if (!(user.bank instanceof BankAccount)) {
			user.bank = new BankAccount(userID, user.bank);
		}
		return user.bank;
	}
	static set(client, userID, acct) {
		if (!(userID in client.users)) {
			throw new Error(`Invalid user ID: ${userID}`);
		}
		let user = client.database.get('users').get(userID);
		user.bank = acct;
		return this;
	}
	static modify(client, userID, callback) {
		if (!(userID in client.users)) {
			throw new Error(`Invalid user ID: ${userID}`);
		}
		let db = client.database.get('users');
		let message;
		db.modify(userID, user => {
			if (!(user.bank instanceof BankAccount)) {
				user.bank = new BankAccount(userID, user.bank);
			}
			message = callback(user.bank, user);
			return user;
		});
		if (message) {
			return Promise.resolve(message)
			.then(msg => {
				db.save();
				return msg;
			});
		} else {
			db.save();
			return;
		}
	}
	static _modify(client, userID, callback) {
		if (!(userID in client.users)) {
			throw new BankError(`Invalid user ID: ${userID}`);
		}
		client.database.get('users').modify(userID, user => {
			if (!(user.bank instanceof BankAccount)) {
				user.bank = new BankAccount(userID, user.bank);
			}
			callback(user.bank, user);
			return user;
		});
	}
	static delete(client, userID) {
		let table = client.database.get('users');
		let user = table.get(userID);
		user.bank = new BankAccount(userID, user.bank);
		user.bank.deleteHistory(); // deletes the history log file
		delete user.bank;          // deletes the bank account object from the record
		table.save();              // updates the record on file
		return;
	}
	static save(client) {
		client.database.get('users').save();
		return this;
	}
	
	static throwError(message) {
		throw new BankError(message);
	}
	static throwAuthError(message) {
		throw new BankError('Unauthorized: ' + message);
	}

	static getServerAccounts(client, server) {
		let userTable = client.database.get('users');
		return DiscordUtils.getServerUsers(client.users, server)
		.filter(user => !!userTable.get(user.id).bank)
		.map(user => new BankAccount(user.id, userTable.get(user.id).bank));
	}
	static getBalance(client, userID) {
		return this.get(client, userID).balance();
	}
	
	static open(client, userID) {
		return this.modify(client, userID, bank => bank.openAccount());
	}
	static close(client, userID) {
		return this.modify(client, userID, bank => bank.closeAccount());
	}
	static shutdown(client, userID) {
		return this.modify(client, userID, bank => bank.shutdownAccount());
	}
	
	static deposit(client, userID, amount) {
		return this.modify(client, userID, bank => bank.deposit(amount));
	}
	static withdraw(client, userID, amount) {
		return this.modify(client, userID, bank => bank.withdraw(amount));
	}
	static transfer(client, fromUserID, toUserID, amount) {
		let src = this.get(client, fromUserID);
		let tgt = this.get(client, toUserID);
		src.transfer(tgt, amount);
		
		this.set(client, fromUserID, src).set(client, toUserID, tgt).save(client);
	}
	static daily(client, userID) {
		return this.modify(client, userID, bank => bank.daily());
	}

	static startInvestment(client, userID, amount) {
		return this.modify(client, userID, bank => bank.startInvestment(amount));
	}
	static stopInvestment(client, userID, investID = 0) {
		return this.modify(client, userID, bank => {
			let investment = bank.stopInvestment(investID);
			let summary = investment.summary(this, bank);
			summary.title = 'Investment Completed';
			return summary;
		});
	}
	static checkInvestment(client, userID, investID = 0) {
		let bank = this.get(client, userID);
		let investment = bank.getInvestment(investID);
		let summary = investment.summary(this, bank);
		summary.title = 'Investment Progress';
		return summary;
	}
	static checkInvestments(client, userID) {
		let bank = this.get(client, userID);
		let summary = bank.getInvestments(this);
		summary.title = 'Ongoing Investments';
		return summary;
	}
	
	static getAuth(client, userID) {
		return this.get(client, userID).authorized;
	}
	static authorize(client, userID) {
		return this.modify(client, userID, bank => bank.authorize());
	}
	static unauthorize(client, userID) {
		if (userID == client.ownerID) {
			throw new BankError('Bot owner cannot be unauthorized!');
		}
		return this.modify(client, userID, bank => bank.unauthorize());
	}

	static history(client, userID, page) {
		return this.get(client, userID).history()
		.then(history => this.generateHistoryTranscript(history, page));
	}
	static purgeHistory(client, userID) {
		return this.modify(client, userID, bank => bank.deleteHistory());
	}
	static pushHistory(client, userID) {
		return this.get(client, userID).record();
	}
	static revertHistory(client, userID, histID) {
		let acct = this.get(client, userID);
		let record = acct.history.find(h => h.t == histID);
		if (record) {
			acct.init(record.data);
			Bank.set(client, userID, acct).save(client);
			return record;
		} else {
			return null;
		}
	}
	
	static summary(client, userID) {
		let bank = this.get(client, userID);
		return {
			description: 'For the account of ' + md.mention(userID),
			fields: [
				{
					name: 'Balance',
					value: this.formatCredits(bank.credits)
				},
				{
					name: 'State',
					value: bank.investments.length ? 'Investing' : bank.open ? 'Open' : bank.dead ? 'Closed Indefinitely' : 'Closed'
				},
				{
					name: 'Auth',
					value: bank.authorized ? 'Yes' : 'No'
				}
			]
		};
	}
	static ledger(client, server, page) {
		let accounts = this.getServerAccounts(client, server);
		return accounts.mapAsync(acct => acct.history())
		.then(history => history.flatten())
		.then(history => this.generateHistoryTranscript(history, page));
	}
	static leaderboard(client, server, page) {
		try {
			let users = this.getServerAccounts(client, server);
			// sort users by credits
			users = users.sort((a,b) => {
				if (a.credits < b.credits) return 1;
				if (a.credits > b.credits) return -1;
				return 0;
			});
			
			return paginate(users, page, 20, (u, i) => {
				return {
					name: `#${i+1} | ${server.members[u.id].nick || client.users[u.id].username}`,
					value: this.formatCredits(u.credits),
					inline: true
				};
			});
		} catch (e) {
			console.error(e);
		}
	}
	static generateHistoryTranscript(history = [], page) {
		history = history.sort((a,b) => a.t > b.t ? -1 : a.t < b.t ? 1 : 0);
		return paginate(history, page, 20, (h, i) => {
			return {
				name: `ID: ${h[i].t} | ${h[i].timestamp}`,
				value: md.mention(h[i].user) + ': ' + h[i].toDataString()
			};
		});
	}
}

module.exports = Bank;
