const DiscordUtils = require('./DiscordUtils');

class Context {
	constructor(client, userID, channelID, message, WSMessage) {
		if (typeof(client) !== 'object') {
			throw new TypeError(`${this.constructor.name}.client must be a Discord.Client object.`);
		}
		if (typeof(userID) === 'undefined') {
			throw new TypeError(`${this.constructor.name}.userID is invalid: ${userID} (${typeof userID})`);
		}
		if (typeof(channelID) === 'undefined') {
			throw new TypeError(`${this.constructor.name}.channelID is invalid: ${userID} (${typeof userID})`);
		}
		
		this.client    = client;
		this.clientID  = client.id;
		
		this.userID    = userID;
		this.user      = client.users[userID];
		if (!this.user) {
			throw new TypeError(`Undefined user ID: ${userID}`);
		}
		
		var DMchannel  = client.directMessages[channelID];
		
		this.isDM      = !!DMchannel;
		
		this.channelID = channelID;
		this.channel   = this.isDM ? DMchannel : client.channels[channelID];
		if (!this.channel) {
			throw new TypeError(`Undefined channel ID: ${channelID}`);
		}
		
		this.serverID  = this.isDM ? null : this.channel.guild_id;
		this.server    = this.isDM ? null : client.servers[this.serverID];
		
		this.memberID  = userID;
		this.member    = this.isDM ? this.user : this.server.members[userID];
		
		if (this.isDM) {
			this.roles = [];
		} else {
			this.roles = this.member.roles.map(r => this.server.roles[r]);
		}
		
		// if the WebSocket message is passed, it contains the correct message ID
		if (typeof(message) === 'string') {
			this.message     = message;
			this.messageID   = WSMessage ? WSMessage.d.id : this.channel.last_message_id;
			this.attachments = WSMessage ? WSMessage.d.attachments : [];
			this.embeds      = WSMessage ? WSMessage.d.embeds : [];
			this.mentions    = WSMessage ? WSMessage.d.mentions : [];
			this.messageObj  = WSMessage || null;
		} else if (typeof(message) === 'object') {
			this.message     = message.content;
			this.messageID   = message.id;
			this.attachments = message.attachments;
			this.embeds      = message.embeds;
			this.mentions    = message.mentions;
			this.messageObj  = message;
		}
		// calculate the time the message was made
		this.timestamp = DiscordUtils.getCreationTime(this.messageID);
	}
	debug() {
		let debugInfo = '';
		debugInfo += 'Server: '  + (this.server ? (this.server.name + ` (${this.serverID})`) : 'N/A') + '\n';
		debugInfo += 'Channel: ' + (this.isDM ? 'DM' : this.channel.name) + ` (${this.channelID})` + '\n';
		debugInfo += 'User: '    + this.user.name + ` (${this.userID})` + '\n';
		debugInfo += 'Input: '   + this.message;
		return debugInfo;
	}
}

module.exports = Context;
