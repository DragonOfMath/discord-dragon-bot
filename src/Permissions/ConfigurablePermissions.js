const Permissions = require('./Permissions');

/**
	Permissions class
	Defines the rules for using commands, such as acceptable number of arguments, who, where, and when.
	If permission is not granted, it will return the reason why.
*/
class ConfigurablePermissions extends Permissions {
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
	constructor(data, binding) {
		super(data, binding);
		
		Object.defineProperties(this, {
			'usesDefaultPermissions': {
				value: Object.keys(this.servers).length > 0,
				enumerable: false,
				writable: false
			}
		});
	}
	/**
		To String
		Translates permissions into an understandable format
		@arg {Client} client - the discord client
		@arg {Server} server - the server reference
	*/
	toString(client, server) {
		this.load(client);
		return super.toString(client, server);
	}
	embed(client, server) {
		this.load(client);
		return super.embed(client, server);
	}
	/**
		Checks that the arguments, user, and channel are permissed.
	*/
	check(handler) {
		//console.log('ConfigurablePermissions#check(handler)');
		this.load(handler.client);
		return super.check(handler);
	}
	load(client) {
		//console.log('ConfigurablePermissions#load(client)');
		if (this.usesDefaultPermissions || this.isPublic || this.isPrivate || this.isPrivileged || this.isInherited) {
			return this;
			//throw `${this.id} is using default permissions and cannot be changed.`;
		}
		var servers = client.database.get('permissions').get(this.id);
		if (servers) super.copy({servers});
		//console.log(this.servers);
		return this;
	}
	save(client) {
		//console.log('ConfigurablePermissions#save(client)');
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		if (this.isPublic || this.isPrivate || this.isPrivileged || this.isInherited) {
			throw `${this.id} uses ${this.type} accessibility.`;
		}
		if (client) {
			client.database.get('permissions').set(this.id, this.servers);
		}
		return this;
	}
	allow(client, data) {
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		if (client) this.load(client);
		super.allow(data);
		return this.save(client);
	}
	deny(client, data) {
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		if (client) this.load(client);
		super.deny(data);
		return this.save(client);
	}
	clear(client, data) {
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		if (client) this.load(client);
		super.clear(data);
		return this.save(client);
	}
	copy(client, data) {
		//console.log('ConfigurablePermissions#copy(client,data)');
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		if (client) this.load(client);
		super.copy(data);
		return this.save(client);
	}
	invert(client) {
		if (this.usesDefaultPermissions) {
			throw `${this.id} is using default permissions and cannot be changed.`;
		}
		if (client) this.load(client);
		super.invert();
		return this.save(client);
	}
}

module.exports = ConfigurablePermissions;
