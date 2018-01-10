const FileCollector = require('./FileCollector');
const TypeMapBase   = require('./TypeMapBase');
const Session       = require('./Session');
const Logger        = require('./LoggerMixin');

const FILE_REGEX = /^spc_.+\.js$/; // "special" files
const POLL_TIME = 1000;

class Sessions extends Logger(TypeMapBase) {
	constructor(client) {
		super(Session);
		this.setProperties({
			interval: null,
			client
		});
	}
	get ids() {
		return this.keys;
	}
	get sessions() {
		return this.items;
	}
	/**
		Load default session files from a directory, then load session descriptors from each file
	*/
	load(dir = __dirname, recursive = true) {
		var sessions = this;
		var fc = new FileCollector();
		
		this.info('Loading sessions...');
		this.indent();
		fc.load(dir,recursive,FILE_REGEX);
		fc.forEach((filename, file) => {
			sessions.start(file);
		});
		this.unindent();
		//this.info('Loading complete.');
	}
	_register(filename, file) {
		this.start(file);
	}
	startSessionTimer() {
		this.interval = setInterval(this.checkExpirations.bind(this), POLL_TIME);
	}
	stopSessionTimer() {
		removeInterval(this.interval);
	}
	start(data = {}) {
		var id = data.id;
		if (!id) {
			return this.error('Session descriptor missing ID');
		}
		if (this.has(id)) {
			return this.error(`A session with with the ID ${id} already exists`);
		}
		if (data.filename) {
			this.info('Starting session',id,'from',data.filename);
		}
		var session = this.create(data, this);
		return this.set(id, session);
	}
	end(id) {
		if (!this.has(id)) {
			return this.error(`There is no session with the id ${id}`);
		}
		this.info('Ending session:', id);
		return this.delete(id);
	}
	resolve(input) {
		for (let s of this.sessions) {
			try {
				s.resolve(input);
				if (input.response) {
					this.info('Session returned:', s.id);
					break;
				}
			} catch (e) {
				this.warn(e);
				// ignore errors
			}
		}
		return input;
	}
	checkExpirations() {
		for (var s of this.sessions) {
			if (s.expired) {
				if (!s.silent && s.last_channel_id) {
					//this.client.send(s.last_channel_id, 'Session expired.');
				}
				this.end(s.id);
			}
		}
	}
}

module.exports = Sessions;
