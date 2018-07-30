const PromiseClient = require('./PromiseClient');
const Logger        = require('./LoggerMixin');
const FilePromise   = require('./FilePromise');
const {decircularize} = require('./Utils');

/**
	Debug Client helps log useful debugging information
*/
class DebugClient extends Logger(PromiseClient) {
	constructor(token, autorun) {
		super(token, autorun);
		this.STARTED = this.milliseconds;
		this._tryReconnect = false;
		this._suspend      = false;
		this._ignoreUsers  = true;
		this._ignoreBots   = true;
		
		//this.on('log',        this.info);
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
	
	ping(channelID) {
		let ref = this.milliseconds;
		return this.getLastMessage(channelID).catch(console.error).then(() => this.milliseconds - ref);
	}
	
	stop() {
		this._tryReconnect = false;
		this._suspend      = false;
		this._ignoreUsers  = true;
		this._ignoreBots   = true;
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
		this._ignoreBots   = false;
		this._tryReconnect = true;
		this._suspend      = false;
	}
	_disconnected() {
		if (this._suspend) {
			this.notice('Client suspended.');
		} else if (this._tryReconnect) {
			if (arguments.length) {
				console.log(...arguments);
			}
			this.warn('Client lost connection. Reconnecting...');
			this.connect();
		} else {
			this.info('Client stopped connection.');
			process.exit(0);
		}
	}
	
	snapshot(dir) {
		var data = decircularize(this);
		var time = new Date().toLocaleString().replace(/[:\\\/]/g,'-').replace(/\s+/g,'_');
		var filename = FilePromise.join(dir, `snapshot_${time}.json`);
		return FilePromise.createSync(filename, JSON.stringify(data, null, 4));
	}
}

module.exports = DebugClient;
