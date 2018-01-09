const MapBase     = require('./MapBase');
const Permissions = require('./Permissions');
const {Markdown:md,Format:fmt,random} = require('./Utils');

/**
	Session
	Stores ongoing data that persists after a command is ran.
	Persists until the session ends or the client disconnects.
	
	Sessions rely on message triggers. These triggers can be a string, regex, object, or function
*/
class Session {
	/**
		@class constructor
		@arg {Object} data - data that the session will use
	*/
	constructor({
		id,
		title = '',
		info = '',
		settings = {},
		data = {},
		permissions = {},
		resolver,
		events = {}
	}, sessionsManager) {
		if (!id || typeof(id) !== 'string') {
			throw new TypeError(`${this.constructor.name}() requires a string identifier`);
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
		if (typeof(resolver) !== 'function') {
			throw new TypeError(`${this.constructor.name}.resolver must be a function`);
		}
		if (typeof(events) !== 'object') {
			throw new TypeError(`${this.constructor.name}.events must be an object`);
		}
		
		Object.defineProperties(this, {
			'id': {
				value: id,
				writable: false,
				enumerable: false
			},
			'manager': {
				value: sessionsManager,
				writable: false,
				enumerable: false
			},
			'started': {
				value: Date.now(),
				writable: true,
				enumerable: false
			},
			'uses': {
				value: 0,
				writable: true,
				enumerable: false
			},
			'misses': {
				value: 0,
				writable: true,
				enumerable: false
			},
			'last_channel_id': {
				value: null,
				writable: true,
				enumerable: false
			}
		});
		
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
	}
	get elapsed() {
		return Date.now() - this.started;
	}
	set elapsed(x) {
		this.started = Date.now() - x;
	}
	get expired() {
		return this.settings.expires > 0 && this.elapsed > this.settings.expires;
	}
	hasEvent(event) {
		return typeof(this.events[event]) === 'function';
	}
	fire(event, ...args) {
		var eventFn = typeof(event) === 'function' ? event : this.events[event];
		return eventFn.apply(this, args);
	}
	close(input, reason) {
		if (input && reason && !this.settings.silent) {
			if (typeof(input.response) === 'undefined') {
				input.response = reason;
			} else if (typeof(input.response) === 'string') {
				input.response += '\n' + reason;
			}
		}
		this.fire('close');
	}
	resolve(input) {
		var grant = this.permissions.check(input);
		if (!grant.granted) {
			return input;
		}
		
		this.last_channel_id = input.channelID;
		try {
			var resolvedEvt = this.resolver.call(this, input);
		} catch (e) {
			input.error = e;
			input.response = ':warning: **Error**: ' + (e.message||e);
		} finally {
			if (resolvedEvt && this.hasEvent(resolvedEvt)) {
				this.uses++;
				var result = this.fire(resolvedEvt, input);
				if (result) {
					if (result instanceof Array) {
						result = random(result);
					}
					input.grant = 'granted';
					input.response = result;
				}
				if (this.uses == this.settings.max) {
					this.close(input, 'Max uses reached.');
				}
				if (this.settings.reset) {
					this.elapsed = 0;
				}
			} else {
				this.misses++;
				if (this.misses == this.settings.cancel) {
					this.close(input, 'Canceled.');
				} else if (this.silent) {
					input.response = '';
				}
			}
		}
		
		input.response = this.insertTitle(input.response);
		return input;
	}
	/**
		Insert title where appropriate
	*/
	insertTitle(x) {
		if (!x) {
			x = '';
		}
		if (typeof(this.title) === 'string' && this.title.length > 0) {
			if (typeof(x) === 'object') {
				if (typeof(x.message) === 'string') {
					x.message = md.bold(this.title) + ' | ' + x.message;
				} else {
					x.title = md.bold(this.title) + (x.title ? ' | ' + x.title : '');
				}
			} else if (typeof(x) === 'string') {
				x = md.bold(this.title) + ' | ' + x;
			}
		}
		return x;
	}
}

module.exports = Session;
