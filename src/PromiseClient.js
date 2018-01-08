const Discord = require('discord.io');
const Promise = require('bluebird');

/**
	Standard callback function used by discord.io made to suit Promises
*/
function cb(resolve, reject, error, response) {
	if (error) return reject(error);
	else return resolve(response);
}
/**
	Resolves the parameter/argument list to create a payload for Discord.Client methods
*/
function makePayload(paramNames = [], args = []) {
	if (typeof(args[0]) === 'object') {
		if (args[0].constructor.name == 'Promise') {
			throw new TypeError('payload args contains a Promise object');
		}
		if (Object.keys(args[0]).length == paramNames.length) {
			return args[0];
		}
	}
	var payload = {};
	for (var p = 0; p < paramNames.length; p++) {
		payload[paramNames[p]] = args[p]; // undefined arguments are handled by discord.io
	}
	return payload;
}
/**
	Ensures message + embed are within Discord's size limits
	https://discordapp.com/developers/docs/resources/channel#embed-limits
*/
function checkPayloadLength(message, embed) {
	if (typeof(message) === 'string' && message.length > 2000) {
		throw new Error('Message length exceeds Discord\'s limit: ' + message.length)
	}
	
	if (typeof(embed) === 'object') {
		let totalLength = 0
		if (embed.title) {
			if (embed.title.length > 256) {
				throw new Error('Embed title length exceeds Discord\'s limit: ' + embed.title.length)
			} else {
				totalLength += embed.title.length
			}
		}
		if (embed.description) {
			if (embed.description.length > 2048) {
				throw new Error('Embed description length exceeds Discord\'s limit: ' + embed.description.length)
			} else {
				totalLength += embed.description.length
			}
		}
		if (embed.fields) {
			if (embed.fields.length > 25) {
				throw new Error('Number of embed fields exceeds Discord\'s limit: ' + embed.fields.length)
			} else {
				for (let f of embed.fields) {
					if (f.name.length > 256) {
						throw new Error('Embed field name length exceeds Discord\'s limit: ' + f.name.length)
					} else {
						totalLength += f.name.length
					}
					if (f.value.length > 1024) {
						throw new Error('Embed field value length exceeds Discord\'s limit: ' + f.value.length)
					} else {
						totalLength += f.value.length
					}
				}
			}
		}
		if (embed.footer && embed.footer.text) {
			if (embed.footer.text.length > 2048) {
				throw new Error('Embed footer text length exceeds Discord\'s limit: ' + embed.footer.text.length)
			} else {
				totalLength += embed.footer.text.length
			}
		}
		if (embed.author) {
			if (embed.author.name.length > 256) {
				throw new Error('Embed author name length exceeds Discord\'s limit: ' + embed.author.name.length)
			} else {
				totalLength += embed.author.name.length
			}
		}
		
		if (totalLength > 6000) {
			throw new Error('Total embed text length exceeds Discord\'s limit: ' + totalLength)
		}
	}
	
	return true
}

/**
	Client wrapper for Discord.Client that supports using Promises instead of callbacks.
	Also supports using param destructuring or plain parameter list.
*/
class PromiseClient extends Discord.Client {
	constructor(token, autorun = false) {
		super(makePayload(['token','autorun'], arguments));
	}
	
	/* Utility methods */
	wait(time, event, ...args) {
		let client = this;
		return Promise.delay(time).then(() => {
			if (typeof(event) === 'function') {
				event.apply(client, args);
			}
			return true;
		});
	}
	interval(time, event, ...args) {
		let client = this;
		function handle() {
			if (event.apply(client, args)) return tick();
		}
		function tick() {
			return client.wait(time).then(handle);
		}
		return tick();
	}
	
	/**
		Creates a Promise that calls the equivalent method in Discord.Client
	*/
	await(method, payload) {
		var client = this;
		return new Promise((resolve, reject) => {
			super[method](payload, cb.bind(client, resolve, reject));
		}).catch(e => {
			console.error(e); // log the error since Discord.io usually doesn't
			throw e;          // then toss it again
		});
	}
	
	/* Shorthand methods */
	send(to, message, embed) {
		//console.log(arguments);
		if (typeof (message) === 'object') {
			if (message.constructor.name == 'Promise') {
				// message is a Promise, so wait for it to resolve before sending
				return message.then(m => this.send(to, m))
			} else {
				([message, embed] = [embed, message]);
			}
		}
		if (typeof(embed) == 'object' && (typeof (embed.message) === 'string' || typeof (embed.embed) === 'object')) {
			({message, embed} = embed);
		}
		checkPayloadLength(message, embed);
		return this.sendMessage({to,message,embed});
	}
	get(channelID, messageID) {
		//console.log(arguments);
		return this.getMessage(makePayload(['channelID','messageID'], arguments));
	}
	getAll(channelID, limit = 50) {
		//console.log(arguments);
		return this.getMessages(makePayload(['channelID','limit'], arguments));
	}
	getLast(channelID) {
		var messageID = this.channels[channeID].last_message_id;
		//console.log(arguments, messageID);
		return this.getMessage({channelID,messageID});
	}
	delete(channelID, messageID) {
		//console.log(arguments);
		return this.deleteMessage(makePayload(['channelID','messageID'], arguments));
	}
	deleteAll(channelID, messageIDs) {
		//console.log(arguments);
		return this.deleteMessages(makePayload(['channelID','messageIDs'], arguments));
	}
	addRole(serverID, userID, roleID) {
		//console.log(arguments);
		return this.addToRole(makePayload(['serverID','userID','roleID'], arguments));
	}
	removeRole(serverID, userID, roleID) {
		//console.log(arguments);
		return this.removeFromRole(makePayload(['serverID','userID','roleID'], arguments));
	}
}

/**
	Delegate these methods to use await for Promisifying Discord.Client's methods
*/
const DCP = Discord.Client.prototype;
[
	'getUser',
	'editUserInfo',
	'getOauthInfo',
	'getAccountSettings',
	'uploadFile',
	'sendMessage',
	'getMessage',
	'getMessages',
	'editMessage',
	'deleteMessage',
	'deleteMessages',
	'pinMessage',
	'getPinnedMessages',
	'deletePinnedMessage',
	'simulateTyping',
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
	PromiseClient.prototype[method] = function (payload) {
		return this.await(method, payload);
	};
});

module.exports = PromiseClient;
