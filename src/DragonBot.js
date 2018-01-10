const DebugClient = require('./DebugClient');
const Utils       = require('./Utils');
const Database    = require('./Database');
const Commands    = require('./Commands');
const Sessions    = require('./Sessions');
const Analytics   = require('./Analytics');

const {Markdown:md} = Utils;

class DragonBot extends DebugClient {
	constructor({token,ownerID,prefix,version,source}) {
		super(token, false);
		this.ownerID = ownerID;
		this.PREFIX  = prefix;
		this.VERSION = version;
		this.SOURCE_CODE = source;
		
		this.utils    = Utils;
		this.database = new Database(this);
		this.commands = new Commands(this);
		this.sessions = new Sessions(this);
		
		this.on('ready',   this._connected);
		this.on('message', this._handle);
	}
	
	set presence(name) {
		this.setPresence({game: {name}});
	}
	
	parseInput(text) {
		let mentionStr  = md.mention(this.id);
		let usesPrefix  = text.startsWith(this.PREFIX);
		let usesMention = text.startsWith(mentionStr);
		if (usesPrefix || usesMention) {
			let input
			if (usesPrefix) {
				input = text.substring(this.PREFIX.length).trim();
			} else {
				input = text.substring(mentionStr.length).trim();
			}
			let [cmd, ...args] = input.split(' ');
			let arg = args.join(' ');
			let cmds = cmd.split('.');
			return { input, cmd, cmds, arg, args };
		} else {
			return text;
		}
	}
	
	commandify(cmd) {
		return '`' + this.PREFIX + cmd + '`';
	}
	
	stop() {
		super.stop();
		this.presence = 'Bye! \uD83D\uDC4B';
		this.wait(3000).then(()=>this.disconnect());
	}
	
	_connected() {
		super._connected();
		this.presence = `\uD83D\uDC32 | ${this.PREFIX}help`;
		this.sessions.startSessionTimer();
		/*
		for (let sid in this.servers) {
			var server = this.servers[sid];
			if (server.members[this.ownerID]) {
				this.send(sid, ':angry: Please do not add this bot to servers that do not include ' + md.mention(this.ownerID))
				.then(() => this.wait(5000))
				.then(() => this.leaveServer(sid));
			}
		}
		*/
	}

	_handle(user, userID, channelID, message) {
		// bot shouldn't respond to itself
		if (userID == this.id) {
			return;
		}
		if (this._ignoreUsers && userID != this.ownerID) {
			return;
		}
		
		// WHY????
		user = this.users[userID];
		
		var client    = this;
		var clientID  = this.id;
		var DMchannel = this.directMessages[channelID];
		var isDM = !!DMchannel;
		if (isDM) {
			//channelID = userID;
			var channel   = DMchannel;
			var serverID  = channelID;
			var server    = null;
		} else {
			var channel   = this.channels[channelID];
			var serverID  = channel.guild_id;
			var server    = this.servers[serverID];
		}
		var messageID = channel.last_message_id;
		
		// create an all-in-one data structure
		var input = {
			client,  clientID,
			user,    userID,
			channel, channelID,
			server,  serverID,
			message, messageID,
			isDM
		};
		
		// parse message into a command, if possible
		var c = this.parseInput(message);
		
		if (c == message) {
			// if the message was not a command, check with sessions
			this.sessions.resolve(input);
		} else {
			// resolve command
			Object.assign(input, c);
			this.commands.resolve(input);
		}
		
		// a response should be immediately handled
		if (input.response) {
			this.ln();
			this.log('Time:   ', new Date().toLocaleString());
			this.log('Channel:', input.channelID, input.channel.name);
			this.log('User:   ', input.userID,    input.user.username);
			this.log('Input:  ', input.message);
			//this.log('Output: ', input.response);
			this.send(channelID, input.response)
			.catch(e => {
				this.warn(e);
				return this.send(channelID, '<:fuck:351198367835095040> Uh oh! ' + e);
			});
		}
		
		// bad errors get logged
		if (input.error) {
			this.warn(input.error);
		}
		
		// analytics is updated if the command was successfully resolved
		if (input.cmd && input.grant == 'granted') {
			try {
				Analytics.push(this, input.serverID, input.cmd);
			} catch (e) {
				this.error('Analytics update failed.',e);
			}
		}
	}
}

module.exports = DragonBot;

//console.log(Utils.PrototypeChain(DragonBot));