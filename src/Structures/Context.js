/**
 * Context class
 * Describes basic context for any message.
 * Some properties may be missing, such as when a message is received in DMs.
 * @class
 * @prop {Client}      client
 * @prop {Snowflake}   clientID
 * @prop {User}        user
 * @prop {Snowflake}   userID
 * @prop {Channel|DMChannel} channel
 * @prop {Snowflake}         channelID
 * @prop {Boolean}           isDM
 * @prop {Server}      server
 * @prop {Snowflake}   serverID
 * @prop {Member}      member
 * @prop {Snowflake}   memberID
 * @prop {Array<Role>} roles
 * @prop {Object}      WSMessage
 */
class Context {
	/**
	 * Context constructor
	 * @param {Client}    client    - the Discord Client object
	 * @param {Snowflake} userID    - the ID string of the message author
	 * @param {Snowflake} channelID - the ID string of the channel containing the message
	 * @param {Object}    WSMessage - the raw websocket message
	 */
	constructor(client, userID, channelID, WSMessage) {
		if (typeof(client) !== 'object') {
			throw new TypeError(`client must be a Discord.Client object or one of its derivative classes.`);
		}
		
		this.client   = client;
		this.clientID = client.id;
		
		this.userID = userID;
		if (userID) {
			this.user = client.users[userID];
			if (!this.user) {
				throw new TypeError(`Invalid user ID: ${userID}`);
			}
		}
		
		this.channelID = channelID;
		if (channelID) {
			var DMchannel = client.directMessages[channelID];
			this.isDM = !!DMchannel;
			this.channel = this.isDM ? DMchannel : client.channels[channelID];
			if (!this.channel) {
				throw new TypeError(`Invalid channel ID: ${channelID}`);
			}
			
			this.serverID = this.isDM ? null : this.channel.guild_id;
			this.server   = this.isDM ? null : client.servers[this.serverID];
			this.memberID = userID;
			this.member   = this.isDM ? this.user : this.server.members[userID];
			if (this.isDM) {
				this.roles = [];
			} else if (this.member) {
				this.roles = this.member.roles.map(r => this.server.roles[r]);
			}
		}

		this.WSMessage = WSMessage;
		if (WSMessage) {
			this.event = WSMessage.t;
		}
	}
	/**
	 * Creates debugging information about the Context object.
	 * @returns String
	 */
	debug() {
		let debugInfo = '';
		debugInfo += 'Event:   ' + (this.event || 'Unknown') + '\n';
		debugInfo += 'Server:  ' + (this.server ? (this.server.name + ` (${this.serverID})`) : 'N/A') + '\n';
		debugInfo += 'Channel: ' + (this.isDM ? this.user.username : this.channel.name) + ` (${this.channelID})` + '\n';
		debugInfo += 'User:    ' + this.user.username + ` (${this.userID})` + '\n';
		return debugInfo;
	}
}

module.exports = Context;
