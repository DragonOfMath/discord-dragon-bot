const Discord            = require('discord.io');
const PromiseClientMixin = require('./PromiseClientMixin');
const EmojiStore         = require('./EmojiStore');

const Constants     = require('../Constants');
const LoggerMixin   = require('../Debugging/LoggerMixin');
const AudioPlayer   = require('../Audio/AudioPlayer');
const Database      = require('../Database/Database');
const VariableStore = require('../Database/Variables');
const Parser        = require('../Parser/Parser');
const Commands      = require('../Commands/Commands');
const Analytics     = require('../Commands/Analytics');
const Sessions      = require('../Sessions/Sessions');
const LiveMessages  = require('../Sessions/LiveMessages');
const Moderation    = require('../Moderation/Moderation');
const MessageContext  = require('../Structures/MessageContext');
const ReactionContext = require('../Structures/ReactionContext');
const Handler       = require('../Structures/Handler');
const FilePromise   = require('../Structures/FilePromise');
const Utils         = require('../Utils');
const {
	Markdown:md,
	Array,
	DiscordEmbed,
	DiscordUtils,
	strcmp,
	decircularize,
	pipe
} = Utils;

/**
	@class DragonClient
	@extends Discord.Client

	Upgrade that supports smarter request handling and shorter method names.
	* Longer messages up to several times the Discord limit are chunked.
	* Can upload a file and post a message with rich embed simultaneously.
	* Can config embedding, text-to-speech, and typing for all outgoing messages.
	* Typing indicator can have a set duration, instead of the default 5 seconds.
	* New method for sending a message that expires after a duration.
	* Retrieving and deleting messages has no limit for the number of messages.

	Performs basic moderation duties automatically.
	* Filters incoming messages according to the server's moderation settings.
	* Prevents raids and mass spamming of many kinds.
	* Configurable punishments for infractions.
	* Logs cases to a custom mod log channel.
	Special methods:
	* snipe - get deleted messages
	* getMessages - overrides the default getMessages using a filter
	* moveMessages - transfer messages from one channel to another

	Client inherits logger utilities and is extended for other nerdy things.
	* Basic logging capabilities, with colorful/meaningful highlighting.
	* Information about the current process in Node.
	* Ping and heartbeat getters.
	* Methods for stopping and suspending the client.
	* Snapshot tool to dump the entire client state into a file.
	* Smarter handling of disconnections when it comes to network issues.
*/
class DragonClient extends pipe(Discord.Client, PromiseClientMixin, LoggerMixin) {
	/**
	 * DragonBot constructor
	 * @param {Object}    initializer
	 * @param {String}    initializer.token   - client auth token
	 * @param {Snowflake} initializer.ownerID - my user ID
	 */
	constructor(initializer = {}) {
		if (!initializer.token) {
			throw new Error('You need to provide an auth token!');
		}
		if (!initializer.ownerID) {
			throw new Error('You need to provide an ownerID!');
		}
		if (!initializer.apiKeys) {
			initializer.apiKeys = {};
		}
		super(initializer);
		
		this.ownerID     = initializer.ownerID;
		this.PERMISSIONS = initializer.permissions || Constants.Client.PERMISSIONS;
		
		Object.defineProperties(this, {
			'apiKeys': {
				get() {return initializer.apiKeys},
				set() {},
				enumerable: false
			}
		});
		
		this.PREFIX      = Constants.Symbols.PREFIX;
		this.SOURCE_CODE = Constants.Client.SOURCE_CODE;
		try {
			this.VERSION = require('../../package.json').version;
		} catch (e) {
			this.VERSION = '2.0-test';
		}
		
		// Storage
		this.emojis    = this.es   = new EmojiStore(this);
		this.database  = this.db   = new Database(this);
        this.variables = this.vars = new VariableStore(this);
		
		// Utilities
		this.parser = Parser;
		this.utils  = Utils;
		this.dutils = DiscordUtils;
		
		// Moderation
		this.mod    = this.moderation = Moderation;
		
		// Commands
		this.usage  = this.analytics = Analytics;
		this.cmds   = this.commands  = new Commands(this);
		
		// Sessions
		this.spcs   = this.sessions     = new Sessions(this);
		this.live   = this.liveMessages = new LiveMessages(this);

		// Audio
		this._players = {};
		
		// Internal client settings
		this._started      = Date.now();
		this._tryReconnect = false;
		this._suspended    = false;
		this._ignoreUsers  = true;
		this._ignoreBots   = true;
		this._handleErrors   = Constants.Client.ERROR_HANDLING.DM;
		this._reconnectTries = 0;
		this._disconnectTime = 0;
		this.downtime = 0;
		this._enableEmbedding = true;
		this._textToSpeech    = false;
		this._simulateTyping  = false;
		this._messageChunks   = true;
		this._allowGlobalMentions = true;
		this._allowInviteLinks    = true;
		
		// Event Handlers
		//this.on('any', console.log);
		this.on('ready',             this.handleConnect.bind(this));
		this.on('disconnect',        this.handleDisconnect.bind(this));
		this.on('guildCreate',       this.handleGuildCreate.bind(this));
		this.on('guildDelete',       this.handleGuildDelete.bind(this));
		this.on('guildMemberAdd',    this.handleMemberAdd.bind(this));
		this.on('guildMemberRemove', this.handleMemberRemove.bind(this));
		//this.on('guildMemberUpdate', this.handleMemberUpdate.bind(this));
		this.on('message',           this.handleMessageCreate.bind(this));
		this.on('messageReactionAdd', this.handleMessageReactionAdd.bind(this));
		this.on('messageReactionRemove', this.handleMessageReactionRemove.bind(this));
	}
	get inviteUrl() {
		return this.inviteURL + '&permissions=' + this.PERMISSIONS;
	}

