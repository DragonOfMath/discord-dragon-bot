const {Array} = require('../Utils');
const EventEmitter = require('events');

/**
 * LiveMessage class
 * A special type of non-persistent session that handles reaction input.
 * Extends the EventEmitter class so that custom reaction events can be emitted.
 * @class
 * @extends EventEmitter
 * @prop {Snowflake} channelID
 * @prop {Snowflake} messageID
 * @prop {String}    message
 * @prop {Object}    embed
 * @prop {Object}    reactions
 * @prop {Boolean}   closed
 */
class LiveMessage extends EventEmitter {
	constructor(channelID, messageID = '', message, embed) {
		super();
		this.channelID = channelID;
		this.messageID = messageID;
		this.message   = message;
		this.embed     = embed;
		this.reactions = {};
		this.closed    = false;
	}
	get totalReactions() {
		let total = 0;
		for (let reaction in this.reactions) {
			total += this.reactions[reaction];
		}
		return total;
	}
	setupReactionInterface(client, reactions = []) {
		if (!this.messageID) {
			return this.send(client)
			.then(() => client.wait(1000))
			.then(() => this.setupReactionInterface(client, reactions));
		}
		if (!reactions.includes(LiveMessage.CLOSE)) {
			reactions.push(LiveMessage.CLOSE);
		}
		return reactions.forEachAsync(reaction => {
			return this.addReaction(client, reaction)
			.then(() => client.wait(500));
		})
		.then(() => {
			this.emit('ready', client);
			return this;
		});
	}
	addReaction(client, reaction) {
		return client.addReaction({
			channelID: this.channelID,
			messageID: this.messageID,
			reaction
		})
		.then(() => {
			this.reactions[reaction] = 0;
			//this.on(reaction, callback);
		});
	}
	// userID is optional; defaults to removing the bot's own reaction
	removeReaction(client, reaction, userID) {
		return client.removeReaction({
			channelID: this.channelID,
			messageID: this.messageID,
			userID,
			reaction
		})
		.then(() => {
			if (!userID || userID == client.id) {
				delete this.reactions[reaction];
			} else {
				this.reactions[reaction] = (this.reactions[reaction] || 0) - 1;
			}
		})
		.catch(e => {
			client.error(e);
		});
	}
	clearReactions(client) {
		return client.removeAllReactions({
			channelID: this.channelID,
			messageID: this.messageID
		})
		.then(() => {
			this.reactions = {};
		})
		.catch(e => {
			client.error(e);
		});
	}
	send(client) {
		return client.send(this.channelID, this.message, this.embed)
		.then(msg => {
			this.messageID = msg.id;
			client.liveMessages[this.messageID] = this;
			this.emit('create', client);
		})
		.catch(e => {
			client.error(e);
		});
	}
	edit(client) {
		return client.edit(this.channelID, this.messageID, this.message, this.embed)
		.then(msg => {
			this.emit('update', client);
		})
		.catch(e => {
			client.error(e);
		});
	}
	delete(client) {
		return client.deleteMessage({
			channelID: this.channelID,
			messageID: this.messageID
		})
		.then(() => {
			this.emit('delete', client);
			this.close(client);
		})
		.catch(e => {
			client.error(e);
		});
	}
	close(client) {
		this.emit('close', client);
		delete client.liveMessages[this.messageID];
		this.messageID = '';
		this.closed = true;
		this.emit('end', client);
		setTimeout(() => this.removeAllListeners(), 0);
	}
}

LiveMessage.CLOSE = '❌'; // close live message
LiveMessage.NEW   = '🆕'; // re-initialize live message
LiveMessage.HELP  = '❓'; // idk???

module.exports = LiveMessage;
