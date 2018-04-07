const DebugClient   = require('./DebugClient');
const Utils         = require('./Utils');
const Database      = require('./Database');
const Commands      = require('./Commands');
const Sessions      = require('./Sessions');
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
		this.ownerID = ownerID;
		this.PREFIX  = Constants.Symbols.PREFIX;
		this.VERSION = version;
		this.SOURCE_CODE = source;
		this.PERMISSIONS = permissions;
		
		this.utils    = Utils;
		this.database = new Database(this);
		this.commands = new Commands(this);
		this.sessions = new Sessions(this);
		
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
		this.wait(3000).then(()=>this.disconnect());
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
		Replaces special text symbols with certain values such as the server name.
		Useful for dynamic greeting messages.
		@arg {String} text - the string to normalize
		@arg {Context} context - the Context object that normalizes the string
	*/
	normalize(text, context) {
		if (context.user) {
			text = text
			.replace(/\$user/gi, md.bold(context.user.username))
			.replace(/\$mention/gi, md.mention(context.user.id));
		}
		if (!context.isDM && context.channel) {
			text = text
			.replace(/\$channelname/gi, md.bold(context.channel.name))
			.replace(/\$channel/gi, md.channel(context.channel.id));
		}
		if (context.server) {
			text = text
			.replace(/\$server/gi, md.bold(context.server.name));
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
		var mention = Utils.Markdown.mention(this.id);
		if (message.startsWith(mention)) {
			message = message.substring(mention.length).trim();
		}
		
		this.run(new Context(this, userID, channelID, message), CommandParser.parse(message))
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
		
		// resolve command or special text
		return (data.cmd ? this.commands : this.sessions).resolve(data)
		.then(() => {
			if (data.error) {
				this.warn(data.error);
			} else if (data.cmd && !data.cmd.endsWith('.?') && data.grant == 'granted') {
				// analytics is updated if a command was successfully resolved
				Analytics.push(this, data.serverID, data.cmd);
			}
			
			if (!data.response) return Promise.resolve(data);
			
			// a response should be immediately handled
			if (typeof(data.response) === 'string') {
				data.response = this.normalize(data.response, data.context);
			}
			
			return this.send(data.channelID, data.response)
			.then(m => {
				// self-destruct temporary messages
				if (data.temp) {
					return this.wait(5000).then(() => this.delete(data.channelID, m.id));
				}
			})
			.catch(e => {
				// this is for when a network error *might* occur.
				//data.error = e;
				this.error(e);
				this.send(data.channelID, '<:fuck:351198367835095040> Oopsie woopsie! UwU we made a fucky wucky! A little fucko boingo!\n' + md.codeblock(e.toString()));
			});
		})
		.then(() => this.wait(1000))
		.then(() => data);
	}
}

module.exports = DragonBot;

//console.log(Utils.PrototypeChain(DragonBot));