	/* Debugging */

	get uptime() {
		return Date.now() - this._started;
	}
	get memory() {
		return process.memoryUsage();
	}
	get heartbeat() {
		return this.internals._lastHB;
	}
	get ping() {
		return this.internals.ping;
	}

	async latency(channelID) {
		let messageID = this.channels[channelID].last_message_id;
		let ref = Date.now()
		await this.getMessage({channelID,messageID});
		return Date.now() - ref;
	}
	async stop() {
		this._tryReconnect = false;
		this._suspended    = false;
		this._ignoreUsers  = true;
		this._ignoreBots   = true;
		this._reconnectTries = 0;
		
		this.presenceText = 'Bye! \uD83D\uDC4B';

		await this.wait(Constants.Client.DISCONNECT_DELAY);
		this.disconnect();
	}
	async suspend(time) {
		this._tryReconnect = false;
		this._suspended    = true;
		if (this._connected) this.disconnect();
		await this.wait(time);
		this._tryReconnect = true;
		this._suspended    = false;
		return this.connect();
	}
	
	snapshot(dir) {
		let data = decircularize(this);
		let time = new Date().toLocaleString().replace(/[:\\\/]/g,'-').replace(/\s+/g,'_');
		let filename = FilePromise.join(dir, `snapshot_${time}.json`);
		return FilePromise.createSync(filename, JSON.stringify(data, null, 4));
	}
	
	/* Audio */

	get voiceChannels() {
		return this._vChannels;
	}

	getStream(serverID, VChannelID) {
		return this._players[serverID];
	}
	isStreaming(serverID, VChannelID) {
		let stream = this.getStream(serverID);
		if (stream) {
			if (!VChannelID || stream.vc.id == VChannelID) {
				return true;
			} else {
				throw new Error('Currently streaming in ' + stream.vc.name);
			}
		} else {
			return false;
		}
	}
	startStream(serverID, VChannelID) {
		let channel = this.servers[serverID].channels[VChannelID];
		if (serverID in this._players) {
			let stream = this._players[serverID];
			if (stream.vc.id == channel.id) {
				throw new Error('Already in that voice channel in this server.');
			} else {
				throw new Error('Currently streaming in ' + stream.vc.name);
			}
		}
		
		let player = new AudioPlayer();
		return player.open(this, channel)
		.then(() => {
			this.log('Starting stream:', player.toString());
			this._players[serverID] = player;
			return player;
		});
	}
	stopStream(serverID, VChannelID) {
		let player = this.getStream(serverID);
		if (!player || !player.vc) {
			throw new Error('Not currently in a voice channel in this server.');
		}
		
		return player.close(this)
		.then(() => {
			this.log('Ending stream:', player.toString());
			delete this._players[serverID];
			return void 0;
		});
	}
	resolveStream(serverID, VChannelID) {
		try {
			if (this.isStreaming(serverID, VChannelID)) {
				return Promise.resolve(this.getStream(serverID));
			} else {
				return this.startStream(serverID, VChannelID);
			}
		} catch (e) {
			return Promise.reject(e);
		}
	}
	
	/* Storage */

	getVar(name, namespace) {
        return this.variables.get(namespace, name);
    }
    setVar(name, value, namespace) {
        return this.variables.set(namespace, name, value);
    }
    deleteVar(name, namespace) {
        return this.variables.delete(namespace, name);
    }
    clearVars(namespace) {
        return this.variables.clear(namespace);
    }
	
	/* Special */

	get roles() {
		let roles = {};
		for (let id in this.servers) {
			let server = this.servers[id];
			for (let rid in server.roles) {
				if (rid === id) continue; // @everyone
				roles[rid] = server.roles[rid];
			}
		}
		return roles;
	}
	get mention() {
		return md.mention(this.id);
	}

	/**
	 * Sets the text appearing under the bot's name in the list of users.
	 * @param {String} name - string that follows "Playing"
	 */
	set presenceText(name) {
		this.setPresence({game:{name}, type: 1});
	}

