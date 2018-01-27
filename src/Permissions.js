const Grant = require('./Grant');
const {Markdown:md}  = require('./Utils');

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
	Defines the rules for usage, such as who can use, where, and when.
	If permission is not granted, it will return the reason why.
*/
class Permissions {
	/**
		Permissions class constructor
		Ensures the given conditions are consistent; if not, it throws an error message
		@arg {Array<String>} [users] - array of usernames that something is exclusive to/excluded from
		 * Empty implies everyone can use
		@arg {Array<String>} [roles] - array of role names that something is exclusive to/excluded from
		 * Empty implies any role can use
		@arg {Array<String>} [channels] - array of channel names that something is exclusive to
		 * Empty implies it is usable everywhere
	*/
	constructor({ type = WHITELIST, users = [], roles = [], channels = [], servers = [] }, binding) {
		if (TYPES.indexOf(type) > -1) {
			this.type = type;
		} else {
			throw 'Invalid type: ' + type;
		}
		if (this.isPublic || this.isPrivate) {
			if (users.length > 0 || roles.length > 0 || channels.length || servers.length)
				throw 'Public/Private permissions cannot have blacklisted or whitelisted items.';
		}
		
		this.users    = users;
		this.roles    = roles;
		this.channels = channels;
		this.servers  = servers;
		
		if (binding) {
			this.binding = binding;
		}
	}
	set binding(b) {
		Object.defineProperty(this, '_obj', {
			value: b,
			writable: false
		});
	}
	get binding() {
		return this._obj;
	}
	get id() {
		let o = this._obj;
		return o.fullID || o.id || '(This)';
	}
	get isInclusive() {
		return this.type == WHITELIST;
	}
	get isExclusive() {
		return this.type == BLACKLIST;
	}
	get isPublic() {
		return this.type == PUBLIC;
	}
	get isPrivate() {
		return this.type == PRIVATE;
	}
	/**
		Inherit Permissions method
		Merges the items of the parameter with the current instance, then validates
		@arg {Permissions|Object} permissions
	*/
	inherit(permissions) {
		if (!(permissions instanceof Permissions)) {
			permissions = new Permissions(permissions);
		}
		
		this.checkForConflict(permissions);
		
		for (let t of TARGETS) {
			this[t] = this.merge(this[t], permissions[t]);
		}
	}
	checkForConflict(permissions) {
		let conflictStr = `${this.type == permissions.type ? 'Redundancy' : 'Paradox'}`
		let conflictType = `${this.type} vs ${permissions.type}`
		for (let u of this.users) {
		if (permissions.users.indexOf(u) > -1)
				throw `${conflictStr}: ${conflictType} for User #${u}`
		}
		for (let r of this.roles) {
			if (permissions.roles.indexOf(r) > -1)
				throw `${conflictStr}: ${conflictType} for Role #${r}`
		}
		for (let c of this.channels) {
			if (permissions.channels.indexOf(c) > -1)
				throw `${conflictStr}: ${conflictType} for Channel #${c}`
		}
		for (let s of this.servers) {
			if (permissions.servers.indexOf(s) > -1)
				throw `${conflictStr}: ${conflictType} for Server #${s}`
		}
	}
	/**
		Combine 'a' with 'b' such that 'b' contains no elements already found in 'a'
	*/
	merge(a, b) {
		if (b && b.length) {
			return a.concat(b.filter(x => a.indexOf(x) < 0));
		} else {
			return a;
		}
	}
	/**
		Filter 'a' such that it contains no elements in 'b'
	*/
	separate(a, b) {
		if (b && b.length) {
			return a.filter(x => b.indexOf(x) < 0);
		} else {
			return a;
		}
	}
	/**
		Checks that the arguments, user, and channel are permissed.
		@arg {Array<String>} args - Contains the arguments passed, or an empty array if otherwise
		@arg {String} uid - User ID
		@arg {String} cid - Channel ID
	*/
	check({client, user, channel, server, isDM}) {
		//this.log();
		
		// check bot ownership permission
		if (this.isPrivate) {
			if (user && user.id == client.ownerID) {
				return Grant.granted();
			} else {
				return Grant.denied(PRIVATE_STRING);
			}
		}
		
		// check unconditional permission
		if (this.isPublic) {
			return Grant.granted();
		}
		
		var users, roles, channels;
		if (isDM) {
			// DMs can be tricky...
			users = this.users;
			roles = [];
			channels = this.channels;
		} else {
			// check server right away
			if (server && this.servers.length > 0) {
				let hasServer = this.servers.includes(server.id);
				if (this.isExclusive && hasServer) {
					return Grant.denied(`This server is blacklisted.`);
				} else if (this.isInclusive && !hasServer) {
					return Grant.denied(`This server is not whitelisted.`);
				}
			}
			
			users = this.users.filter(u => !!server.members[u]);
			roles = this.roles.filter(r => !!server.roles[r]);
			channels = this.channels.filter(c => !!server.channels[c]);
		}
		
		// check users
		if (user && users.length > 0) {
			let hasUser = users.includes(user.id);
			if (this.isExclusive && hasUser) {
				return Grant.denied(`${md.mention(user.id)} is blacklisted from using that command.`);
			} else if (this.isInclusive && !hasUser) {
				return Grant.denied(`${md.mention(user.id)} is not whitelisted to use that command.`);
			}
		}
		
		// check roles
		if (user && roles.length > 0) {
			let userRoles = server.members[user.id].roles;
			let hasRole = roles.some(r => userRoles.includes(r));
			if (this.isExclusive && hasRole) {
				return Grant.denied(`One or more of ${md.mention(user.id)}'s roles is blacklisted: ${roles.map(r => server.roles[r].name).join(', ')}`);
			} else if (this.isInclusive && !hasRole) {
				return Grant.denied(`None of ${md.mention(user.id)}'s roles are whitelisted: ${roles.map(r => server.roles[r].name).join(', ')}`);
			}
		}
		
		// check channels
		if (channel && channels.length > 0) {
			let hasChannel = channels.includes(channel.id);
			if (this.isExclusive && hasChannel) {
				return Grant.denied(`This ${isDM?'DM channel':'channel'} is blacklisted: ${channels.map(md.channel).join(' ')}`);
			} else if (this.isInclusive && !hasChannel) {
				return Grant.denied(`This ${isDM?'DM channel':'channel'} is not whitelisted: ${channels.map(md.channel).join(' ')}`);
			}
		}
		
		// user is granted full permission to use the command
		return Grant.granted();
	}
	/**
		To String
		Translates permissions into an understandable format
		@arg {Server} server - the server reference
	*/
	toString(client, server) {
		if (this.isPrivate) {
			return PRIVATE_STRING;
		}
		
		if (this.isPublic) {
			return PUBLIC_STRING;
		}
		
		if (!server) {
			return 'Permissions can only be viewed on a server.';
		}
		
		let channels = this.channels.filter(c => !!server.channels[c]);
		let roles = this.roles.filter(r => !!server.roles[r]);
		let users = this.users.filter(u => !!server.members[u]);
		
		var temp = '';
		if (this.servers.length > 0 && this.servers.indexOf(server.id) > -1) {
			temp += `${this.isExclusive?'Excluded from':'Exclusive to'} ${md.bold(server.name)}` + '\n';
		}
		
		if (channels.length > 0) {
			temp += `${this.isExclusive?'Excluded':'Allowed only'} in these channels: ${channels.map(md.channel).join(' ')}` + '\n';
		}
		
		if (roles.length > 0) {
			temp += `${this.isExclusive?'Excludes':'Requires one of'} these roles: ${roles.map(md.role).join(' ')}` + '\n';
		}
		
		if (users.length > 0) {
			temp += `${this.isExclusive?'Excluded from':'Exclusive to'} these users: ${users.map(md.mention).join(' ')}` + '\n';
		}
		
		if (!temp) {
			temp = 'No permission settings';
		}
		
		return temp;
	}
	toDebugEmbed(client) {
		if (this.isPrivate) {
			return PRIVATE_STRING;
		}
		if (this.isPublic) {
			return PUBLIC_STRING;
		}
		
		function findServerWithChannel(channel) {
			channel = client.channels[channel] || channel;
			return client.servers[channel.guild_id] || null;
		}
		
		function findServerWithRole(role) {
			for (let sid in client.servers) {
				if (!!client.servers[sid].roles[role]) {
					return client.servers[sid];
				}
			}
			return null;
		}
		
		var temp = {
			title: `Permissions`,
			fields: []
		};
		try {
			if (this.servers.length > 0) {
				temp.fields.push({
					name: 'Servers',
					value: this.servers.map(s => client.servers[s].name).join('\n')
				});
			}
		} catch (e) {
			console.error(e);
		}
		
		try {
			if (this.channels.length > 0) {
				temp.fields.push({
					name: 'Channels',
					value: this.channels.map(c => client.channels[c]).map(c => `${client.servers[c.guild_id].name}#${c.name}`).join('\n')
				});
			}
		} catch (e) {
			console.error(e);
		}
		
		try {
			let servers = this.roles.map(findServerWithRole);
			if (this.roles.length > 0) {
				temp.fields.push({
					name: 'Roles',
					value: this.roles.map((r,i) => `${servers[i].name}@${servers[i].roles[r].name}`).join('\n')
				});
			}
		} catch (e) {
			console.error(e);
		}
		
		try {
			if (this.users.length > 0) {
				temp.fields.push({
					name: 'Users',
					value: this.users.map(u => client.users[u].username).join('\n')
				});
			}
		} catch (e) {
			console.error(e);
		}
		
		if (!temp) {
			temp = 'No permission settings';
		}
		
		return temp;
	}
	allow(p) {
		switch (this.type) {
			case PUBLIC:
			case PRIVATE:
				throw `${this.id} has ${this.type} accessibility.`;
			case WHITELIST:
				for (let t of TARGETS) {
					this[t] = this.merge(this[t], p[t]);
				}
				break;
			case BLACKLIST:
				for (let t of TARGETS) {
					this[t] = this.separate(this[t], p[t]);
				}
				break;
		}
		return this;
	}
	deny(p) {
		switch (this.type) {
			case PUBLIC:
			case PRIVATE:
				throw `${this.id} has ${this.type} accessibility.`;
			case WHITELIST:
				for (let t of TARGETS) {
					this[t] = this.separate(this[t], p[t]);
				}
				break;
			case BLACKLIST:
				for (let t of TARGETS) {
					this[t] = this.merge(this[t], p[t]);
				}
				break;
		}
		return this;
	}
	clear(p) {
		switch (this.type) {
			case PUBLIC:
			case PRIVATE:
				throw `${this.id} has ${this.type} accessibility.`;
			case WHITELIST:
			case BLACKLIST:
				for (let t of TARGETS) {
					this[t] = this.separate(this[t], p[t]);
				}
				break;
		}
		return this;
	}
	copy(p) {
		switch (this.type) {
			case PUBLIC:
			case PRIVATE:
				throw `${this.id} has ${this.type} accessibility.`;
			case WHITELIST:
			case BLACKLIST:
				this.type = p.type;
				for (let t of TARGETS) {
					this[t] = p[t].slice();
				}
				break;
		}
		return this;
	}
	invert() {
		switch (this.type) {
			case PUBLIC:
			case PRIVATE:
				throw `${this.id} has ${this.type} accessibility.`;
			case WHITELIST:
				this.type = BLACKLIST;
			case BLACKLIST:
				this.type = WHITELIST;
				break;
		}
		return this;
	}
	changeType(type) {
		if (TYPES.indexOf(type) == -1) {
			throw 'Invalid access type: ' + type;
		}
		if (type == this.type) {
			throw `${this.id} already uses ${this.type} accessibility.`;
		}
		this.type     = type;
		this.users    = [];
		this.roles    = [];
		this.channels = [];
		this.servers  = [];
		return this;
	}
	log() {
		console.log('\nPermissions:');
		console.log('-----------------------');
		console.log('Type:',this.type);
		console.log('Users:',this.users);
		console.log('Roles:',this.roles);
		console.log('Channels:',this.channels);
		console.log('Servers:',this.servers);
		console.log('-----------------------');
	}
}

module.exports = Permissions;
