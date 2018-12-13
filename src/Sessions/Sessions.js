const Session       = require('./Session');
const Constants     = require('../Constants');
const FileCollector = require('../Structures/FileCollector');
const TypeMapBase   = require('../Structures/TypeMapBase');
const Logger        = require('../Debugging/LoggerMixin');

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
	 * Load default session files from a directory, then load session descriptors from each file
	 * @param {String}  [dir]                    - directory to load files from; defaults to current directory
	 * @param {Object}  [options]                - options for loading
	 * @param {Boolean} [options.recursive=true] - load session files in subfolders, too
	 * @param {RegExp}  [options.filter]         - filename filter to apply; defaults to `Constants.Sessions.FILE_REGEX`
	 */
	load(dir = __dirname, options = {}) {
		if (typeof(options.recursive) === 'undefined') {
			options.recursive = true;
		}
		if (typeof(options.filter) === 'undefined') {
			options.filter = Constants.Sessions.FILE_REGEX
		}
		let fc = new FileCollector();
		this.info('Loading sessions...');
		this.indent();
		fc.load(dir,options);
		fc.forEach((filename, file) => {
			this.start(file);
		});
		this.unindent();
		//this.info('Loading complete.');
	}
	_register(file) {
		this.start(file);
	}
	startTimer() {
		this.interval = setInterval(this.tick.bind(this), Constants.Sessions.POLL_TIME);
		this.notice('Interval started');
	}
	stopTimer() {
		clearInterval(this.interval);
		this.notice('Interval stopped');
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
	tick() {
		for (var s of this.sessions) {
			if (s.disabled) continue;
			if (s.expired) {
				if (!s.settings.silent && s.last_channel_id && s.events.goodbye) {
					this.client.send(s.last_channel_id, s.fire('goodbye'));
				}
				this.end(s.id);
			} else if ('tick' in s.events) {
				s.fire('tick', this.client);
			}
		}
	}
}

module.exports = Sessions;