	/**
	 * Sends a message to a channel, applying the client's settings for TTS, typing, and chunkifying if necessary.
	 * @param {Snowflake} channelID - the channel to send the message to
	 * @param {String|Object} message - the message text or payload object
	 * @param {Object} [embed] - the embed object
	 */
	async send(channelID, message, embed) {
		let payload = new DiscordEmbed(message, embed);
		if (!payload.message && !payload.embed) return;
		
		payload.to = channelID;
		
		this._cleanupMessage(payload);
		
		if (!this._enableEmbedding) {
			payload.message = payload.toString();
			delete payload.embed;
		}
		payload.tts    = !!this._textToSpeech;
		payload.typing = !!this._simulateTyping;

		if (this._messageChunks && payload.message.length > Constants.Client.MAX_MESSAGE_LENGTH) {
			// chunkify the message
			let chunks = [], chunk = '';
			for (let line of payload.message.split('\n')) {
				if (line.length > Constants.Client.MAX_MESSAGE_LENGTH) {
					throw 'Message chunk is too large: ' + line.length;
				}
				if (chunk.length + line.length < Constants.Client.MAX_MESSAGE_LENGTH) {
					chunk += '\n' + line;
				} else {
					chunks.push(chunk.trim());
					chunk = line;
				}
			}
			if (chunk) chunks.push(chunk.trim());
			if (chunks.length > Constants.Client.MAX_MESSAGE_CHUNKS) {
				throw `Message is too large to send in ${Constants.Client.MAX_MESSAGE_CHUNKS} chunks of ${Constants.Client.MAX_MESSAGE_LENGTH} characters or less: ${message.length}`;
			}

			// temporarily store the embed so that it is sent with the last chunk only
			let embed = payload.embed;
			payload.embed = null;

			let response;
			while (chunks.length) {
				payload.message = chunks.shift();
				if (!chunks.length) {
					payload.embed = embed;
					payload.checkPayloadLength();
				}
				response = await this.sendMessage(payload);
			}
			return response;
		} else if (payload.checkPayloadLength()) {
			// send the message as normal 
			return this.sendMessage(payload);
		}
	}

	/**
	 * Edits a message. If both message and embed are left out, the message is deleted instead.
	 * @param {Snowflake} channelID - the channel ID of the message
	 * @param {Snowflake} messageID - the message ID
	 * @param {String|Object} message - the message text or payload object
	 * @param {Object} [embed] - the embed object
	 */
	async edit(channelID, messageID, message, embed) {
		let payload = new DiscordEmbed(message, embed);
		if (!payload.message && !payload.embed) {
			return await this.deleteMessage({channelID, messageID});
		}
		payload.channelID = channelID;
		payload.messageID = messageID;
		
		this._cleanupMessage(payload);
		
		if (!this._enableEmbedding) {
			payload.message = payload.toString();
			delete payload.embed;
		}

		if (payload.checkPayloadLength()) {
			return this.editMessage(payload);
		}
	}

	/**
	 * Uploads a file. Supports an additional embed object.
	 * @param {Snowflake} channelID - the channel ID
	 * @param {Buffer|String} file - the file buffer or filename
	 * @param {String} [filename] - required if file is a buffer
	 * @param {String} [message] - message to post with the file
	 * @param {Object} [embed]  - the embed object 
	 */
	async upload(channelID, file, filename, message, embed) {
		if (typeof(file) === 'undefined') {
			throw 'No file to upload.';
		}
		if (typeof(file) !== 'string' && typeof(filename) !== 'string') {
			throw 'File buffer requires filename.';
		}
		if (typeof(message) === 'string' && message.length > Constants.Client.MAX_MESSAGE_LENGTH) {
			throw 'Message length exceeds Discord\'s limit: ' + message.length;
		}
		
		let payload = new DiscordEmbed(message, embed);
		payload.to       = channelID;
		payload.file     = file;
		payload.filename = filename;
		return this.uploadFile(payload);
	}

	/**
	 * Simulates typing in a channel for a limited time.
	 * @param {Snowflake} channelID 
	 * @param {Number} time 
	 */
	async type(channelID, time = 0) {
		await this.await('simulateTyping', channelID);
		if (time > 0) {
			await this.wait(Math.min(time, Constants.Client.TYPING_POLL_TIME))
			await this.type(channelID, time - Constants.Client.TYPING_POLL_TIME);
		}
		return this;
	}

	/**
		Searches for deleted messages in the channel and returns one from the cache.
		@arg {Snowflake} channelID - the channel to search in
		@arg {Snowflake} [userID] - the user whose messages to search for
		@return The last deleted message. If it can't find one, it throws an error.
	*/
	async snipe(channelID, userID) {
		let messages = await this.getMessages({
			channelID,
			limit: this.messageCacheLimit
		});

		// find deleted message(s) by checking the message cache
		let messageIDs = messages.map(m => m.id);
		let cache = this._messageCache[channelID] || {};
		let deletedMessages = [];
		// IDs go from oldest to newest
		for (let id in cache) {
			if (!messageIDs.includes(id) && (!userID || cache[id].author.id == userID)) {
				deletedMessages.push(cache[id]);
			}
		}
		if (deletedMessages.length) {
			let message = deletedMessages.pop();
			delete cache[message.id]; // don't snipe this message again
			return message;
		} else {
			throw new Error('No sniped messages found.');
		}
	}

