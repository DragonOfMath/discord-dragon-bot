const LiveMessage = require('../../../Sessions/LiveMessage');
const {Markdown:md} = require('../../../Utils');

const ACCEPT  = '📞';
const DENY    = LiveMessage.CLOSE;
const TIMEOUT = 30000;

const Codes = {
	Waiting: 0,
	Accepted: 1,
	Declined: -1,
	Ignored: -2,
	Interrupted: -3
};

class CallPrompt extends LiveMessage {
	constructor(callerID, receiverID) {
		super(receiverID, '', 'Ring ring! ' + md.mention(callerID) + ' is calling you! Do you answer or decline?');
		this.code = Codes.Waiting;
		this.t = null;
		this.on('MESSAGE_REACTION_ADD', (ctx) => {
			let {reaction, userID, client} = ctx;
			if (userID != receiverID) return;
			if (reaction == ACCEPT) {
				return this.accept(client);
			} else if (reaction == DENY) {
				return this.decline(client);
			}
		});
		this.on('close', () => {
			clearTimeout(this.t);
		});
	}

	get waiting() {
		return this.code == Codes.Waiting;
	}
	get accepted() {
		return this.code == Codes.Accepted;
	}
	get declined() {
		return this.code == Codes.Declined;
	}
	get ignored() {
		return this.code == Codes.Ignored;
	}
	get interrupted() {
		return this.code == Codes.Interrupted;
	}
	
	async accept(client) {
		this.code = Codes.Accepted;
		await this.delete(client);
	}
	async decline(client) {
		this.code = Codes.Declined;
		await this.delete(client);
	}
	async timeout(client) {
		this.message = 'Took too long to answer. Connection ended.';
		this.code = Codes.Ignored;
		await this.edit(client);
		await this.close(client);
	}
	async interrupt(client) {
		this.message = 'Nevermind, the caller hung up.';
		this.code = Codes.Interrupted;
		await this.edit(client);
		this.close(client);
	}

	start(client) {
		this.t = setTimeout(() => this.timeout(client), TIMEOUT);
		return this.setupReactionInterface(client, [ACCEPT,DENY]);
	}
}

class CallCheck extends LiveMessage {
	constructor(client, callerID, receiverID) {
		super(callerID, '', 'Calling ' + md.mention(receiverID) + ', please wait... :telephone:');
		this.connected = false;

		this.prompt = new CallPrompt(callerID, receiverID);

		this.prompt.on('end', async () => {
			switch (this.prompt.code) {
				case Codes.Accepted:
					this.connected = true;
					this.message = 'You are now chatting with ' + md.mention(receiverID) + '. Say hi!';
					break;
				case Codes.Declined:
					this.message = 'They declined the call.';
					break;
				case Codes.Ignored:
					this.message = 'They didn\'t answer. Call them later?';
					break;
				case Codes.Interrupted:
					this.message = 'You terminated the call before they could pick up. Not very nice. :angry:';
					break;
				default:
					return this.delete(client);
			}
			await this.edit(client);
			//await this.clearReactions(client); // not allowed in DMs
			this.close(client);
		});

		this.on('MESSAGE_REACTION_ADD', async (ctx) => {
			let {reaction, userID, client} = ctx;
			if (userID == callerID && reaction == DENY) {
				this.prompt.interrupt(client);
			}
		});
	}
	start(client) {
		setTimeout(() => this.prompt.start(client), 2000);
		return this.setupReactionInterface(client, [DENY]);
	}
}

class Telephone {
	constructor(callerID, receiverID) {
		this.callerID = callerID;
		this.receiverID = receiverID;
		this.time = Date.now();
		this.active = false;
	}
	isConnected(user) {
		return this.callerID === user.id || this.receiverID === user.id;
	}
	isUnanswered(user) {
		return this.callerID != user.id && !this.receiverID;
	}
	getOther(user) {
		if (user.id == this.callerID) {
			return this.receiverID;
		} else if (user.id == this.receiverID) {
			return this.callerID;
		} else {
			return '';
		}
	}
	async initiate(client) {
		if (this.receiverID) {
			client.log('[Telephone] Initiating call between',this.callerID,'and',this.receiverID);
			let cc = new CallCheck(client, this.callerID, this.receiverID);

			cc.on('end', (client) => {
				if (cc.connected) {
					client.log('[Telephone]',this.receiverID,'accepted the call with',this.callerID);
					this.active = true;
				} else {
					this.close();
				}
			});

			return cc.start(client);
		} else {
			return 'Dialing a random user... :telephone:';
		}
	}
	async answer(client, user) {
		this.receiverID = user.id;
		this.active = true;
		try {
			client.log('[Telephone]',this.receiverID,'answered a call with',this.callerID);
			await client.send(this.callerID, 'You are now talking with: ' + md.atUser(user));
			await client.send(this.receiverID, 'You are now talking with: ' + md.atUser(client.users[this.callerID]));
		} catch (e) {
			client.error(e);
		}
	}
	async send(client, sender, message) {
		let receiver = this.getOther(sender);
		client.log('[Telephone] Relaying message from  ' + sender.id + ' to ' + receiver + ': ' + message);
		message = md.bold(md.atUser(sender)) + ': ' + message;
		return client.send(receiver, message);
	}
	async terminate(client, user) {
		let thisID = user.id, otherID = this.getOther(user);
		try {
			client.log('[Telephone]',thisID,'is terminating the call with',otherID);
			await client.send(thisID, 'Your call with ' + md.atUser(client.users[otherID]) + ' has ended.');
			await client.send(otherID, md.atUser(client.users[thisID]) + ' has ended the call.');
		} catch (e) {
			client.error(e);
		} finally {
			this.close();
		}
	}
	close() {
		this.callerID = '';
		this.receiverID = '';
		this.active = false;
		this.onclose && this.onclose();
	}
}

module.exports = Telephone;
