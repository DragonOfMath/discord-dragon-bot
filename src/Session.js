const MapBase     = require('./MapBase');
const Permissions = require('./Permissions');
const {Markdown:md,Format:fmt,random} = require('./Utils');

/**
	Session
	Stores ongoing data that persists after a command is ran.
	Persists until the session ends or the client disconnects.
	Can also be used for background scripts that trigger on
	certain messages.
	Can have a resolver function that checks messages before
	firing an event; without one, it can just store data that
	commands can use.
*/
class Session {
	/**
		@class constructor
		@arg {Object} data - data that the session will use
	*/
	constructor({
		id,
		category = '',
		title = '',
		info = '',
		settings = {},
		data = {},
		permissions = {},
		resolver,
		events = {}
	}, sessionsManager = null) {
		if (!id || typeof(id) !== 'string') {
			throw new TypeError(`${this.constructor.name}() requires a string identifier`);
		}
		if (typeof(category) !== 'string') {
			throw new TypeError(`${this.constructor.name}.category must be a string`);
		}
		if (typeof(title) !== 'string') {
			throw new TypeError(`${this.constructor.name}.title must be a string`);
		}
		if (typeof(info) !== 'string') {
			throw new TypeError(`${this.constructor.name}.info must be a string`);
		}
		if (typeof(settings) !== 'object') {
			throw new TypeError(`${this.constructor.name}.settings must be an object`);
		}
		if (typeof(data) !== 'object') {
			throw new TypeError(`${this.constructor.name}.data must be an object`);
		}
		if (typeof(permissions) !== 'object') {
			throw new TypeError(`${this.constructor.name}.permissions must be an object`);
		}
		if (typeof(resolver) !== 'undefined' && typeof(resolver) !== 'function') {
			throw new TypeError(`${this.constructor.name}.resolver must be a function if used`);
		}
		if (typeof(events) !== 'object') {
			throw new TypeError(`${this.constructor.name}.events must be an object`);
		}
		Object.defineProperties(this, {
			'id': {
				value: id,
				writable: false,
				enumerable: false
			}
		});
		
		this.manager = null;
		this.started = Date.now();
		this.uses    = 0;
		this.misses  = 0;
		this.last_channel_id = null;
		
		this.category = category;
		this.title = title;
		this.info  = info;
		
		this.permissions = new Permissions(permissions, this);
		
		// assign last_channel_id to the first channel of the permissions
		// this is probably not safe
		if (this.permissions.type == 'inclusive' && this.permissions.channels.length) {
			this.last_channel_id = this.permissions.channels[0];
		}
		
		// Default settings
		this.settings = Object.assign({
			expires: null,  // how much time the session lasts
			reset:   false, // reset expiration time when an event fires
			max:     -1,    // max number of uses before the session closes
			cancel:  -1,    // max number of misses before the session closes
			silent: true    // if a miss occurs, an error should not be displayed
		}, settings);
		
		// Data that can be used by the session triggers/events
		this.data = new MapBase(data);
		
		// The resolver function, which determines which events get used
		this.resolver = resolver;
		
		this.events = Object.assign({
			close() {
				this.manager.end(this.id);
			}
		}, events);
		
		if ('init' in this.events) {
			this.fire('init');
		}
	}
	get elapsed() {
		return Date.now() - this.started;
	}
	set elapsed(x) {
		this.started = Date.now() - x;
	}
	get remaining() {
		if (this.settings.expires > 0) {
			return this.settings.expires - this.elapsed;
		} else {
			return 0;
		}
	}
	set remaining(x) {
		this.elapsed = this.settings.expires - x;
	}
	get expired() {
		return this.settings.expires > 0 && this.elapsed > this.settings.expires;
	}
	hasEvent(event) {
		return typeof(this.events[event]) === 'function';
	}
	fire(event, ...args) {
		var eventFn = typeof(event) === 'function' ? event : this.events[event];
		return eventFn && eventFn.apply(this, args);
	}
	close(handler, reason) {
		if (handler && reason && !this.settings.silent) {
			handler.response.message += '\n' + reason;
		}
		this.fire('close');
	}
	resolve(handler) {
		if (!this.resolver) return;
		
		var grant = this.permissions.check(handler);
		if (!grant.granted) return;
		
		this.last_channel_id = handler.channelID;
		
		var resolvedEvt = this.resolver.call(this, handler);
		if (resolvedEvt && this.hasEvent(resolvedEvt)) {
			this.uses++;
			if (this.uses == this.settings.max) {
				this.close(handler, 'Max uses reached.');
			}
			if (this.settings.reset) {
				this.elapsed = 0;
			}
			var result = this.events[resolvedEvt].call(this, handler);
			if (result) {
				handler.grant = true;
				return handler.resolve(result).then(() => {handler.title = this.title});
			}
		} else {
			this.misses++;
			if (this.misses == this.settings.cancel) {
				this.close(handler, 'Canceled.');
			}
		}
	}
}

module.exports = Session;
