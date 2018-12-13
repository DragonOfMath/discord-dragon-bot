const Context = require('./Context');
const {DiscordUtils} = require('../Utils');
const DiscordEvents = require('../Constants/Events');

/**
 * @class MessageContext
 * Describes the context and contents of a message: channel, user, server, member, and WebSocket message data.
 */
class MessageContext extends Context {
    /**
	 * Context constructor
	 * @param {Client}        client      - the Discord Client object
	 * @param {Snowflake}     userID      - the ID string of the message author
	 * @param {Snowflake}     channelID   - the ID string of the channel containing the message
	 * @param {String|Object} [message]   - the message body, as a string or object
	 * @param {Object}        [WSMessage] - provides additional data for the message, such as attachments
	 */
    constructor(client, userID, channelID, message = '', WSMessage) {
		if (WSMessage && !DiscordEvents.MESSAGE_EVENTS.includes(WSMessage.t)) {
            throw new Error('MessageContext constructor only accepts the following events: ' + DiscordEvents.MESSAGE_EVENTS.join(', '));
        }
        super(client, userID, channelID, WSMessage);

        // if the WebSocket message is passed, it contains the correct message ID
		if (typeof(message) === 'string') {
			this.message     = message;
			this.messageID   = WSMessage ? WSMessage.d.id : this.channel.last_message_id;
			this.attachments = WSMessage ? WSMessage.d.attachments : [];
			this.embeds      = WSMessage ? WSMessage.d.embeds : [];
			this.mentions    = WSMessage ? WSMessage.d.mentions : [];
			this.messageObj  = WSMessage ? WSMessage.d : null;

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
    /**
	 * Using a mention will prevent other bots from detecting the same prefix
	 */
	stripMention() {
		let mention = this.client.mention;
		if (this.message.startsWith(mention)) {
			this.message = this.message.substring(mention.length).trim();
		}
		return this;
	}
	/**
	 * Checks whether a message starts with a given prefix
	 * @param {String} pfx - the prefix
	 * @returns Boolean
	 */
	hasPrefix(pfx) {
		return this.message.startsWith(pfx);
	}
	debug() {
		let debugInfo = super.debug();
		//debugInfo += 'Attachments: ' + (this.attachments.join(' ') || 'N/A') + '\n';
		debugInfo += 'Input:   ' + this.message + '\n';
		return debugInfo;
	}
}

module.exports = MessageContext;
