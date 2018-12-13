const SessionError = require('./SessionError');
const Resource     = require('../Structures/Resource');
const Permissions  = require('../Permissions/Permissions');
const Constants    = require('../Constants');

/**
 * @class Session
 * @extends Resource
 * Stores ongoing data that persists after a command is ran.
 * Persists until the session ends or the client disconnects.
 * Can also be used for background scripts that trigger on
 * certain messages.
 * Can have a resolver function that checks messages before
 * firing an event; without one, it can just store data that
 * commands can use.
 * @prop {String} id - the unique identifier for the session
 * @prop {String} [category] - the category of the session (for grouping them)
 * @prop {String} [title]    - the title of the session, displayed on each message used by this
 * @prop {String} [info]     - the description of the session, for debugging
 * @prop {Object} [settings] - the usage settings for the session
 * @prop {Object} [data]     - the data to assign to this session
 * @prop {String|Object} [permissions] - the permission settings for this session
 * @prop {Boolean} [enabled=true] - to enable or disable this session
 */
class Session extends Resource {
	/**
	 * @class constructor
	 * @param {Object} descriptor - data that the session will use
	 */
	constructor(descriptor = {}, sessionManager = null) {
		super(Constants.Sessions.TEMPLATE, descriptor);
		
		this.permissions = new Permissions(descriptor.permissions || Constants.Permissions.PUBLIC, this);
		
		// assign last_channel_id to the first channel of the permissions
		// this is probably not safe
		if (this.permissions.type == 'inclusive') {
			var servers = Object.keys(this.permissions.servers);
			if (servers.length == 1) {
				this.last_channel_id = this.permissions.servers[servers[0]].channels[0];
			}
		}
		
		if (sessionManager) {
			this.manager = sessionManager;
		}
		
		Object.assign(this.events, {
			close() {
				this.manager.end(this.id);
			}
		});
		
		if ('init' in this.events) {
			this.fire('init');
		}
	}
	get disabled() {
		return !this.enabled;
	}
	set disabled(x) {
		this.enabled = !x;
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
		if (this.disabled) return;
		if (!this.resolver) return;
		
		var grant = this.permissions.check(handler, true);
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
