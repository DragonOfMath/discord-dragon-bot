const FileCollector = require('./FileCollector');
const TypeMapBase   = require('./TypeMapBase');
const Session       = require('./Session');
const Logger        = require('./LoggerMixin');
const Constants     = require('./Constants');

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
		fc.load(dir,recursive,Constants.Sessions.FILE_REGEX);
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
		this.interval = setInterval(this.checkExpirations.bind(this), Constants.Sessions.POLL_TIME);
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
		} else {
			this.info('Starting session:',id);
		}
		//this.info(data instanceof Session);
		var session = this.create(data);
		session.manager = this;
		if ('start' in session.events) {
			session.fire('start');
		}
		return this.set(id, session);
	}
	end(id) {
		if (!this.has(id)) {
			return this.error(`There is no session with the id ${id}`);
		}
		this.info('Ending session:', id);
		return this.delete(id);
	}
	resolve(handler) {
		var session, response;
		for (session of this.sessions) {
			try {
				response = session.resolve(handler);
				if (handler.grant) {
					this.info(session.id);
					return response;
				}
			} catch (e) {
				this.warn(e);
				// ignore errors
			}
		}
		return Promise.resolve(handler);
	}
	checkExpirations() {
		for (var s of this.sessions) {
			if (s.expired) {
				if (!s.settings.silent && s.last_channel_id && s.events.goodbye) {
					this.client.send(s.last_channel_id, s.fire('goodbye'));
				}
				this.end(s.id);
			} else if ('tick' in s.events) {
				s.events.tick(this.client);
			}
		}
	}
}

module.exports = Sessions;
