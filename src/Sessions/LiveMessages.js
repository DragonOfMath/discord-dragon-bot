const LiveMessage = require('./LiveMessage');
const Logger      = require('../Debugging/LoggerMixin');
const TypeMapBase = require('../Structures/TypeMapBase');

class LiveMessages extends Logger(TypeMapBase) {
    constructor(client) {
        super(LiveMessage);
    }
    resolve(context) {
        let messageID = context.messageID;
        let reaction  = context.reaction;
        let liveMessage = this[messageID];
        if (liveMessage) {
			//this.info(`Events: ${context.event}, ${reaction}, reaction`);
            liveMessage.emit(reaction, context);
            liveMessage.emit(context.event, context);
            liveMessage.emit('reaction', context);
        }
        return liveMessage;
    }
}

module.exports = LiveMessages;
