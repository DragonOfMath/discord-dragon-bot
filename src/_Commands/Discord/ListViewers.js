const MessageBrowser = require('../../Sessions/MessageBrowser');
const {Markdown:md,paginate,DiscordUtils} = require('../../Utils');

//['on|online','off|offline','i|idle','d|dnd','g|game'];
const ONLINE = '✅';
const IDLE = '💤';
const DND = '🔴';
const OFFLINE = '⚫';

const STATUS = {
	online: ONLINE,
	idle: IDLE,
	dnd: DND,
	offline: OFFLINE
};

class UserListViewer extends MessageBrowser {
	constructor(context, users, servers) {
		users = DiscordUtils.getObjects(users);
		if (!servers) {
			servers = [context.server];
		} else {
			servers = DiscordUtils.getObjects(servers);
		}
		super(context, users);
		this.server  = context.server;
		this.servers = servers;
		this.init();
	}
	init() {
		super.init();
		if (this.servers.length == 1) {
			this.options.displayName = 'Users in ' + this.server.name;
		}
		this.options.status = {};
		for (let s in STATUS) {
			this.options.status[s] = false;
		}
		this.updateEmbed();
	}
	handleUserAction({reaction, change, client, userID}) {
		for (let s in STATUS) {
			if (STATUS[s] == reaction) {
				this.options.status[s] = change > 0;
				return true;
			}
		}
	}
	sortByKey() {
		this.data = this.data.sort((a,b) => {
			if (a.id > b.id) return 1;
			if (a.id < b.id) return -1;
			return 0;
		});
	}
	sortByValue() {
		this.data = this.data.sort((a,b) => {
			if (a.username > b.username) return 1;
			if (a.username < b.username) return -1;
			return 0;
		});
	}
	updateEmbed() {
		super.updateEmbed();
		
		// create a status hash table because discord.io's User object does not have a status property
		let statuses = {};
		let noFilter = Object.keys(this.options.status).every(s => !this.options.status[s]);
		let users = this.data.filter(user => {
			let servers = DiscordUtils.getServersByUser(this.servers, user);
			if (!servers.length) return false;
			
			let member = servers[0].members[user.id];
			let status = member.status || 'offline';
			statuses[user.id] = status; // cache this status
			
			return noFilter || this.options.status[status];
		});
		
		// display each status counter
		let statusCount = {};
		for (let s in STATUS) {
			statusCount[s] = 0;
		}
		for (let id in statuses) {
			statusCount[statuses[id]]++;
		}
		
		this.embed.description = Object.keys(statusCount).map(s => `${statusCount[s]} ${s}`).join(' | ');
		
		// limit the page number
		let maxPages = Math.ceil(users.length / this.options.itemsPerPage);
		this.page = Math.min(this.page, maxPages);
		
		// generate the embed contents
		let embed = paginate(users, this.page, this.options.itemsPerPage, (_, i, user) => {
			return {
				name: user.id,
				value: `${md.atUser(user)} ${STATUS[statuses[user.id]]}`,
				inline: true
			};
		});
		this.embed.fields = embed.fields;
		this.embed.footer = embed.footer;
		
		return this.embed;
	}
}
UserListViewer.CONFIG = {
	displayName: 'Users',
	itemsPerPage: 15,
	canSort: true,
	interface: [ONLINE,IDLE,DND,OFFLINE]
};


class RoleListViewer extends MessageBrowser {
	constructor(context, roles, servers) {
		roles = DiscordUtils.getObjects(roles);
		if (!servers) {
			servers = [context.server];
		} else {
			servers = DiscordUtils.getObjects(servers);
		}
		super(context, roles);
		this.server  = context.server;
		this.servers = servers;
		this.init();
	}
	init() {
		super.init();
		if (this.servers.length == 1) {
			this.options.displayName = 'Roles in ' + this.server.name;
		}
		this.updateEmbed();
	}
	sortByKey() {
		this.data = this.data.sort((a,b) => {
			if (a.id > b.id) return 1;
			if (a.id < b.id) return -1;
			return 0;
		});
	}
	sortByValue() {
		this.data = this.data.sort((a,b) => {
			if (a.name > b.name) return 1;
			if (a.name < b.name) return -1;
			return 0;
		});
	}
	updateEmbed() {
		super.updateEmbed();
		
		let maxPages = Math.ceil(this.data.length / this.options.itemsPerPage);
		this.page = Math.min(this.page, maxPages);
		
		let embed = paginate(this.data, this.page, this.options.itemsPerPage, (_, i, role) => {
			let value;
			if (role.id in this.server.roles) {
				value = md.role(role);
			} else {
				let server = DiscordUtils.getServerByRole(this.servers, role);
				value = `${md.atRole(role)} (${server.name})`;
			}
			return {
				name: role.id,
				value,
				inline: true
			};
		});
		
		this.embed.fields = embed.fields;
		this.embed.footer = embed.footer;
		
		return this.embed;
	}
}
RoleListViewer.CONFIG = {
	displayName: 'Roles',
	itemsPerPage: 15,
	canSort: true
};


