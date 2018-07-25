const Resource  = require('./Resource');
const Grant     = require('./Grant');
const Constants = require('./Constants').Permissions;
const {Markdown:md,union,diff} = require('./Utils');

/** 
	@class ServerPermissions
	@extends Resource
	Defines a datatype for server-specific permissions
*/
class ServerPermissions extends Resource {
	constructor(serverData) {
		super(Constants.TEMPLATE, serverData);
	}
	get usersAsMarkdown() {
		return this.users.map(md.mention).join(', ');
	}
	get rolesAsMarkdown() {
		return this.roles.map(md.role).join(', ');
	}
	get channelsAsMarkdown() {
		return this.channels.map(md.channel).join(', ');
	}
	
	getUserNames(client) {
		return this.users.map(u => client.users[u].name).join(', ');
	}
	getRoleNames(server) {
		return this.roles.map(r => server.roles[r].name).join(', ');
	}
	getChannelNames(server) {
		return this.channels.map(c => server.channels[c].name).join(', ');
	}
	
	toString(client, server) {
		return '**Users**: ' + (this.getUserNames(client) || 'everyone')
		+ '\n**Roles**: '    + (this.getRoleNames(server) || 'all roles')
		+ '\n**Channels**: ' + (this.getChannelNames(server) || 'all channels');
	}
	embed(client, server) {
		return {
			title: server.name + ' - Permissions',
			fields: [
				{
					name: 'Users',
					value: this.usersAsMarkdown || 'everyone'
				},
				{
					name: 'Roles',
					value: this.rolesAsMarkdown || 'all roles'
				},
				{
					name: 'Channels',
					value: this.channelsAsMarkdown || 'all channels'
				}
			]
		};
	}
	add(data) {
		for (var t of Constants.TARGETS) {
			this[t] = union(this[t], data[t]);
		}
		return this;
	}
	remove(data) {
		for (var t of Constants.TARGETS) {
			this[t] = diff(this[t], data[t]);
		}
		return this;
	}
}

function makeAccessor(obj, prop, value) {
	return Object.defineProperty(obj, prop, {
		get: function () {return value},
		configurable: true,
		enumerable: false
	});
}

/**
	Permissions class
	Defines the rules for usage, such as who can use, where, and when.
	If permission is not granted, it will return the reason why.
*/
class Permissions {
	constructor(data, binding) {
		this.servers = {};
		if (typeof(data) === 'object') {
			this.type = data.type;
			Permissions.prototype.copy.call(this, data);
		} else if (typeof(data) === 'string') {
			this.type = data;
		} else {
			this.type = Constants.TYPES.WHITELIST;
		}
		if (!this.constructor.resolveType(this.type)) {
			throw 'Invalid type: ' + this.type;
		}
		
		if (binding) this.binding = binding;
	}
	set binding(b) {
		makeAccessor(this, '_obj', b);
	}
	get binding() {
		return this._obj;
	}
	get id() {
		return (this._obj && (this._obj.fullID || this._obj.id)) || '(This)';
	}
	get inherited() {
		var p = this;
		while (p.isInherited && p.binding && p.binding.supercommand) {
			p = p.binding.supercommand.permissions;
		}
		return p;
	}
	
	get isInclusive() {
		return this.type == Constants.TYPES.WHITELIST;
	}
	get isExclusive() {
		return this.type == Constants.TYPES.BLACKLIST;
	}
	get isPublic() {
		return this.type == Constants.TYPES.PUBLIC;
	}
	get isPrivate() {
		return this.type == Constants.TYPES.PRIVATE;
	}
	get isPrivileged() {
		return this.type == Constants.TYPES.PRIVILEGED;
	}
	get isInherited() {
		return this.type === Constants.TYPES.INHERIT;
	}
	
	get(id) {
		return id in this.servers ? this.servers[id] : new ServerPermissions();
	}
	set(id, data) {
		if (id in this.servers) {
			this.servers[id].copy(data);
		} else {
			this.servers[id] = new ServerPermissions(data);
		}
	}
	
