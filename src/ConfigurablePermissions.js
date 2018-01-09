const Permissions = require('./Permissions');

const PUBLIC    = 'public';    // no permissions
const WHITELIST = 'inclusive'; // whitelisted users
const BLACKLIST = 'exclusive'; // not blacklisted users
const PRIVATE   = 'private' ;  // bot owner only

const TYPES = [PUBLIC,WHITELIST,BLACKLIST,PRIVATE];
const TARGETS = ['users','roles','channels','servers'];

const PUBLIC_STRING = 'Public: usable by everyone, everywhere.';
const PRIVATE_STRING = 'Private: only the bot owner may use this.';

/**
	Permissions class
	Defines the rules for using commands, such as acceptable number of arguments, who, where, and when.
	If permission is not granted, it will return the reason why.
*/
module.exports = class ConfigurablePermissions extends Permissions {
	/**
		ConfigurablePermissions class constructor
		Ensures the given conditions are consistent; if not, it throws an error message
		@arg {Array<String>} [users] - array of usernames that a command is exclusive to/excluded from
		 * Empty implies everyone can use
		@arg {Array<String>} [roles] - array of role names that a command is exclusive to/excluded from
		 * Empty implies any role can use
		@arg {Array<String>} [channels] - array of channel names that a command is exclusive to
		 * Empty implies it is usable everywhere
	*/
	constructor(descriptor, binding) {
		super(descriptor, binding);
		
		Object.defineProperties(this, {
			'usesDefaultPermissions': {
				value: this.users.length > 0 || this.roles.length > 0 || this.channels.length > 0 || this.servers.length > 0,
				enumerable: false,
				writable: false
			}
		});
	}
	/**
		Checks that the arguments, user, and channel are permissed.
		@arg {Array<String>} args - Contains the arguments passed, or an empty array if otherwise
		@arg {String} uid - User ID
		@arg {String} cid - Channel ID
	*/
	check(input) {
		this.load(input.client);
		return super.check(input);
	}
	/**
		To String
		Translates permissions into an understandable format
		@arg {Server} server - the server reference
	*/
	toString(client, server) {
		this.load(client);
		return super.toString(client, server);
	}
	toDebugEmbed(client) {
		this.load(client);
		return super.toDebugEmbed(client);
	}
	load(client) {
		if (this.usesDefaultPermissions || this.isPublic || this.isPrivate) {
			return this;
			//throw `${this.id} is using default permissions and cannot be changed.`;
		}
		let temp = client.database.get('permissions').get(this.id);
		this.type     = temp.type || WHITELIST;
		this.users    = temp.users || [];
		this.roles    = temp.roles || [];
		this.channels = temp.channels || [];
		this.servers  = temp.servers || [];
		
		return this;
	}
	save(client) {
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		client.database.get('permissions').set(this.id, this);
		return this;
	}
	allow(client, p) {
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		this.load(client);
		super.allow(p);
		return this.save(client);
	}
	deny(client, p) {
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		this.load(client);
		super.deny(p);
		return this.save(client);
	}
	clear(client, p) {
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		this.load(client);
		super.clear(p);
		return this.save(client);
	}
	changeType(client, type) {
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		this.load(client);
		super.changeType(type);
		return this.save(client);
	}
}

