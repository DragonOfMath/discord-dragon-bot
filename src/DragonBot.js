const DebugClient   = require('./DebugClient');
const Utils         = require('./Utils');
const Database      = require('./Database');
const Commands      = require('./Commands');
const Sessions      = require('./Sessions');
const VariableStore = require('./Variables');
const Constants     = require('./Constants');
const Analytics     = require('./Analytics');
const Context       = require('./Context');
const Parser        = require('./Parser');
const Handler       = require('./Handler');

const {Markdown:md} = Utils;

class DragonBot extends DebugClient {
	/**
		DragonBot constructor
		@arg {Object}    input
		@arg {String}    input.token       - client auth token
		@arg {Snowflake} input.ownerID     - my user ID
		@arg {Number}    input.permissions - calculated permissions number
	*/
	constructor({token,ownerID,source,permissions}) {
		super(token, false);
		this.ownerID     = ownerID;
		this.PERMISSIONS = permissions;
		this.PREFIX      = Constants.Symbols.PREFIX;
		
		this.VERSION     = require('../package.json').version;
		this.SOURCE_CODE = 'https://github.com/DragonOfMath/discord-dragon-bot/';
		
		this.utils  = Utils;
		this.parser = Parser;
		this.usage  = this.analytics = Analytics;
		this.db     = this.database  = new Database(this);
		this.cmds   = this.commands  = new Commands(this);
		this.spcs   = this.sessions  = new Sessions(this);
		this.vars   = this.variables = new VariableStore(this);
		
		this.on('ready',   this._connected);
		this.on('message', this._handle);
		this.on('guildCreate', this._joinedServer);
		this.on('guildDelete', this._leftServer)
		this.on('guildMemberAdd', this._greetUser);
		this.on('guildMemberRemove', this._goodbyeUser);
	}
	/**
		Getter for all server roles
	*/
	get roles() {
		var roles = {};
		for (var id in this.servers) {
			var server = this.servers[id];
			for (var rid in server.roles) {
				if (rid === id) continue; // @everyone
				roles[rid] = server.roles[rid];
			}
		}
		return roles;
	}
	/**
		Sets the text appearing under the bot's name in the list of users.
		@arg {String} name - string that follows "Playing"
	*/
	set presenceText(name) {
		this.setPresence({game:{name}, type: 1});
	}
	/**
		Prepares to stop the client
	*/
	stop() {
		super.stop();
		this.presenceText = 'Bye! \uD83D\uDC4B';
		this.wait(Constants.DragonBot.DISCONNECT_DELAY)
		.then(() => this.disconnect());
	}
	/**
		Deletes the bot's most recent message in the channel,
		but only if the message is "still in view"
		@arg {Snowflake} channelID - the channel ID in which to delete the bot's last message
	*/
	undo(channelID) {
		return this.getMessages({
			channelID,
			limit: Constants.DragonBot.LAST_COMMAND_LIMIT
		})
		.then(messages => messages.find(m => m.author.id == this.id))
		.then(message => {
			if (message) return this.deleteMessage({channelID, messageID: message.id});
		});
	}
	/**
		Finds a user's last command in the given channel and run it again
	*/
	redo(channelID, userID) {
		return this.getMessages({
			channelID,
			limit: Constants.DragonBot.LAST_COMMAND_LIMIT,
			before: this.channels[channelID].last_message_id
		})
		.then(messages => messages.find(m => {
			return (!userID || m.author.id == userID) &&
				(m.content.startsWith(this.PREFIX) &&
					!['redo','undo'].includes(m.content.substring(this.PREFIX.length).toLowerCase()));
		}))
		.then(m => {
			if (!m) return 'Command not found.';
			return this._handle(null, userID, channelID, m);
		});
	}
	/**
		Add a user to the bot's ignore list
	*/
	block(user, reason = '[no reason]') {
		return Promise.resolve(this.database.get('block').set(user.id, {reason}).save());
	}
	/**
		Remove a user from the bot's ignore list
	*/
	unblock(user) {
		return Promise.resolve(this.database.get('block').delete(user.id).save());
	}
	/**
		Replaces variable symbols with their values, and if possible, evaluates the expression.
		@arg {String} text - the string to normalize
		@arg {Context} context - the Context object
		@return the normalized text string
	*/
	normalize(text = '', context) {
		if (!context) throw 'Context not defined';
		if (typeof(text) !== 'string') return text;
		
		// define certain symbols and retrieve server vars
		var vars = Object.assign(this.getSymbols(context), this.variables.get(context.serverID));
		
		var matches = text.match(/\$[\w\d_]+/gi), value;
		if (matches) {
			//console.log(vars,matches);
			// insert variable values
			for (var v of matches) {
				value = vars[v.substring(1)];
				if (typeof(value) !== 'undefined') text = text.replace(v, value);
			}
		}
		
		// evaluate the %(...) expression
		if (text[0] == Constants.Symbols.EXPRESSION) {
			if (text[1] == Constants.Symbols.EXP_START && text.endsWith(Constants.Symbols.EXP_END)) {
				value = eval(text.substring(1));
				this.info('Evaluating expression:',text,'->',value);
				text = value;
			} else if ((text[1] == Constants.Symbols.ARR_START && text.endsWith(Constants.Symbols.ARR_END))
				    || (text[1] == Constants.Symbols.OBJ_START && text.endsWith(Constants.Symbols.OBJ_END))) {
				value = JSON.parse(text.substring(1));
				this.info('Parsing object:',text,'->',value);
				text = value;
			}
		}
		
		return text;
	}
	/**
		Symbols are specialized values that can be inserted into text messages.
		@arg {Context} context - the Context object
		@return Object containing symbol names/values
	*/
	getSymbols(context) {
		var date = new Date();
		return {
			// context
			user:        md.bold(context.user ? context.user.username : '?'),
			mention:     md.mention(context.user ? context.user.id : '@?'),
			channelname: md.bold(context.channel ? context.channel.name : '?'),
			channel:     md.channel(context.channel ? context.channel.id : '#?'),
			server:      md.bold(context.server ? context.server.name : '?'),
			// time
			ms:          String(date.valueOf()),
			time:        md.bold(date.toLocaleTimeString()),
			date:        md.bold(date.toLocaleDateString()),
			day:         md.bold(date.toLocaleDateString('en-US',{weekday:'long'})),
			month:       md.bold(date.toLocaleDateString('en-US',{month:'long'})),
			// misc
			me:          md.mention(this.id),
			owner:       md.mention(this.ownerID),
			version:     md.bold(this.VERSION),
			source:      md.bold(this.SOURCE_CODE),
			prefix:      md.code(this.PREFIX),
			random:      String(Math.random())
		};
	}
	/**
		Handles a user joining a server.
	*/
	_greetUser(member, WSMessage) {
		try {
			var data = WSMessage.d,
				serverID = data.guild_id,
				server = this.servers[serverID],
				user = this.users[member.id];
			
			this.log(md.atUser(user),'has joined',server.name);
			
			var welcome = this.database.get('servers').get(serverID).welcome;
			if (!welcome) return;
			var {channel = '', role = '', message = ''} = welcome;
			if (!channel || !message) return;
			
			var context = new Context(this, user.id, channel, message);
			this.send(channel, this.normalize(message, context))
			.then(() => {
				if (role) this.addToRole({serverID, userID: user.id, roleID: role});
			});
		} catch (e) {
			this.error(e);
		}
	}
	/**
		Handles a user leaving a server.
	*/
	_goodbyeUser(member, WSMessage) {
		try {
			// something's not right. member is undefined.
			var data = WSMessage.d,
				serverID = data.guild_id,
				server = this.servers[serverID],
				user = this.users[data.user.id];
			
			this.log(md.atUser(user),'has left',server.name);
			
			var welcome = this.database.get('servers').get(serverID).welcome;
			if (!welcome) return;
			var {channel = '', goodbye = ''} = welcome;
			if (!channel || !goodbye) return;
			
			var context = new Context(this, user.id, channel, goodbye);
			this.send(channel, this.normalize(goodbye, context));
		} catch (e) {
			this.error(e);
		}
	}
	/**
		Handles joining a new server.
	*/
	_joinedServer(server, WSMessage) {
		this.log(md.atUser(this),'has joined',server.name);
	}
	/**
		Handles leaving a server.
	*/
	_leftServer(server, WSMessage) {
		this.log(md.atUser(this),'has left',server.name);
	}
	/**
		Handles connecting the client.
	*/
	_connected() {
		super._connected();
		this.presenceText = `\uD83D\uDC32 | ${this.PREFIX}help`;
		this.sessions.startTimer();
		// Perform cleanup on the database
		//this.database.get('servers').gc(this.servers);
		//this.database.get('channels').gc(this.channels);
		//this.database.get('roles').gc(this.roles);
		//this.database.get('users').gc(this.users);
	}
	_disconnected() {
		super._disconnected();
		this.sessions.stopTimer();
	}
	/**
		Handles receiving a message, creates Context and parses command(s)
	*/
	_handle(user, userID, channelID, message, WSMessage) {
		// bot shouldn't respond to itself
		if (userID == this.id) {
			return;
		}
		// bot shouldn't handle automated messages
		if (WSMessage && (WSMessage.d.webhook_id || WSMessage.d.application)) {
			return;
		}
		// bot shouldn't respond to empty messages
		if (!message) {
			return;
		}
		
		try {
			var context = new Context(this, userID, channelID, message, WSMessage);
			
			// a mention at the start of the message will help prevent other bots from using the same message
			var mention = md.mention(this.id);
			if (typeof(context.message) === 'string') {
				if (context.message.startsWith(mention)) {
					context.message = context.message.substring(mention.length).trim();
				}
			}
			
			var input = Parser.parseCommand(context.message);
			return this.run(context, input).catch(e => this.error(e));
		} catch (e) {
			this.error(e);
			return Promise.reject(e);
		}
	}
	/**
		Run input with the given Context
		@arg {Context} context - see src/Context.js
		@arg {Block}   input   - see src/Parser.js
		@return A Promise for the handler
	*/
	run(context, input) {
		try {
			if (context.server) {
				this.log(`${context.server.name} > ${md.atChannel(context.channel)} > ${md.atUser(context.user)}: ${input.text||'<empty>'}`);
			} else {
				this.log(`Direct Messages > ${md.atUser(context.user)}: ${input.text||'<empty>'}`);
			}
			
			// bot shouldn't respond to anyone but the owner if set to ignore them
			if (this._ignoreUsers && !context.user.bot && context.userID != this.ownerID) {
				return Promise.resolve(0);
			}
			// bot shouldn't respond to other bots if set to ignore them
			if (this._ignoreBots && context.user.bot) {
				return Promise.resolve(0);
			}
			
			var handler = new Handler(context, input);
			if (input.args) {
				// create a copy of the args array with normalized values
				handler.args = input.args.map(a => this.normalize(a,context));
				handler.arg  = handler.args.map(String).join(' ');
			}
			
			// check the bot's block list
			let block = this.database.get('block');
			if (handler.cmd && block.has(context.userID)) {
				// politely remind the user they may not use the bot for commands anymore
				let message = ':no_entry_sign: ' + md.bold('You are blocked from using this bot\'s commands.')
					+ '\nReason: ' + md.italics(block.get(context.userID).reason);
				return this.send(context.userID, message);
			}
			
			// resolve command or special text
			return (handler.cmd ? this.commands : this.sessions).resolve(handler)
			// handle sending a message or uploading a file
			.then(() => {
				if (handler.error) {
					this.warn(handler.error);
				} else if (this.analytics._active && handler.command && handler.command.analytics && handler.grant == 'granted') {
					// analytics is updated if a command was successfully resolved
					this.analytics.push(this, handler.serverID, handler.cmd);
					// current session analytics
					this.analytics.pushTemp(handler.serverID, handler.cmd);
				}
				
				if (!handler.response || !(handler.response.message || handler.response.embed || handler.response.file)) {
					return;
				}
				
				handler.response.message = this.normalize(handler.response.message, handler.context);
				this.log(handler.response);
				
				return (handler.response.file ?
					this.upload(handler.channelID, handler.response.file, handler.response.filename, handler.response.message) :
					this.send(handler.channelID, handler.response.message, handler.response.embed))
				// delete temporary messages after a set duration
				.then(message => {
					if (typeof(message) !== 'object') return;
					// if the message expires, delete it after a set duration
					if (handler.response.expires) {
						return this.wait(Constants.DragonBot.TEMP_MSG_LIFETIME)
						.then(() => this.deleteMessage({
							channelID: handler.channelID,
							messageID: message.id
						}));
					}
				});
			})
			// send an error message if applicable
			.catch(e => {
				this.warn(e);
				return this.send(handler.channelID, '<:fuck:351198367835095040> Oopsie woopsie! UwU we made a fucky wucky! A wittle fucko boingo!\n' + md.codeblock(e.toString()));
			})
			// if this command is part of a metacommand, add a delay to prevent rate-limiting
			.then(() => this.wait(Constants.DragonBot.RATE_LIMIT_DELAY))
			.then(() => handler);
		} catch (e) {
			return Promise.reject(e);
		}
	}
}

module.exports = DragonBot;

//console.log(Utils.PrototypeChain(DragonBot));
