module.exports = {
	TEMP_MSG_LIFETIME:  10000, // how long temporary messages last
	RATE_LIMIT_DELAY:   1000,  // interval between running several consecutive commands to avoid rate limits
	DISCONNECT_DELAY:   3000,  // delay between stopping the bot and actually exiting the process
	LAST_COMMAND_LIMIT: 50,    // how many messages to go up to find the last command processed by the bot
	
	MAX_MESSAGE_LENGTH: 2000,  // max message size in bytes
	MAX_MESSAGE_CHUNKS: 3,     // max number of message chunks for larger messages
	TYPING_POLL_TIME: 5000,    // interval between sending the typing indicator
	MESSAGE_POLL_TIME: 3000,   // delay between polling messages from Discord
	
	MAX_RECONNECT_TRIES: 3,    // how many attempts the bot will try to reconnect when it loses connection
	RECONNECT_AFTER: 60000,    // how long the bot will wait after it has used all its attempts
	LOGGING: ['None','Limited','Normal','All'], // logging levels for debugging
	ERROR_HANDLING: {
		OFF: 0, // don't send messages for errors
		ON: 1,  // send messages for errors in place of non-error messages
		DM: 2   // send messages for errors to me instead
	},
	
	PERMISSIONS: 268790902,    // default permissions value for invites
	SOURCE_CODE: 'https://github.com/DragonOfMath/discord-dragon-bot/' // link to the github repo
};