	/**
	 * Kick members out of a voice channel.
	 * @param {Server} server 
	 * @param {Snowflake} voiceChannelID 
	 * @returns Array of members that were kicked.
	 */
	async vckick(server, voiceChannelID) {
		let tempVC = await this.createChannel({
			serverID: server.id,
			type: 1
		});
		let members = [];
		for (let userID in server.members) {
			if (server.members[userID].voice_channel_id == voiceChannelID) {
				members.push(server.members[userID]);
				await this.moveUserTo({
					serverID: server.id,
					userID,
					channelID: tempVC.id
				});
			}
		}
		await this.deleteChannel({
			serverID: server.id,
			channelID: tempVC.id
		});
		return members;
	}

	/**
	 * Move messages from one channel to another
	 * @param {Object}    options          - the options for moving messages
	 * @param {Snowflake} options.from     - the channel to take messages from
	 * @param {Snowflake} options.to       - the channel to move messages to
	 * @param {Number}    options.limit    - the max number of messages to search for
	 * @param {Snowflake} [options.before] - the message ID to search before
	 * @param {Snowflake} [options.after]  - the message ID to search after
	 * @param {Function}  [options.filter] - filter messages before moving them
	 * @param {Function}  [options.map]    - map messages prior to reposting them
	 * @param {Array<Object>} [options.messages] - instead of moving a number of messages from the channel, move only selected messages
	 */
	async moveMessages(options = {}) {
		if (!options.map) {
			options.map = ({author,content,attachments,embeds}) => {
				let message = `By ${md.mention(author.id)} in ${md.channel(options.from)}:\n${content}`;
				let embed = embeds[0];
				if (attachments && attachments.length) {
					message += '\n' + attachments.map(a => a.url).join('\n');
				}
				return {message,embed};
			};
		}
		
		let messages = [];
		if (options.messages) {
			for (let message of options.messages) {
				if (typeof(message) === 'string') {
					message = await this.getMessage({channelID: options.from, messageID: message});
				}
				messages.push(message);
			}
		} else {
			messages = await this.getMessages({
				channelID: options.from,
				before: options.before,
				after: options.after,
				limit: options.limit,
				filter: options.filter
			});
		}

		if (messages.length === 0) {
			this.warn(`No messages to move from ${options.from} to ${options.to}`);
			return;
		}

		this.notice(`Moving ${messages.length} messages from ${options.from} to ${options.to}...`);

		// messages are originally from newest to oldest, but we want to start with the oldest first
		messages = messages.sort((m1,m2) => m1.id < m2.id ? -1 : m1.id > m2.id ? 1 : 0);
		for (let message of messages) {
			await this.send(options.to, options.map(message));
		}
		await this.deleteMessages({channelID: options.from, messageIDs: messages});
	}
	
	/**
	 * Send a message that expires after a set amount of time.
	 * @param {Snowflake} channelID - the channelID
	 * @param {String}    [message] - the message content (must be present if the other is absent)
	 * @param {Object}    [embed]   - the embed content (must be present if the other is absent)
	 * @param {Number}    timer     - the duration of the message before it is deleted
	 */
	async sendTemp(channelID, message, embed, timer) {
		message = await this.send(channelID, message, embed);
		await this.wait(timer);
		let messageID = message.id;
		return this.deleteMessage({channelID, messageID});
	}

	/**
	 * Gets the last message in a channel.
	 * @param {Snowflake} channelID - the channel ID
	 * @param {Boolean}   [noCache] - optionally avoid returning a cached version of the message
	 */
	async getLastMessage(channelID, noCache) {
		let channel = this.channels[channelID] || this.directMessages[channelID];
		let messageID = channel.last_message_id;
		if (!noCache && messageID in this._messageCache[channelID]) {
			return this._messageCache[channelID][messageID];
		} else {
			return this.getMessage({channelID, messageID});
		}
	}

	/**
	 * Get unlimited messages from a channel, but also have the ability to filter messages.
	 * @param {Object}                 options           - the options for getting messages
	 * @param {Snowflake}              options.channelID - the channel ID
	 * @param {Number}                 options.limit     - the max number of messages to get, default is 100
	 * @param {Snowflake}              [options.before]  - the message ID to search before
	 * @param {Snowflake}              [options.after]   - the message ID to search after
	 * @param {Function|RegExp|String} [options.filter]  - filter messages before returning them.
	 */
	async getMessages({channelID, limit = 50, before, after, filter}) {
		let messages = [];
		do {
			let _messages = await super.getMessages({
				channelID,
				limit: Math.max(2, Math.min(limit, 100)),
				before,
				after
			});
			messages = messages.concat(_messages);
			limit -= 100;
			if (_messages.length > 0 && limit > 0) {
				if (after) {
					after = _messages[0].id;
				} else {
					before = _messages[_messages.length-1].id;
				}
				await this.wait(Constants.Client.MESSAGE_POLL_TIME);
			} else break;
		} while (true);

		if (filter) {
			if (typeof(filter) === 'function') {
				messages = messages.filter(filter);
			} else if (typeof(filter) === 'object' && filter instanceof RegExp) {
				messages = messages.filter(message => filter.test(message.content));
			} else if (typeof(filter) === 'string') {
				messages = messages.filter(message => strcmp(message.author.username, filter));
			}
		}

		return messages;
	}

