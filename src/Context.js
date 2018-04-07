class Context {
	constructor(client, userID, channelID, message) {
		if (typeof(client) !== 'object') {
			throw new TypeError(`${this.constructor.name}.client must be a Discord.Client object.`);
		}
		if (typeof(client.users[userID]) === 'undefined') {
			throw new TypeError(`${this.constructor.name}.userID is invalid: ${userID} (${typeof userID})`);
		}
		if (typeof(channelID) !== 'string') {
			throw new TypeError(`${this.constructor.name}.channelID is invalid: ${userID} (${typeof userID})`);
		}
		
		this.client    = client;
		this.clientID  = client.id;
		
		this.userID    = userID;
		this.user      = client.users[userID];
		
		var DMchannel  = client.directMessages[channelID];
		
		this.isDM      = !!DMchannel;
		
		this.channelID = channelID;
		this.channel   = this.isDM ? DMchannel : client.channels[channelID];
		
		this.serverID  = this.isDM ? null : this.channel.guild_id;
		this.server    = this.isDM ? null : client.servers[this.serverID];
		
		this.memberID  = userID;
		this.member    = this.isDM ? this.user : this.server.members[userID];
		
		this.messageID = this.channel.last_message_id;
		this.message   = message;
	}
}

module.exports = Context;