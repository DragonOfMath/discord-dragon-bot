const Discord = require('discord.io');
const Promise = require('bluebird');

const {DiscordEmbed} = require('./Utils');

const MY_NAME = new RegExp(__dirname.split('\\').slice(1,3).join('\\\\'), 'gi');

/**
	Client wrapper for Discord.Client that supports using Promises instead of callbacks.
	Also supports using param destructuring or plain parameter list.
*/
class PromiseClient extends Discord.Client {
	constructor(token, autorun = false) {
		super({token,autorun});
		this._enableEmbedding = true;
		this._textToSpeech    = false;
		this._simulateTyping  = false;
	}
	
	/* Utility methods */
	wait(time, event, ...args) {
		let client = this;
		return Promise.delay(time).then(value => {
			if (typeof(event) === 'function') {
				value = event.apply(client, args);
			}
			return value;
		});
	}
	interval(time, event, ...args) {
		let client = this;
		function tick() {
			return client.wait(time, event, ...args).then(x => {if (x) return tick()});
		}
		return tick();
	}
	
	/**
		Creates a Promise that calls the equivalent method in Discord.Client
		1.6.3+: Intercepts the response, and if the client is being rate-limited,
		it will retry the request at a later time.
	*/
	await(method, payload) {
		return new Promise((resolve, reject) => {
			return super[method](payload, (error, response) => {
				return error ? reject(error) : resolve(response);
			});
		})
		.catch(e => {
			// intercept response errors
			if (e.name && e.name == 'ResponseError') {
				// https://discordapp.com/developers/docs/topics/opcodes-and-status-codes
				console.log(e);
				switch (e.statusCode) {
					case 429: // TOO MANY REQUESTS
						// handle rate-limiting
						var retry_after = e.response.retry_after + 100;
						console.log('Retrying',method,'after',retry_after,'ms');
						return this.wait(retry_after).then(() => this.await(method, payload));
					case 400: // BAD REQUEST
					case 401: // UNAUTHORIZED
					case 403: // FORBIDDEN
					case 404: // NOT FOUND
					case 405: // METHOD NOT ALLOWED
					default:
						throw e;
				}
			}
			return e;
		});
	}
	
	/* Shorthand methods */
	send(channelID, message, embed) {
		var payload = new DiscordEmbed(message, embed);
		if (!payload.message && !payload.embed) {
			return Promise.resolve('Nothing to send.');
		}
		
		// remove my name if it EVER shows up
		payload.replaceAll(MY_NAME, 'X');
		
		if (!this._enableEmbedding) {
			payload.message = payload.toString();
			delete payload.embed;
		}
		
		if (this._textToSpeech) {
			payload.tts = true;
		}
		
		if (this._simulateTyping) {
			payload.typing = true;
		}
	
		// check that the data is of acceptable size
		if (payload.checkPayloadLength()) {
			payload.to = channelID;
			return this.sendMessage(payload);
		}
	}
	edit(channelID, messageID, message, embed) {
		var payload = new DiscordEmbed(message, embed);
		if (!payload.message && !payload.embed) {
			return this.delete(channelID, messageID);
		}
		
		payload.replaceAll(MY_NAME, 'X');
		
		if (!this._enableEmbedding) {
			payload.message = payload.toString();
			delete payload.embed;
		}
		
		if (payload.checkPayloadLength()) {
			payload.channelID = channelID;
			payload.messageID = messageID;
			return this.editMessage(payload);
		}
	}
	upload(to, file, filename, message) {
		if (typeof(file) === 'undefined') {
			throw new Error('No file to upload.');
		}
		if (typeof(file) !== 'string' && typeof(filename) !== 'string') {
			throw new Error('File buffer requires filename.');
		}
		if (typeof(message) === 'string' && message.length > 2000) {
			throw new Error('Message length exceeds Discord\'s limit: ' + message.length);
		}
		
		return this.uploadFile({to, file, filename, message});
	}
	type(channelID, time = 0) {
		return this.await('simulateTyping', channelID)
		.then(() => {
			if (time > 0) {
				return this.wait(Math.min(time, 5000))
				.then(() => this.type(channelID, time - 5000));
			}
		});
	}
	addRole(serverID, userID, roleID) {
		return this.addToRole({serverID, userID, roleID});
	}
	removeRole(serverID, userID, roleID) {
		return this.removeFromRole({serverID, userID, roleID});
	}
	
	getLastMessage(channelID) {
		var messageID = this.channels[channelID].last_message_id;
		return this.getMessage({channelID, messageID});
	}
	
	/* Bulk message methods with limit workarounds */
	getMessages({channelID, limit = 50, before, after}) {
		var client = this;
		var messages = [];
		function loop() {
			return client.await('getMessages', {
				channelID,
				limit: Math.max(2, Math.min(limit, 100)),
				before,
				after
			})
			.then(_messages => {
				messages = messages.concat(_messages);
				limit -= 100;
				if (limit > 0) {
					if (after) {
						after = _messages[0].id;
					} else {
						before = _messages[_messages.length-1].id;
					}
					return client.wait(2000).then(loop);
				} else {
					return messages;
				}
			});
		}
		return loop();
	}
	deleteMessages({channelID, messageIDs: messages}) {
		messages = messages.map(m => m.id || m);
		if (messages.length == 1) {
			return client.deleteMessage({channelID, messageID: messages[0]});
		}
		var client = this;
		function loop() {
			var messageIDs = messages.splice(0,100);
			if (!messageIDs.length) {
				return;
			}
			return client.await('deleteMessages', {channelID, messageIDs})
			.delay(3000).then(loop);
		}
		return loop();
	}
}

/**
	Delegate these methods to use await for Promisifying Discord.Client's methods
*/
const PCP = PromiseClient.prototype;
const DCP = Discord.Client.prototype;
[
	'getUser',
	'editUserInfo',
	'getOauthInfo',
	'getAccountSettings',
	'uploadFile',
	'sendMessage',
	'getMessage',
//	'getMessages',
	'editMessage',
	'deleteMessage',
//	'deleteMessages',
	'pinMessage',
	'getPinnedMessages',
	'deletePinnedMessage',
//	'simulateTyping',
	'addReaction',
	'getReaction',
	'removeReaction',
	'removeAllReactions',
	'kick',
	'ban',
	'unban',
	'moveUserTo',
	'mute',
	'unmute',
	'deafen',
	'undeafen',
	'muteSelf',
	'unmuteSelf',
	'deafenSelf',
	'undeafenSelf',
	'createServer',
	'editServer',
	'editServerWidget',
	'addServerEmoji',
	'editServerEmoji',
	'deleteServerEmoji',
	'leaveServer',
	'deleteServer',
	'transferOwnership',
	'createInvite',
	'deleteInvite',
	'queryInvite',
	'getServerInvites',
	'getChannelInvites',
	'createChannel',
	'createDMChannel',
	'deleteChannel',
	'editChannelInfo',
	'editChannelPermissions',
	'deleteChannelPermission',
	'createRole',
	'editRole',
	'deleteRole',
	'addToRole',
	'removeFromRole',
	'editNickname',
	'editNote',
	'getMember',
	'getMembers',
	'getBans',
	'getServerWebhooks',
	'getChannelWebhooks',
	'createWebhook',
	'editWebhook',
	'joinVoiceChannel',
	'leaveVoiceChannel',
	'getAudioContext',
	'getAllUsers'
].forEach(method => {
	//PCP[method] = Promise.promisify(DCP[method]);
	PCP[method] = function (payload) {
		return this.await(method, payload);
	};
});

module.exports = PromiseClient;