	/**
	 * Deletes unlimited messages in a channel (younger than 2 weeks).
	 * @param {Object}                   options            - the options for deleting messages
	 * @param {Snowflake}                options.channelID  - the channel ID of the messages
	 * @param {Array<Snowflake|Message>} options.messageIDs - the array of messages or message IDs
	 */
	async deleteMessages({channelID, messageIDs}) {
		messageIDs = messageIDs.map(m => m.id || m);

		while (messageIDs.length) {
			if (messageIDs.length == 1) {
				await this.deleteMessage({
					channelID,
					messageID: messageIDs.pop()
				});
			} else {
				await super.deleteMessages({
					channelID,
					messageIDs: messageIDs.splice(0,100)
				});
			}
			await this.wait(Constants.Client.MESSAGE_POLL_TIME);
		}
	}
	
	/**
	 * Sets the client's avatar.
	 * @param {String|Buffer} avatar - the link, filename, or base64 buffer of the avatar
	 */
	async setAvatar(avatar) {
		if (typeof(avatar) === 'string') {
			avatar = await FilePromise.read(avatar, 'base64');
		}
		if (Buffer.isBuffer(avatar)) {
			avatar = avatar.toString('base64');
		}
		return await this.editUserInfo({avatar});
	}

	/**
	 * Wrapper for original createRole and editRole combined.
	 * @param {Snowflake} options.serverID - the server ID
	 * @param {String}    options.name - the role name
	 * @param {String}    [options.color] - the role color
	 * @param {Boolean}   [options.hoist] - the index of the role, -1 if unhoisted
	 * @param {Boolean}   [options.mentionable] - make this role mentionable
	 * @param {Object}    [options.permissions] - the permissions for this role
	 * @returns The newly created role object
	 */
	async createRole(options = {}) {
		let role = await this.await('createRole', options.serverID);
		options.roleID = role.id;
		role = await this.editRole(options);
		return role;
	}

	/**
	 * Delete the bot's last message in a channel.
	 * @param {Snowflake} channelID - the channel ID
	 * @param {Number} [count=1] - the number of messages to delete
	 */
	async undo(channelID, count = 1) {
		let messages = await this.getMessages({channelID});
		messages = messages.filter(m => m.author.id == this.id).slice(0, count);
		if (messages.length > 0) {
			return await this.deleteMessages({channelID, messageIDs: messages});
		} else {
			return;
		}
	}

	/**
	 * Find the last command used in a channel and re-run it.
	 * @param {Snowflake} channelID - the channel ID
	 * @param {Snowflake} [userID]  - the user ID (optional)
	 */
	async redo(channelID, userID) {
		let messages = await this.getMessages({channelID});
		let commandMessage = messages.find(message => {
			if (userID && userID != message.author.id) return false;
			let ctx = new MessageContext(this, userID, channelID, message);
			let prefix = this.evalPrefix(ctx);
			return !!prefix && !(ctx.message.startsWith('redo') || ctx.message.startsWith('undo'));
		});
		if (commandMessage) {
			return this.handleMessageCreate(null, userID, channelID, commandMessage);
		} else {
			return 'Command not found.';
		}
	}

