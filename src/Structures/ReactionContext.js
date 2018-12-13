const Context = require('./Context');
const DiscordEvents = require('../Constants/Events');

class ReactionContext extends Context {
    constructor(client, userID, channelID, messageID, emoji, WSMessage) {
        if (WSMessage && !DiscordEvents.REACTION_EVENTS.includes(WSMessage.t)) {
            throw new Error('ReactionContext constructor only accepts the following events: ' + DiscordEvents.REACTION_EVENTS.join(', '));
        }
        super(client, userID, channelID, WSMessage);

        this.messageID = messageID;
        try {
            this.message = client.messages[channelID][messageID];
        } catch (e) {
            this.message = null;
        }

        this.emoji    = emoji;
        this.emojiID  = emoji.id;
        this.reaction = emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name;
        this.change   = this.event == DiscordEvents.MESSAGE_REACTION_ADD ? 1 : -1;
        //this.self = userID == client.id; (this will never be true because client-triggered events are never processed)
    }
    debug() {
        let debugInfo = super.debug();
        debugInfo += 'Emoji: ' + this.emoji.name + (this.emojiID ? ` (${this.emojiID})` : '') + '\n';
        return debugInfo;
    }
}

module.exports = ReactionContext;
