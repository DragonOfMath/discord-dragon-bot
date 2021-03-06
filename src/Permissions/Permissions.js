const Grant     = require('./Grant');
const Resource  = require('../Structures/Resource');
const Constants = require('../Constants/Permissions');
const {Markdown:md,union,diff} = require('../Utils');

/** 
 * @class ServerPermissions
 * @extends Resource
 * Defines a datatype for server-specific permissions
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

function copyData(perms, data) {
	for (var id in data.servers) {
		perms.servers[id] = new ServerPermissions(data.servers[id]);
	}
}

/**
 * Permissions class
 * Defines the rules for usage, such as who can use, where, and when.
 * If permission is not granted, it will return the reason why.
 */
class Permissions {
	constructor(data, binding) {
		this.servers = {};
		if (typeof(data) === 'object') {
			this.type = data.type;
			//this.copy(data);
			copyData(this, data);
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
		return this.type === Constants.TYPES.WHITELIST;
	}
	get isExclusive() {
		return this.type === Constants.TYPES.BLACKLIST;
	}
	get isPublic() {
		return this.type === Constants.TYPES.PUBLIC;
	}
	get isPrivate() {
		return this.type === Constants.TYPES.PRIVATE;
	}
	get isDmOnly() {
		return this.type === Constants.TYPES.DM_ONLY;
	}
	get isPrivileged() {
		return this.type === Constants.TYPES.PRIVILEGED;
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
		if (this.isInherited) {
			if (this.binding.supercommand) {
				return this.inherited.check({client, context});
			} else {
				throw 'Permissions cannot be inherited from nothing.';
			} 
		}
		if (this.isPublic || context.isDM || context.userID == client.ownerID) {
			return Grant.granted();
		}
		if (this.isPrivate) {
			return Grant.denied(Constants.STRINGS.PRIVATE);
		}
		if (this.isPrivileged) {
			if (context.server && context.member) {
				if (Permissions.memberHasPrivilege(context.server, context.member)) {
					return Grant.granted();
				} else {
					return Grant.denied(`${md.mention(context.user)} does not have ${Constants.PRIVILEGED_PERMISSION}.`);
				}
			} else {
				return Grant.denied(`This command may only be used in a server by users with ${Constants.PRIVILEGED_PERMISSION}.`);
			}
		}
		if (this.isDmOnly) {
			return Grant.denied(Constants.STRINGS.DM_ONLY);
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
		
		if (this.isDmOnly) {
			return Constants.STRINGS.DM_ONLY;
		}
		
		if (this.isInherited) {
			var p = this.inherited;
			if (p && p != this) {
				return p.toString(client, server) + `\n(inherited from ${p.id})`;
			}
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
		if (this.isDmOnly) {
			return Constants.STRINGS.DM_ONLY;
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
			default:
				throw `${this.id} has ${this.type} accessibility.`;
		}
		return this;
	}
	deny(data) {
		switch (this.type) {
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
			default:
				throw `${this.id} has ${this.type} accessibility.`;
		}
		return this;
	}
	clear(data) {
		switch (this.type) {
			case Constants.TYPES.WHITELIST:
			case Constants.TYPES.BLACKLIST:
				for (var id in data.servers) {
					delete this.servers[id];
				}
				break;
			default:
				throw `${this.id} has ${this.type} accessibility.`;
		}
		return this;
	}
	copy(data) {
		//console.log('Permissions#copy(data)');
		switch (this.type) {
			case Constants.TYPES.WHITELIST:
			case Constants.TYPES.BLACKLIST:
				for (var id in this.servers) {
					delete this.servers[id];
				}
				if (data.servers) copyData(this, data);
				break;
			default:
				throw `${this.id} has ${this.type} accessibility.`;
		}
		return this;
	}
	invert() {
		switch (this.type) {
			case Constants.TYPES.WHITELIST:
				this.type = Constants.TYPES.BLACKLIST;
				break;
			case Constants.TYPES.BLACKLIST:
				this.type = Constants.TYPES.WHITELIST;
				break;
			default:
				throw `${this.id} has ${this.type} accessibility.`;
		}
		return this;
	}
	
	static resolveType(type) {
		for (var key in Constants.TYPES) {
			if (key == type || Constants.TYPES[key] == type)
				return key;
		}
	}
	
	/* Discord Permission Methods */
	
	static getPermissionValue(flag) {
		if (typeof(flag) === 'string') {
			flag = flag.toUpperCase();
			if (flag in Constants.FLAGS) {
				flag = Constants.FLAGS[flag];
			} else if (flag in Constants.DISCORDIO_FLAGS) {
				return Constants.DISCORDIO_FLAGS[flag];
			} else {
				throw 'Invalid permission ID: ' + flag;
			}
		}
		return 1 << flag;
	}
	static memberHasPermission(server, member, flag) {
		if (member.id == server.owner_id) return true;
		var bitValue = this.getPermissionValue(flag);
		return member.roles.some(r => server.roles[r].permissions & bitValue === bitValue);
	}
	static memberHasPrivilege(server, member) {
		return this.memberHasPermission(server, member, Constants.PRIVILEGED_PERMISSION);
	}
	static getPrivilegedRoles(server) {
		let bit = this.getPermissionValue(Constants.PRIVILEGED_PERMISSION);
		let roles = [];
		for (let id in server.roles) {
			if (server.roles[id].permissions & bit === bit) {
				roles.push(id);
			}
		}
		return roles;
	}
	static getPrivilegedMembers(server) {
		let members = [];
		for (let id in server.members) {
			if (this.memberHasPrivilege(server, server.members[id])) {
				members.push(server.members[id]);
			}
		}
		return members;
	}
	static getPermissionNames(flags) {
		if (flags instanceof Array) {
			let permissions = Object.keys(Constants.FLAGS);
			let _permissions = Object.keys(Constants.DISCORDIO_FLAGS);
			return flags.map(flag => {
				return _permissions.find(perm => perm == flag || Constants.DISCORDIO_FLAGS[perm] == flag);
				//permissions.find(perm => perm == flag || Constants.FLAGS[perm] == flag);
			});
		}
		
		let permissions = [];
		for (let flag in Constants.DISCORDIO_FLAGS) {
			if (this.getPermissionValue(flag) & flags) {
				permissions.push(flag);
			}
		}
		
		return permissions;
	}
	static calculatePermissions(perms) {
		return perms.reduce((flags,x) => flags |= this.getPermissionValue(x), 0);
	}
}

module.exports = Permissions;