	/**
	 * Runs command input.
	 * @param {MessageContext} context - the message context
	 * @param {Block}          input   - the input object, produced by the Parser
	 * @return A Promise for the handler that resolves when the command completes or fails.
	 */
	async run(context, input) {
		let handler = new Handler(context, input);
		
		// bot shouldn't respond to anyone but the owner if set to ignore them
		if (this._ignoreUsers && !context.user.bot && context.userID != this.ownerID) {
			return handler;
		}
		
		// bot shouldn't respond to other bots if set to ignore them (unless the bot is itself for some reason...)
		if (this._ignoreBots && context.user.bot && context.user.id != this.id) {
			return handler;
		}
		
		// create a copy of the args array with normalized values
		if (input.args) {
			handler.args = input.args.map(a => this.normalize(a,context));
			handler.arg  = handler.args.map(String).join(' ');
		}

		// check the bot's block list
		let block = this.database.get('block');
		if (handler.cmd && block.has(context.userID)) {
			let blockData = block.get(context.userID);
			if (!blockData.timer || blockData.timer > Date.now()) {
				// politely remind the user they may not use the bot for commands anymore
				let message = ':no_entry_sign: ' + md.bold('You are blocked from using this bot\'s commands.')
					+ '\nReason: ' + md.italics(blockData.reason)
					+ '\nYou may not appeal this.';
				return await this.send(context.userID, message);
			} else {
				// the block is past the expiration date
				block.delete(context.userID);
			}
		}

		// resolve command or special text
		try {
			await (handler.cmd ? this.commands : this.sessions).resolve(handler);
		} catch (e) {
			await handler.reject(e);
		}

		// handle sending a message or uploading a file
		if (handler.error) {
			this.warn(handler.error);
		} else if (this.analytics._active && handler.command && handler.command.analytics && handler.grant == 'granted') {
			// analytics is updated if a command was successfully resolved
			this.analytics.push(this.database, handler.serverID, handler.cmd);
		}
		if (!handler.response || !(handler.response.message || handler.response.embed || handler.response.file)) {
			return handler;
		}

		handler.response.message = this.normalize(handler.response.message, handler.context);
		this.log(handler.response);

		try {
			if (handler.response.file) {
				await this.upload(handler.channelID, handler.response.file, handler.response.filename, handler.response.message, handler.response.embed);
			} else if (handler.response.expires && handler.response.message.length < 200) {
				// if the message expires, delete it after a set duration (only do this for short messages)
				await this.sendTemp(handler.channelID, handler.response.message, handler.response.embed, Constants.Client.TEMP_MSG_LIFETIME);
			} else {
				await this.send(handler.channelID, handler.response.message, handler.response.embed);
			}
		} catch (e) {
			this.warn(e);
			switch (this._handleErrors) {
				case 2: // send error messages anyways
					await this.send(handler.channelID, '<:fuck:351198367835095040> Oopsie woopsie! UwU we made a fucky wucky! A wittle fucko boingo!\n' + md.codeblock(e.toString()));
				case 1: // send errors to me
					await handler.sendErrorReport(e);
			}
		} finally {
			// add a delay to prevent rate-limiting
			await this.wait(Constants.Client.RATE_LIMIT_DELAY);
			return handler;
		}
	}

	/**
	 * Replaces variable symbols with their values, and if possible, evaluates an expression.
	 * @param {String} text - the string to normalize
	 * @param {MessageContext} context - the context of the message
	 * @return the normalized text string
	 */
	normalize(text = '', context) {
		if (typeof(text) !== 'string') return text;
		if (typeof(context) !== 'object') throw new Error('context is undefined');
		
		// define certain symbols and retrieve server vars
		let vars = Object.assign(this.getSymbols(context), this.variables.get(context.serverID));
		
		let matches = text.match(/\$[\w\d_]+/gi), value;
		if (matches) {
			//console.log(vars,matches);
			// insert variable values
			for (let v of matches) {
				value = vars[v.substring(1)];
				if (typeof(value) !== 'undefined') text = text.replace(v, value);
			}
		}
		
		// evaluate the %(...) expression
		if (text[0] == Constants.Symbols.EXPRESSION) {
			if (text[1] == Constants.Symbols.EXP_START && text.endsWith(Constants.Symbols.EXP_END)) {
				text = Math.eval(text.substring(1)); // avoid open eval
			} else if ((text[1] == Constants.Symbols.ARR_START && text.endsWith(Constants.Symbols.ARR_END))
				    || (text[1] == Constants.Symbols.OBJ_START && text.endsWith(Constants.Symbols.OBJ_END))) {
				text = JSON.parse(text.substring(1));
			} else if (text[1] == Constants.Symbols.RGX_START
					&& text.lastIndexOf(Constants.Symbols.RGX_END) > text.indexOf(Constants.Symbols.RGX_START)) {
				// remove % before the first /
				let [,...regex] = text.split('/');
				let flags = '';
				// if flags are present, get these from the regex parts
				if (text.lastIndexOf(Constants.Symbols.RGX_END) < text.length - 1) {
					flags = regex.pop();
				}
				regex = regex.join('/');
				//regex = this.utils.escapeRegExp(regex); // fix the regex
				text = new RegExp(regex, flags);
			}
		}
		
		return text;
	}

	/**
	 * Symbols are specialized values that can be inserted into text messages.
	 * @param {MessageContext} context - the context of the message
	 * @return Object containing symbol names/values
	 */
	getSymbols(context) {
		var date = new Date();
		return {
			// context
			userID:      context.userID,
			channelID:   context.channelID,
			serverID:    context.serverID,
			user:        context.user ? context.user.username : '?',
			channel:     context.channel ? context.channel.name : '?',
			server:      context.server  ? context.server.name  : '?',
			nick:        context.member ? context.member.nick || context.user.username : '?',
			mention:     md.mention(context.user) || '@?',
			// time
			ms:          String(date.valueOf()),
			time:        date.toLocaleTimeString(),
			date:        date.toLocaleDateString(),
			day:         date.toLocaleDateString('en-US',{weekday:'long'}),
			month:       date.toLocaleDateString('en-US',{month:'long'}),
			// misc
			clientID:    this.id,
			me:          md.mention(this.id),
			owner:       md.mention(this.ownerID),
			version:     this.VERSION,
			source:      this.SOURCE_CODE,
			prefix:      this.PREFIX,
			random:      Math.random(),
			avatar:      DiscordUtils.getAvatarURL(context.user),
			icon:        DiscordUtils.getIconURL(context.server),
			// special characters
			lb: '{',
			rb: '}',
			lp: '(',
			rp: ')',
			quot: '"',
			bs: '\\',
			lf: '\n',
			semi: ';',
			zws: '\u200B'
		};
	}

