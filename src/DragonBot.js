const DebugClient   = require('./DebugClient');
const Utils         = require('./Utils');
const Database      = require('./Database');
const Commands      = require('./Commands');
const Sessions      = require('./Sessions');
const VariableStore = require('./Variables');
const Constants     = require('./Constants');
const Analytics     = require('./Analytics');
const Context       = require('./Context');
const CommandParser = require('./CommandParser');
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
		this.parser = CommandParser;
		this.db     = this.database  = new Database(this);
		this.cmds   = this.commands  = new Commands(this);
		this.spcs   = this.sessions  = new Sessions(this);
		this.vars   = this.variables = new VariableStore(this);
		
		this.on('ready',   this._connected);
		this.on('message', this._handle);
		
		this.on('guildMemberAdd', this.greetUser);
		this.on('guildMemberRemove', this.goodbyeUser);
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
		this.wait(Constants.DragonBot.DISCONNECT_DELAY).then(()=>this.disconnect());
	}
	/**
		Deletes the bot's most recent message in the channel,
		but only if the message is "still in view"
		@arg {Snowflake} channelID - the channel ID in which to delete the bot's last message
	*/
	undo(channelID) {
		return this.getMessages({channelID,limit:25})
		.then(messages => messages.find(m => m.author.id == this.id))
		.then(message => {
			if (message) return this.deleteMessage({channelID, messageID: message.id});
		});
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
		if (text[0] == Constants.Symbols.EXPRESSION && text[1] == Constants.Symbols.EXP_START && text.endsWith(Constants.Symbols.EXP_END)) {
			value = eval(text.substring(1));
			this.info('Evaluating expression:',text,'->',value);
			text = value;
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
	greetUser(member, WSMessage) {
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
	goodbyeUser(member, WSMessage) {
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
		Handles connecting the client.
	*/
	_connected() {
		super._connected();
		this.presenceText = `\uD83D\uDC32 | ${this.PREFIX}help`;
		this.sessions.startSessionTimer();
		// Perform cleanup on the database
		//this.database.get('servers').gc(this.servers);
		//this.database.get('channels').gc(this.channels);
		//this.database.get('roles').gc(this.roles);
		//this.database.get('users').gc(this.users);
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
		if (WSMessage.d.webhook_id || WSMessage.d.application) {
			return;
		}
		
		// a mention at the start of the message will help prevent other bots from using the same message
		var mention = md.mention(this.id);
		if (message.startsWith(mention)) {
			message = message.substring(mention.length).trim();
		}
		
		try {
			var context = new Context(this, userID, channelID, message, WSMessage);
			var input = CommandParser.parse(message);
			this.run(context, input).catch(e => this.error(e));
		} catch (e) {
			this.error(e);
		}
	}
	/**
		Run input with the given Context
		@arg {Context} context - see src/Context.js
		@arg {Block}   input   - see src/CommandParser.js
		@return A Promise for the handler
	*/
	run(context, input) {
		try {
			this.log(`${context.server.name} > ${md.atChannel(context.channel)} > ${md.atUser(context.user)}: ${input.text||'<empty>'}`);
			
			// bot shouldn't respond to anyone but the owner if set to ignore them
			if (this._ignoreUsers && !context.user.bot && context.userID != this.ownerID) {
				return Promise.resolve(0);
			}
			// bot shouldn't respond to other bots if set to ignore them
			if (this._ignoreBots && context.user.bot) {
				return Promise.resolve(0);
			}
			
			var handler = new Handler(context, input);
			// create a copy of the args array with normalized values
			handler.args = input.args.map(a => this.normalize(a,context));
			handler.arg  = handler.args.map(String).join(' ');
			
			// resolve command or special text
			return (handler.cmd ? this.commands : this.sessions).resolve(handler)
			// handle sending a message or uploading a file
			.then(() => {
				if (handler.error) {
					this.warn(handler.error);
				} else if (handler.command && handler.command.analytics && handler.grant == 'granted') {
					// analytics is updated if a command was successfully resolved
					Analytics.push(this, handler.serverID, handler.cmd);
					Analytics.pushTemp(handler.serverID, handler.cmd); // current session analytics
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
