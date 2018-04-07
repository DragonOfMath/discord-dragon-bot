const Discord = require('discord.io');
const Promise = require('bluebird');

const {DiscordEmbed} = require('./Utils');

const MY_NAME = new RegExp(__dirname.split('\\').slice(1,3).join('\\\\'), 'gi');

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
	Client wrapper for Discord.Client that supports using Promises instead of callbacks.
	Also supports using param destructuring or plain parameter list.
*/
class PromiseClient extends Discord.Client {
	constructor(token, autorun = false) {
		super(makePayload(['token','autorun'], arguments));
		this.ENABLE_EMBEDS = true;
	}
	
	/* Utility methods */
	wait(time, event, ...args) {
		let client = this;
		return Promise.delay(time).then((value) => {
			if (typeof(event) === 'function') {
				event.apply(client, args);
			}
			return value;
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
		if (!message && !embed) return; // don't bother sending empty messages
		//console.log(arguments);
		if (typeof (message) === 'object') {
			if (message.constructor.name == 'Promise') {
				// message is a Promise, so wait for it to resolve before sending
				return message.then(m => this.send(to, m))
			} else {
				([message, embed] = [embed, message]);
			}
		}
		
		var discordEmbedObject = new DiscordEmbed(message, embed);
		// remove my name if it EVER shows up
		discordEmbedObject.message = discordEmbedObject.message.replace(MY_NAME, '(Me)');
		
		if (!this.ENABLE_EMBEDS) {
			discordEmbedObject.message = discordEmbedObject.toString();
			delete discordEmbedObject.embed;
		}
		
		// check that the data is of acceptable size
		discordEmbedObject.checkPayloadLength();
		
		// send the package
		discordEmbedObject.to = to;
		return this.sendMessage(discordEmbedObject);
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
		var messageID = this.channels[channelID].last_message_id;
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
	PromiseClient.prototype[method] = function (payload) {
		return this.await(method, payload);
	};
});

module.exports = PromiseClient;
