const {Array,DiscordUtils} = require('../Utils');
const EventEmitter = require('events');

/**
 * LiveMessage class
 * A special type of non-persistent session that handles reaction input.
 * Extends the EventEmitter class so that custom reaction events can be emitted.
 * @class
 * @extends EventEmitter
 * @prop {Snowflake} channelID - the discord channel ID
 * @prop {Snowflake} messageID - the discord message ID
 * @prop {String}    message   - the message text
 * @prop {Object}    embed     - the messge embed data
 * @prop {Buffer}    image     - the attached image data (PNG format only)
 * @prop {Object}    reactions - the reactions for the message
 * @prop {Boolean}   closed    - whether the client will no longer interact through the message
 * @prop {Boolean}   persistent - whether this live message can be saved and restored after shutdown
 */
class LiveMessage extends EventEmitter {
	constructor(channelID, messageID = '', message, embed, image) {
		super();
		this.channelID = channelID;
		this.messageID = messageID;
		this.serverID  = '';
		this.message   = message;
		this.embed     = embed;
		this.image     = image;
		this.reactions = {};
		this.closed    = false;
		this.persistent = false;
	}
	get totalReactions() {
		let total = 0;
		for (let reaction in this.reactions) {
			total += this.reactions[reaction];
		}
		return total;
	}
	async setupReactionInterface(client, reactions = []) {
		if (!this.messageID) {
			await this.send(client);
			//await client.wait(1000);
		}
		if (!this.persistent && !reactions.includes(LiveMessage.CLOSE)) {
			reactions.push(LiveMessage.CLOSE);
		}
		for (let reaction of reactions) {
			await this.addReaction(client, reaction);
			await client.wait(500);
		}
		this.emit('ready', client);
		return this;
	}
	async addReaction(client, reaction) {
		await client.addReaction({
			channelID: this.channelID,
			messageID: this.messageID,
			reaction
		});
		this.reactions[reaction] = 0;
		//this.on(reaction, callback);
	}
	// userID is optional; defaults to removing the bot's own reaction
	async removeReaction(client, reaction, userID) {
		try {
			await client.removeReaction({
				channelID: this.channelID,
				messageID: this.messageID,
				userID,
				reaction
			});
			if (!userID || userID == client.id) {
				delete this.reactions[reaction];
			} else {
				this.reactions[reaction] = (this.reactions[reaction] || 0) - 1;
			}
		} catch (e) {
			client.error(e);
		}
	}
	async syncReactions(client, reactions = []) {
		let oldReactions = Object.keys(this.reactions);
		for (let reaction of oldReactions) {
			if (reaction == LiveMessage.CLOSE) continue;
			if (reaction == LiveMessage.NEW)   continue;
			if (reaction == LiveMessage.HELP)  continue;
			if (!reactions.includes(reaction)) {
				await this.removeReaction(client, reaction);
				await client.wait(250);
			}
		}
		for (let reaction of reactions) {
			if (!oldReactions.includes(reaction)) {
				await this.addReaction(client, reaction);
				await client.wait(500);
			}
		}
	}
	async clearReactions(client) {
		try {
			await this._clearReactions(client);
			this.reactions = {};
		} catch (e) {
			client.error(e);
		}
	}
	async _clearReactions(client) {
		return client.removeAllReactions({
			channelID: this.channelID,
			messageID: this.messageID
		});
	}
	async send(client, silent = false) {
		try {
			await this._send(client);
			if (!silent) this.emit('create', client);
		} catch (e) {
			client.error(e);
		}
	}
	async _send(client) {
		let message;
		if (this.image) {
			if (this.embed && !this.embed.image) {
				this.embed.image = {url:'attachment://image.png'};
			}
			message = await client.upload(this.channelID, this.image, 'image.png', this.message, this.embed);
		} else {
			message = await client.send(this.channelID, this.message, this.embed);
		}
		if (message) {
			this.messageID = message.id;
			this._updateIDs(client);
			if (this.persistent) {
				await this.save(client);
			}
			return message;
		} else {
			throw 'Something is preventing a message from being created.';
		}
		
	}
	async edit(client, silent = false) {
		try {
			await this._edit(client);
			if (!silent) this.emit('update', client);
		} catch (e) {
			client.error(e);
		}
	}
	async _edit(client) {
		let message = await client.edit(this.channelID, this.messageID, this.message, this.embed);
		return message;
	}
	async delete(client, silent = false) {
		try {
			await this._delete(client);
			if (!silent) this.emit('delete', client);
			this.close(client, silent);
		} catch (e) {
			client.error(e);
		}
	}
	async _delete(client) {
		return client.deleteMessage({
			channelID: this.channelID,
			messageID: this.messageID
		});
	}
	async replace(client, silent = false) {
		try {
			if (!silent) this.emit('replace', client);
			await this._delete(client);
			this._close(client);
			await this._send(client);
			if (!silent) this.emit('create', client);
		} catch (e) {
			client.error(e);
		}
	}
	async resend(client, silent = false) {
		try {
			this._close(client);
			await this._send(client);
			if (!silent) this.emit('resend', client);
		} catch (e) {
			client.error(e);
		}
	}
	async move(client, newChannelID, silent = false) {
		if (this.channelID == newChannelID) return;
		try {
			if (!silent) this.emit('beforemove', client);
			if (this.channelID) {
				await this._delete(client);
				this._close(client);
			}
			this.channelID = newChannelID;
			await this._send(client);
			await this.setupReactionInterface(client, Object.keys(this.reactions));
			if (!silent) this.emit('aftermove', client);
		} catch (e) {
			client.error(e);
		}
	}
	close(client, silent = false) {
		if (!silent) this.emit('close', client);
		this._close(client);
		this.closed = true;
		if (!silent) this.emit('end', client);
		setTimeout(() => this.removeAllListeners(), 0);
	}
	_close(client) {
		if (this.messageID) {
			if (this.persistent) {
				client.database.get('channels').modify(this.channelID, data => {
					let PLM = data.persistentLiveMessages;
					if (PLM) delete PLM[this.messageID];
					return data;
				}).save();
			}
			delete client.liveMessages[this.messageID];
			this.messageID = '';
		}
	}
	async saveAndUpdate(client) {
		this.updateEmbed();
		if (this.messageID) {
			this.save(client);
			if (this.image) {
				await this.replace(client);
			} else {
				await this.edit(client);
			}
		}
	}
	save(client) {
		client.database.get('channels').modify(this.channelID, data => {
			let PLM = data.persistentLiveMessages ?? {};
			PLM[this.messageID] = this.toJSON();
			data.persistentLiveMessages = PLM;
			return data;
		}).save();
	}
	async restore(client) {
		if (!this.channelID || !this.messageID) {
			throw 'Cannot restore live message: missing channel or message ID to lookup';
		}
		let message = await client.getMessage({
			channelID: this.channelID,
			messageID: this.messageID
		});
		if (message) {
			this.reactions = {};
			if (message.reactions) for (let reaction of message.reactions) {
				this.reactions[DiscordUtils.serializeReaction(reaction.emoji)] = reaction.count - reaction.me;
			}
			this._updateIDs(client);
			
			// update the message if there were some changes behind the scenes
			if (!DiscordUtils.compareEmbeds(message.embeds[0], this.embed)) {
				await this.edit(client);
			}
			return this;
		} else {
			throw 'Message data is inaccessible or deleted.';
		}
	}
	_updateIDs(client) {
		client.liveMessages[this.messageID] = this;
		this.serverID = client.channels[this.channelID]?.guild_id;
	}
	toJSON(meta = {}) {
		meta.type = this.constructor.name;
		return meta;
	}
	fromJSON(data) {
		if (data.type && data.type !== this.constructor.name) {
			throw this.constructor.name + '.fromJSON: cannot initialize data for ' + data.type;
		}
		return this;
	}
	toString() {
		return this.constructor.name + ':' + (this.channelID||'<unknown>') + ':' + (this.messageID||'<unknown>');
	}
}

LiveMessage.CLOSE = '❌'; // close live message
LiveMessage.NEW   = '🆕'; // re-initialize live message
LiveMessage.HELP  = '❓'; // idk???

module.exports = LiveMessage;
