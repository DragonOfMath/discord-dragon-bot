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

const {Markdown:md} = Utils;

class DragonBot extends DebugClient {
	/**
		DragonBot constructor
		@arg {Object}    input
		@arg {String}    input.token       - client auth token
		@arg {Snowflake} input.ownerID     - my user ID
		@arg {String}    input.version     - bot version number
		@arg {String}    input.source      - bot source code link
		@arg {Number}    input.permissions - calculated permissions number
	*/
	constructor({token,ownerID,version,source,permissions}) {
		super(token, false);
		this.ownerID     = ownerID;
		this.VERSION     = version;
		this.SOURCE_CODE = source;
		this.PERMISSIONS = permissions;
		this.PREFIX      = Constants.Symbols.PREFIX;
		
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
		return this.getAll(channelID, 25)
		.then(messages => messages.find(m => m.author.id == this.id))
		.then(message => {
			if (message) return this.delete(channelID, message.id);
		});
	}
	/**
		Replaces variable symbols with their values, and if possible, evaluates the expression.
		@arg {String} text - the string to normalize
		@arg {Context} context - the Context object
	*/
	normalize(text = '', context) {
		if (!context) throw 'Context not defined';
		if (typeof(text) !== 'string') return text;
		
		// define certain symbols and retrieve server vars
		var vars = Object.assign({
			user:        md.bold(context.user ? context.user.username : '?'),
			mention:     md.mention(context.user ? context.user.id : '@?'),
			channelname: md.bold(context.channel ? context.channel.name : '?'),
			channel:     md.channel(context.channel ? context.channel.id : '#?'),
			server:      md.bold(context.server ? context.server.name : '?'),
			random:      String(Math.random()),
			me:          md.mention(this.id)
		}, this.variables.get(context.serverID));
		
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
		Handles a user joining a server.
	*/
	greetUser(member, WSMessage) {
		var data = WSMessage.d,
			serverID = data.guild_id,
			server = this.servers[serverID],
			user = this.users[member.id];
		
		var welcome = this.database.get('servers').get(serverID).welcome;
		if (!welcome) return;
		var {channel = '', message = ''} = welcome;
		if (!channel || !message) return;
		
		this.log(user.username,'has joined',server.name);
		
		var context = new Context(this, user.id, channel, message);
		this.send(channel, this.normalize(message, context));
	}
	/**
		Handles a user leaving a server.
	*/
	goodbyeUser(member, WSMessage) {
		var data = WSMessage.d,
			serverID = data.guild_id,
			server = this.servers[serverID],
			user = this.users[member.id];
			
		var welcome = this.database.get('servers').get(serverID).welcome;
		if (!welcome) return;
		var {channel = '', goodbye = ''} = welcome;
		if (!channel || !goodbye) return;
		
		this.log(user.username,'has left',server.name);
		
		var context = new Context(this, user.id, channel, message);
		this.send(channel, this.normalize(message, context));
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
		// bot shouldn't respond to anyone but the owner if set to ignore
		if (this._ignoreUsers && userID != this.ownerID) {
			return;
		}
		// a mention at the start of the message will help prevent other bots from using the same message
		var mention = md.mention(this.id);
		if (message.startsWith(mention)) {
			message = message.substring(mention.length).trim();
		}
		
		this.run(new Context(this, userID, channelID, message, WSMessage), CommandParser.parse(message))
		.catch(e => this.warn(e));
	}	
	/**
		Run input with the given Context
		@arg {Context} context - see src/Context.js
		@arg {Block}   input   - see src/CommandParser.js
	*/
	run(context, input) {
		if (typeof(input) !== 'object') {
			return Promise.reject(`Input not runnable: ${input} (${typeof input})`);
		}
		// prepare a data structure to hold all information about this message
		var data = Object.assign({
			context,
			response: null,
			error: null,
			grant: null,
			temp: false
		}, context, input);
		
		var client = this;
		function _send() {
			return client.send(data.channelID, data.response).then(_response).catch(_error);
		}
		function _response(m) {
			if (typeof(m) !== 'object') return;
			// self-destruct temporary messages
			if (data.temp) {
				return client.wait(Constants.DragonBot.TEMP_MSG_LIFETIME)
				.then(() => client.delete(data.channelID, m.id));
			}
		}
		function _error(e) {
			if (e.name && e.name == 'ResponseError') {
				client.warn(e.response.message);
				// https://discordapp.com/developers/docs/topics/opcodes-and-status-codes
				switch (e.statusCode) {
					case 400: // BAD REQUEST
					case 401: // UNAUTHORIZED
					case 403: // FORBIDDEN
					case 404: // NOT FOUND
					case 405: // METHOD NOT ALLOWED
						client.warn(e);
						break;
					case 429: // TOO MANY REQUESTS
						// handle rate-limiting
						client.warn('Retrying after',e.response.retry_after,'ms');
						return client.wait(e.response.retry_after).then(_send);
					case 502: // GATEWAY UNAVAILABLE
						client.warn(e);
						break;
					default:
						client.error(e);
						//client.warn('Resending...');
						//return _send();
				}
			} else {
				client.error(e);
				return client.send(data.channelID, '<:fuck:351198367835095040> Oopsie woopsie! UwU we made a fucky wucky! A wittle fucko boingo!\n' + md.codeblock(e.toString()));
			}
		}
		
		try {
			// create a copy of the array with normalized values
			data.args = input.args.map(a => this.normalize(a,context));
		} catch (e) {
			return _error(e);
		}
		
		// resolve command or special text
		return (data.cmd ? this.commands : this.sessions).resolve(data)
		.then(() => {
			if (data.error) {
				this.warn(data.error);
			} else if (data.cmd && !data.cmd.endsWith('.?') && data.grant == 'granted') {
				// analytics is updated if a command was successfully resolved
				Analytics.push(this, data.serverID, data.cmd);
			}
			
			if (typeof(data.response) !== 'undefined') {
				// a response should be immediately handled
				if (typeof(data.response) === 'string') {
					data.response = this.normalize(data.response, data.context);
				}
				return _send();
			} else {
				return Promise.resolve(data);
			}
		})
		.then(() => this.wait(Constants.DragonBot.RATE_LIMIT_DELAY))
		.then(() => data);
	}
}

module.exports = DragonBot;

//console.log(Utils.PrototypeChain(DragonBot));
