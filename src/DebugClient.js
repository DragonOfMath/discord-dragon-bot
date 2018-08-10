const Client        = require('./PromiseClient');
const Logger        = require('./LoggerMixin');
const FilePromise   = require('./FilePromise');
const {decircularize} = require('./Utils');

/**
	Debug Client helps log useful debugging information
*/
class DebugClient extends Logger(Client) {
	constructor() {
		super(...arguments);
		this.STARTED = this.milliseconds;
		
		this._tryReconnect = false;
		this._suspend      = false;
		this._ignoreUsers  = true;
		this._ignoreBots   = true;
		this._handleErrors = 1; // send to DMs
		
		this.MAX_RECONNECT_TRIES = 3;
		this._reconnectTries = 0;
		
		//this.on('log',        this.log);
		//this.on('ready',      this._connected);
		this.on('disconnect', this._disconnected);
	}
	
	get milliseconds() {
		return Date.now();
	}
	get uptime() {
		return this.milliseconds - this.STARTED;
	}
	get memory() {
		return process.memoryUsage();
	}
	
	get hb() {
		return this.internals._lastHB;
	}
	get ping() {
		return this.internals.ping;
	}
	latency(channelID) {
		let ref = this.milliseconds;
		return this.getLastMessage(channelID)
		.catch(() => {})
		.then(() => this.milliseconds - ref);
	}
	
	stop() {
		this._tryReconnect = false;
		this._suspend      = false;
		this._ignoreUsers  = true;
		this._ignoreBots   = true;
		this._reconnectTries = 0;
	}
	suspend(time) {
		this._tryReconnect = false;
		this._suspend      = true;
		this.disconnect();
		setTimeout(() => this.connect(), time);
	}
	_connected() {
		this.info('Client connected.');
		this._ignoreUsers  = false;
		//this._ignoreBots   = false;
		this._tryReconnect = true;
		this._suspend      = false;
		this._reconnectTries = 0;
	}
	_disconnected() {
		if (this._suspend) {
			this.notice('Client suspended.');
		} else if (this._tryReconnect) {
			if (arguments.length) {
				console.log(...arguments);
			}
			if (this._reconnectTries < this.MAX_RECONNECT_TRIES) {
				this.warn('Reconnecting...');
				this._reconnectTries++;
				this.connect();
			} else {
				this.error('Client can\'t connect due to a possible outage.');
				this._reconnectTries--;
				this.suspend(60000);
			}
		} else {
			this.info('Client stopped connection.');
			process.exit(0);
		}
	}
	
	/**
		Send a message that expires after a set amount of time.
	*/
	sendTemp(channelID, message, embed, timer) {
		return this.send(channelID, message, embed)
		.then(m => {
			let messageID = m.id;
			return this.wait(timer)
			.then(() => this.deleteMessage({channelID, messageID}));
		});
	}
	
	snapshot(dir) {
		var data = decircularize(this);
		var time = new Date().toLocaleString().replace(/[:\\\/]/g,'-').replace(/\s+/g,'_');
		var filename = FilePromise.join(dir, `snapshot_${time}.json`);
		return FilePromise.createSync(filename, JSON.stringify(data, null, 4));
	}
}

module.exports = DebugClient;