	/**
		Checks with the current server permissions for the given context.
	*/
	check({client, context}, serverStrictness = false) {
		//console.log('Permissions#check({client,context})');
		
		// check inheritance
		if (this.isInherited) {
			if (this.binding.supercommand) {
				return this.inherited.check({client, context});
			} else {
				throw 'Permissions cannot be inherited from nothing.';
			} 
		}
		
		// check bot ownership permission
		if (this.isPrivate) {
			if (context.user && context.user.id == client.ownerID) {
				return Grant.granted();
			} else {
				return Grant.denied(Constants.STRINGS.PRIVATE);
			}
		}
		
		// check privileged user permission
		if (this.isPrivileged) {
			// bot owner always has permissions
			if (context.user && context.user.id == client.ownerID) {
				return Grant.granted();
			}
			if (context.server && context.member) {
				if (Permissions.memberHasPermission(context.server, context.member, Constants.PRIVILEGED_PERMISSION)) {
					return Grant.granted();
				} else {
					return Grant.denied(`${md.mention(context.user)} does not have ${Constants.PRIVILEGED_PERMISSION}.`);
				}
			} else {
				return Grant.denied(`This command may only be used in a server by users with ${Constants.PRIVILEGED_PERMISSION}.`);
			}
		}
		
		// check unconditional, if the message is from a DM, or if the server has no permission settings
		if (this.isPublic || context.isDM) {
			return Grant.granted();
		}
		if (!(context.server.id in this.servers)) {
			if (serverStrictness) {
				return Grant.denied(`Server is not permissed.`);
			} else {
				return Grant.granted();
			}
		}
		
		// get permissions for the server
		var sp = this.servers[context.server.id];
		
		// check users
		if (context.user && sp.users.length > 0) {
			var hasUser = sp.users.includes(context.user.id);
			if (this.isExclusive && hasUser) {
				return Grant.denied(`${md.mention(context.user)} is blacklisted from using that command.`);
			} else if (this.isInclusive && !hasUser) {
				return Grant.denied(`${md.mention(context.user)} is not whitelisted to use that command.`);
			}
		}
		// check roles
		if (context.roles && sp.roles.length > 0) {
			var hasRole = sp.roles.some(r => context.member.roles.some(role => role.id == r));
			if (this.isExclusive && hasRole) {
				return Grant.denied(`One or more of ${md.mention(context.user)}'s roles is blacklisted: ${sp.getRoleNames(context.server)}`);
			} else if (this.isInclusive && !hasRole) {
				return Grant.denied(`None of ${md.mention(context.user)}'s roles are whitelisted: ${sp.getRoleNames(context.server)}`);
			}
		}
		// check channels
		if (context.channel && sp.channels.length > 0) {
			var hasChannel = sp.channels.includes(context.channel.id);
			if (this.isExclusive && hasChannel) {
				return Grant.denied(`This channel is blacklisted: ${sp.channelsAsMarkdown}`);
			} else if (this.isInclusive && !hasChannel) {
				return Grant.denied(`This channel is not whitelisted: ${sp.channelsAsMarkdown}`);
			}
		}
		
		// granted full permission to use the command
		return Grant.granted();
	}
	/**
		To String
		Translates permissions into an understandable format
		@arg {Server} server - the server reference
	*/
	toString(client, server) {
		if (this.isPrivate) {
			return Constants.STRINGS.PRIVATE;
		}
		
		if (this.isPublic) {
			return Constants.STRINGS.PUBLIC;
		}
		
		if (this.isPrivileged) {
			return Constants.STRINGS.PRIVILEGED;
		}
		
		if (this.isInherited) {
			var p = this.inherited;
			return p.toString(client, server) + `\n(inherited from ${p.id})`;
		}
		
		var str;
		if (this.isExclusive) {
			str = Constants.STRINGS.BLACKLIST;
		} else {
			str = Constants.STRINGS.WHITELIST;
		}
		if (server) {
			str += '\n' + this.get(server.id).toString(client, server);
		} else {
			str += '\n' + 'Permissions can only be viewed on a server.';
		}
		return str;
	}
	embed(client, server) {
		if (this.isPrivate) {
			return Constants.STRINGS.PRIVATE;
		}
		if (this.isPublic) {
			return Constants.STRINGS.PUBLIC;
		}
		if (this.isPrivileged) {
			return Constants.STRINGS.PRIVILEGED;
		}
		if (this.isInherited) {
			var p = this.inherited;
			var e = p.embed(client, server);
			e.footer = {text:`(inherited from ${p.id})`};
			return e;
		}
		
		var e = {
			title: 'Permissions',
			fields: []
		};
		for (var id in this.servers) {
			var server = client.servers[id];
			e.fields.push({
				name: server.name,
				value: this.servers[id].toString(client, server)
			});
		}
		if (e.fields.length == 0) {
			e.description = 'No permission settings.';
		}
		return e;
	}
	allow(data) {
		switch (this.type) {
			case Constants.TYPES.INHERIT:
			case Constants.TYPES.PUBLIC:
			case Constants.TYPES.PRIVATE:
			case Constants.TYPES.PRIVILGED:
				throw `${this.id} has ${this.type} accessibility.`;
			case Constants.TYPES.WHITELIST:
				for (var id in data.servers) {
					this.servers[id] = this.get(id).add(data.servers[id]);
				}
				break;
			case Constants.TYPES.BLACKLIST:
				for (var id in data.servers) {
					this.servers[id] = this.get(id).remove(data.servers[id]);
				}
				break;
		}
		return this;
	}
	deny(data) {
		switch (this.type) {
			case Constants.TYPES.INHERIT:
			case Constants.TYPES.PUBLIC:
			case Constants.TYPES.PRIVATE:
			case Constants.TYPES.PRIVILGED:
				throw `${this.id} has ${this.type} accessibility.`;
			case Constants.TYPES.WHITELIST:
				for (var id in data.servers) {
					this.servers[id] = this.get(id).remove(data.servers[id]);
				}
				break;
			case Constants.TYPES.BLACKLIST:
				for (var id in data.servers) {
					this.servers[id] = this.get(id).add(data.servers[id]);
				}
				break;
		}
		return this;
	}
	clear(data) {
		switch (this.type) {
			case Constants.TYPES.INHERIT:
			case Constants.TYPES.PUBLIC:
			case Constants.TYPES.PRIVATE:
			case Constants.TYPES.PRIVILGED:
				throw `${this.id} has ${this.type} accessibility.`;
			case Constants.TYPES.WHITELIST:
			case Constants.TYPES.BLACKLIST:
				for (var id in data.servers) {
					delete this.servers[id];
				}
				break;
		}
		return this;
	}
	copy(data) {
		//console.log('Permissions#copy(data)');
		switch (this.type) {
			case Constants.TYPES.INHERIT:
			case Constants.TYPES.PUBLIC:
			case Constants.TYPES.PRIVATE:
			case Constants.TYPES.PRIVILGED:
				throw `${this.id} has ${this.type} accessibility.`;
			case Constants.TYPES.WHITELIST:
			case Constants.TYPES.BLACKLIST:
			default:
				for (var id in this.servers) {
					delete this.servers[id];
				}
				if (data.servers) for (var id in data.servers) {
					this.servers[id] = new ServerPermissions(data.servers[id]);
				}
				break;
		}
		return this;
	}
	invert() {
		switch (this.type) {
			case Constants.TYPES.INHERIT:
			case Constants.TYPES.PUBLIC:
			case Constants.TYPES.PRIVATE:
			case Constants.TYPES.PRIVILGED:
				throw `${this.id} has ${this.type} accessibility.`;
			case Constants.TYPES.WHITELIST:
				this.type = Constants.TYPES.BLACKLIST;
				break;
			case Constants.TYPES.BLACKLIST:
				this.type = Constants.TYPES.WHITELIST;
				break;
		}
		return this;
	}
	
	static resolveType(type) {
		for (var key in Constants.TYPES) {
			if (key == type || Constants.TYPES[key] == type)
				return key;
		}
	}
	static getPermissionValue(flag) {
		flag = flag.toUpperCase();
		if (!(flag in Constants.FLAGS)) {
			throw 'Invalid permission ID: ' + flag;
		}
		return 1 << Constants.FLAGS[flag];
	}
	static memberHasPermission(server, member, flag) {
		if (member.id == server.owner_id) return true;
		var bitValue = this.getPermissionValue(flag);
		return member.roles.some(r => server.roles[r].permissions & bitValue === bitValue);
	}
}

module.exports = Permissions;