	/**
	 * Retrieve the custom prefixes used on the server.
	 * @param {Snowflake} serverID - the server ID
	 */
	getCustomPrefixes(serverID) {
		// return a copied array to avoid modifying the data
		return (this.database.get('servers').get(serverID).prefixes || []).slice();
	}

	/**
	 * Find the prefix used in a message if there is one. And if so, 
	 * @param {MessageContext} context - the context of the message
	 * @return The prefix found at the start of the message
	 */
	evalPrefix(context) {
		context.stripMention();
		
		// check for the default prefix or a custom one
		let customPrefixes = context.serverID ? this.getCustomPrefixes(context.serverID) : [];
		let prefix = context.hasPrefix(this.PREFIX) ? this.PREFIX : customPrefixes.find(pfx => context.hasPrefix(pfx));
		if (prefix) {
			context.message = context.message.substring(prefix.length).trim();
		}
		
		return prefix;
	}
	
	/* Event Handlers */

	handleConnect() {
		if (this._disconnectTime) {
			this.downtime += Date.now() - this._disconnectTime;
			this._disconnectTime = 0;
		}
		
		this.notice('Client connected as', md.atUser(this), this.id);
		this._ignoreUsers  = false;
		//this._ignoreBots   = false;
		this._tryReconnect = true;
		this._suspended    = false;
		this._reconnectTries = 0;
		
		this.presenceText = this.PREFIX + `help`;
		this.sessions.startTimer();
	}
	handleDisconnect(error) {
		if (!this.disconnectTime) {
			this._disconnectTime = Date.now();
		}
		
		if (error) {
			this.error(error);
		}
		
		if (this._suspended) {
			this.notice('Client suspended.');
		} else if (this._tryReconnect) {
			if (this._reconnectTries < Constants.Client.MAX_RECONNECT_TRIES) {
				this.warn('Reconnecting...');
				this._reconnectTries++;
				this.connect();
			} else {
				this.error('Client can\'t connect due to a possible outage.');
				this._reconnectTries--;
				this.suspend(Constants.Client.RECONNECT_AFTER);
			}
		} else {
			this.notice('Client stopped connection.');
			process.exit(0);
		}
		
		this.sessions.stopTimer();
	}
	handleGuildCreate(server, WSMessage) {
		if (server) this.log(md.atUser(this),'has joined',server.name);
		else this.error(md.atUser(this),'has apparently joined a server, but the server object is undefined.\n',WSMessage);
	}
	handleGuildDelete(server, WSMessage) {
		if (server) this.log(md.atUser(this),'has left',server.name);
		else this.error(md.atUser(this),'has apparently left a server, but the server object is undefined.\n',WSMessage);
	}
	handleMemberAdd(member, WSMessage) {
		try {
			let data = WSMessage.d,
				serverID = data.guild_id,
				server = this.servers[serverID],
				user = this.users[member.id];
			
			// sometimes user is undefined?
			if (!user) throw 'Invalid member: ' + member.id;
			
			this.log(`${server.name} > ${md.atUser(user)} joined.`);

			// moderate incoming users to prevent raids
			let settings = Moderation.get(this, server);
			let offense  = settings.checkUser(user);
			if (offense) {
				this.info(`Auto-banning user ${md.atUser(user)} (${user.id}) for ${offense.toString()}`);
				return Moderation.doActions({client:this,server,user}, offense)
				.then(msg => this.notice(msg))
				.catch(err => {
					this.error(err);
					return this.send(serverID, md.mention(user) + ' omg!! your not supposed to be here!!1!!1');
				});
			}
			if (settings.lockdown) {
				// skip posting welcome messages while in lockdown mode
				return;
			}
			
			// generate a custom welcome message for the user
			let welcome = this.database.get('servers').get(serverID).welcome;
			if (!welcome) return;
			
			let {channel, role, message} = welcome;
			if (role) this.addToRole({serverID, userID: user.id, roleID: role});
			
			if (channel && message) {
				let context = new MessageContext(this, member.id, channel, message);
				this.send(channel, this.normalize(message, context));
			}
		} catch (e) {
			this.error(e);
		}
	}
	handleMemberRemove(member, WSMessage) {
		try {
			let data = WSMessage.d,
				serverID = data.guild_id,
				server = this.servers[serverID],
				user = this.users[data.user.id];

			// something's not right. member is undefined?
			if (!user) throw 'Invalid member: <@' + member.id + '>?';

			this.log(`${server.name} > ${md.atUser(user)} left.`);
			
			let settings = Moderation.get(this, server);
			if (settings.lockdown) {
				// skip goodbye messages while in lockdown mode
				return;
			}
			
			let welcome = this.database.get('servers').get(serverID).welcome;
			if (!welcome) return;
			let {channel = '', goodbye = ''} = welcome;
			if (!channel || !goodbye) return;
			
			let context = new MessageContext(this, user.id, channel, goodbye);
			this.send(channel, this.normalize(goodbye, context));
		} catch (e) {
			this.error(e);
		}
	}
	handleMessageCreate(user, userID, channelID, message, WSMessage) {
		// bot shouldn't respond to itself
		if (userID == this.id) {
			return;
		}
		// bot shouldn't handle automated messages, i.e. webhooks
		if (WSMessage && (WSMessage.d.webhook_id || WSMessage.d.application)) {
			return;
		}
		
		try {
			// create a Context object that describes the who/where/what of the message
			let context = new MessageContext(this, userID, channelID, message, WSMessage);
			
			if (context.server) {
				this.log(`${context.server.name} > ${md.atChannel(context.channel)} > ${md.atUser(context.user)}: ${context.message||'<empty>'}`);
			} else {
				this.log(`Direct Messages > ${md.atUser(context.user)}: ${context.message||'<empty>'}`);
			}

			// create an input block from the raw message, and if necessary, interpret it as a command
			let prefix = this.evalPrefix(context);
			let input = Parser.createBlock(context.message, !!prefix);
			return this.run(context, input).catch(e => this.error(e));
		} catch (e) {
			this.error(e);
		}
	}
	handleMessageUpdate(oldMessage, newMessage, WSMessage) {
		// bot shouldn't respond to itself
		if (newMessage.user_id == this.id) {
			return;
		}
		try {
			let context = new MessageContext(this, newMessage.user_id, newMessage.channel_id, newMessage.content, WSMessage);

			if (context.server) {
				this.log(`${context.server.name} > ${md.atChannel(context.channel)} > ${md.atUser(context.user)} edited their message: ${context.message}`);
			} else {
				this.log(`Direct Messages > ${md.atUser(context.user)} edited their message: ${context.message}`);
			}
			
			// TODO: do something with the new and old message
		} catch (e) {
			this.error(e);
		}
	}
	handleMessageReactionAdd(channelID, messageID, userID, emoji, WSMessage) {
		// bot shouldn't respond to itself
		if (userID == this.id) {
			return;
		}

		try {
			let context = new ReactionContext(this, userID, channelID, messageID, emoji, WSMessage);

			if (context.server) {
				this.log(`${context.server.name} > ${md.atChannel(context.channel)} > ${md.atUser(context.user)} reacted with ${md.emoji(context.emoji)}`);
			} else {
				this.log(`Direct Messages > ${md.atUser(context.user)} reacted with ${md.emoji(context.emoji)}`);
			}

			this.liveMessages.resolve(context);
		} catch (e) {
			this.error(e);
			console.log(channelID, messageID, userID, emoji);
		}
	}
	handleMessageReactionRemove(channelID, messageID, userID, emoji, WSMessage) {
		// bot shouldn't respond to itself
		if (userID == this.id) {
			return;
		}

		try {
			let context = new ReactionContext(this, userID, channelID, messageID, emoji, WSMessage);

			if (context.server) {
				this.log(`${context.server.name} > ${md.atChannel(context.channel)} > ${md.atUser(context.user)} removed their reaction ${md.emoji(context.emoji)}`);
			} else {
				this.log(`Direct Messages > ${md.atUser(context.user)} removed their reaction ${md.emoji(context.emoji)}`);
			}

			this.liveMessages.resolve(context);
		} catch (e) {
			this.error(e);
			console.log(channelID, messageID, userID, emoji);
		}
	}
	
	_cleanupMessage(payload) {
		if (!this._allowGlobalMentions) {
			// avoid mentioning @everyone/@here
			payload.replaceOnly(/@(everyone|here)/g, '[REMOVED]', ['message']);
		}
		if (!this._allowInviteLinks) {
			// avoid selfbots/adbots from being picked up in certain messages.
			// credit to I don't know who, but I'm thankful for this!
			payload.replaceOnly(/(http|https)?(:)?(\/\/)?(discordapp|discord|disco).(gg|io|me|com)\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!-/]))?/g, '[LINK REMOVED]', ['message']);
		}
		// remove my name and client token if it EVER shows up
		const CENSOR = new RegExp(__dirname.split('\\').slice(1,3).join('\\\\'), 'gi');
		return payload.replaceAll(CENSOR, '[REDACTED]')
		.replaceAll(this.internals.token, '[REDACTED]');
	}
}

//console.log(Utils.PrototypeChain(DragonBot));
module.exports = DragonClient;