const CATEGORY = '🗂';
const TEXT     = '💬';
const VOICE    = '🔊';
const CHANNEL = {
	0: TEXT,
	2: VOICE,
	4: CATEGORY,
	//'text': TEXT,
	//'voice': VOICE,
	//'category': CATEGORY
};

class ChannelListViewer extends MessageBrowser {
	constructor(context, channels, servers) {
		channels = DiscordUtils.getObjects(channels);
		if (!servers) {
			servers = [context.server];
		} else {
			servers = DiscordUtils.getObjects(servers);
		}
		super(context, channels);
		this.servers = servers;
		this.server  = context.server;
		this.init();
	}
	init() {
		super.init();
		if (this.servers.length == 1) {
			this.options.displayName = 'Channels in ' + this.server.name;
		}
		this.options.types = {};
		for (let t in CHANNEL) {
			this.options.types[t] = false;
		}
		this.updateEmbed();
	}
	handleUserAction({reaction, change, client, userID}) {
		for (let type in CHANNEL) {
			if (CHANNEL[type] == reaction) {
				this.options.types[type] = change > 0;
				return true;
			}
		}
	}
	sortByKey() {
		this.data = this.data.sort((a,b) => {
			if (a.id > b.id) return 1;
			if (a.id < b.id) return -1;
			return 0;
		});
	}
	sortByValue() {
		this.data = this.data.sort((a,b) => {
			if (a.name > b.name) return 1;
			if (a.name < b.name) return -1;
			return 0;
		});
	}
	updateEmbed() {
		super.updateEmbed();
		
		let types = {};
		for (let t in CHANNEL) {
			types[t] = 0;
		}
		let noFilter = Object.keys(this.options.types).every(t => !this.options.types[t]);
		let channels = this.data.filter(channel => {
			types[channel.type]++;
			return noFilter || this.options.types[channel.type];
		});
		
		this.embed.description = Object.keys(types).map(t => `${types[t]} ${CHANNEL[t]}`).join(' | ');
		
		let maxPages = Math.ceil(channels.length / this.options.itemsPerPage);
		this.page = Math.min(this.page, maxPages);
		
		let embed = paginate(channels, this.page, this.options.itemsPerPage, (_, i, channel) => {
			let value;
			if (channel.id in this.server.channels) {
				value = `${channel.name} ${CHANNEL[channel.type]}`;
			} else {
				let server = DiscordUtils.getServerByChannel(this.servers, channel);
				value = `${channel.name} ${CHANNEL[channel.type]} (${server.name})`;
			}
			return {
				name: channel.id,
				value,
				inline: true
			};
		});
		
		this.embed.fields = embed.fields;
		this.embed.footer = embed.footer;
		
		return this.embed;
	}
}
ChannelListViewer.CONFIG = {
	displayName: 'Channels',
	itemsPerPage: 15,
	canSort: true,
	interface: [TEXT,VOICE,CATEGORY]
};


class ServerListViewer extends MessageBrowser {
	constructor(context, servers, user) {
		servers = DiscordUtils.getObjects(servers);
		super(context, servers);
		this.thisServer = context.server;
		this.users = context.client.users;
		this.init();
	}
	init() {
		super.init();
		if (this.user) {
			this.options.displayName = 'Servers shared with ' + md.atUser(this.user);
		}
		this.updateEmbed();
	}
	sortByKey() {
		this.data = this.data.sort((a,b) => {
			if (a.id > b.id) return 1;
			if (a.id < b.id) return -1;
			return 0;
		});
	}
	sortByValue() {
		this.data = this.data.sort((a,b) => {
			if (a.name > b.name) return 1;
			if (a.name < b.name) return -1;
			return 0;
		});
	}
	updateEmbed() {
		super.updateEmbed();
		
		let maxPages = Math.ceil(this.data.length / this.options.itemsPerPage);
		this.page = Math.min(this.page, maxPages);
		
		let embed = paginate(this.data, this.page, this.options.itemsPerPage, (_, i, server) => {
			let owner = this.users[server.owner_id];
			let size = server.member_count;
			let value;
			if (owner.id in this.thisServer.members) {
				value = `${server.name} (Owner: ${md.mention(owner)} | Size: ${size})`;
			} else {
				value = `${server.name} (Owner: ${md.atUser(owner)} | Size: ${size})`;
			}
			return {
				name: server.id,
				value,
				inline: true
			};
		});
		
		this.embed.fields = embed.fields;
		this.embed.footer = embed.footer;
		
		return this.embed;
	}
}
ServerListViewer.CONFIG = {
	displayName: 'Servers',
	itemsPerPage: 15,
	canSort: true
};

module.exports = {
	UserListViewer,
	RoleListViewer,
	ChannelListViewer,
	ServerListViewer
};
