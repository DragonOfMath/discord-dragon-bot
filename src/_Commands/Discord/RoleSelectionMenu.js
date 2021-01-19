const LiveMessage = require('../../Sessions/LiveMessage');
const {Markdown:md,Format:fmt,DiscordUtils} = require('../../Utils');


/**
 * A LiveMessage that assigns roles to users via reactions.
 * @class
 * @extends LiveMessage
 * @prop {String} name - the name of the menu
 * @prop {Number} maxRoles - the maximum roles that a user can pick from this menu; 0 (default) for unlimited roles
 * @prop {Object} roles - object containing role IDs, reactions, and descriptions
 */
class RoleSelectionMenu extends LiveMessage {
	constructor(channelID, messageID, data) {
		super(channelID, messageID);
		this.persistent = true;
		this.fromJSON(data);
		this.updateEmbed();
		this.on('reaction', async (ctx) => {
			let {reaction, client, userID, server, change} = ctx;
			let role = this._reactionsToRoles[reaction];
			if (role) {
				this.reactions[reaction] = (this.reactions[reaction] || 0) + change;
				let userRoles = server.members[userID].roles.filter(r => r in this.roles);
				if (!(role in server.roles)) {
					client.error(`Role ${role} does not exist in ${server.id} anymore`);
					delete this.roles[role];
					await this.saveAndUpdate();
					
					if (this.messageUsers) await client.send(userID, `Whoops! Looks like you tried to select a nonexistent role in ${md.bold(server.name)}. I updated ${this.name} accordingly.`);
					return;
				}
				if (change > 0) {
					if (userRoles.includes(role)) {
						if (this.messageUsers) await client.send(userID, `You already have the role "${server.roles[role].name}" in ${md.bold(server.name)}.`);
						return;
					}
					if (this.maxRoles > 0 && userRoles.length >= this.maxRoles) {
						await this.removeReaction(client, reaction, userID);
						if (this.messageUsers) await client.send(userID, `You can only have (up to) ${fmt.plural('role',this.maxRoles)} from ${this.name} in ${md.bold(server.name)}.`);
						return;
					}
					try {
						await client.addToRole({userID,serverID:server.id,roleID:role});
						if (this.messageUsers) await client.send(userID, `You received the role "${server.roles[role].name}" in ${md.bold(server.name)}.`);
					} catch (e) {
						client.error(`Failed to add role ${role} to ${userID}\n`, e);
					}
					
				} else if (change < 0) {
					if (!userRoles.includes(role)) {
						//if (this.messageUsers) await client.send(userID, `You can't remove a role you don't have!`);
						return;
					}
					try {
						await client.removeFromRole({userID,serverID:server.id,roleID:role});
						if (this.messageUsers) await client.send(userID, `You removed the role "${server.roles[role].name}" from yourself in ${md.bold(server.name)}.`);
					} catch (e) {
						client.error(`Failed to remove role ${role} from ${userID}\n`, e);
					}
				}
			} else {
				client.warn('Ignoring reaction ' + reaction + ' to message ' + this.messageID);
			}
		});
	}
	async setupReactionInterface(client) {
		this._rebuildReactionMap();
		return super.setupReactionInterface(client, Object.keys(this._reactionsToRoles));
	}
	/**
	 * Add roles to the menu or change existing role data.
	 * @param {Discord.Client} client
	 * @param {Snowflake} serverID
	 * @param {Object} roles - mapping of role IDs to role reactions/descriptions, overwriting existing reactions if necessary
	 */
	async addRoles(client, serverID, roles) {
		let server = client.servers[serverID];
		let rolesAdded = [], rolesChanged = [], rolesMissing = [], rolesIgnored = [];
		for (let id in roles) {
			let role = roles[id];
			if (!(id in server.roles)) {
				rolesMissing.push(id);
				continue;
			} else if (id in this.roles) {
				if (role.reaction !== this.roles[id].reaction) {
					let _reactionID = this._reactionsToRoles[role.reaction];
					if (_reactionID && _reactionID !== id) {
						// another role is using this reaction
						rolesIgnored.push(id);
						continue;
					}
					this.roles[id].reaction = role.reaction;
					rolesChanged.push(id);
				}
			} else {
				this.roles[id] = role;
				rolesAdded.push(id);
			}
		}
		if (rolesAdded.length || rolesChanged.length) {
			await this.saveAndUpdate(client);
		}
		return {
			added: rolesAdded,
			changed: rolesChanged,
			missing: rolesMissing,
			ignored: rolesIgnored
		};
	}
	async removeRoles(client, serverID, roles) {
		let server = client.servers[serverID];
		roles = roles.map(role => role.id ?? role).filter(role => role in this.roles);
		for (let id of roles) {
			delete this.roles[id];
		}
		await this.saveAndUpdate(client);
		return roles;
	}
	async sortRoles(client, server, field = 'name', descending = false) {
		let sorted = {};
		let roleIDs = Object.keys(this.roles);
		let roles = roleIDs.map(id => server.roles[id]);
		if (field == 'reaction') {
			roles = roles.sort((r1,r2) => {
				r1 = this.roles[r1.id].reaction;
				r2 = this.roles[r2.id].reaction;
				return r1 > r2 ? 1 : r1 < r2 ? -1 : 0;
			});
		} else {
			roles = roles.sort((r1,r2) => r1[field] > r2[field] ? 1 : r1[field] < r2[field] ? -1 : 0);
		}
		if (descending) {
			roles = roles.reverse();
		}
		for (let role of roles) {
			sorted[role.id] = this.roles[role.id];
		}
		this.roles = sorted;
		await this.saveAndUpdate(client);
		return this;
	}
	/**
	 * Syncs reactions on the message, updates the message body/embed, and saves menu data to disk.
	 */
	async saveAndUpdate(client) {
		this._rebuildReactionMap();
		if (this.messageID) {
			await this.syncReactions(client, Object.keys(this._reactionsToRoles));
		}
		await super.saveAndUpdate(client);
		return this;
	}
	updateEmbed() {
		this.embed = this.embed || {};
		this.embed.title = 'Role Selection Menu: ' + this.name;
		if (this.color) {
			this.embed.color = this.color;
		} else {
			delete this.embed.color;
		}
		if (Object.keys(this.roles).length) {
			if (this.description) {
				this.embed.description = this.description;
			} else {
				this.embed.description = 'Apply/remove a role using the following reactions:';
			}
			this.embed.description += '\n\n';
			for (let id in this.roles) {
				let role = this.roles[id];
				this.embed.description += DiscordUtils.emojifyReaction(role.reaction);
				this.embed.description += ' = ' + md.role(id);
				if (role.description) {
					this.embed.description += ': ' + role.description;
				}
				this.embed.description += '\n';
			}
		} else {
			this.embed.description = '\n\nPlease wait while this menu is still being set up...';
		}
		
		if (this.maxRoles > 0) {
			this.embed.description += '\n' + md.italics('You may only pick up to ' + md.bold(fmt.plural('role', this.maxRoles)) + ' from this menu.');
		}
		
		return this.embed;
	}
	_rebuildReactionMap() {
		this._reactionsToRoles = {};
		for (let id in this.roles) {
			this._reactionsToRoles[this.roles[id].reaction] = id;
		}
	}
	toJSON(meta) {
		meta = super.toJSON(meta);
		meta.name = this.name;
		meta.color = this.color;
		meta.description = this.description;
		meta.maxRoles = this.maxRoles;
		meta.messageUsers = this.messageUsers;
		meta.roles = this.roles;
		return meta;
	}
	fromJSON(data = {}) {
		super.fromJSON(data);
		this.name = data.name ?? 'Roles';
		this.color = data.color ?? '';
		this.description = data.description ?? '';
		this.maxRoles = data.maxRoles ?? 0;
		this.messageUsers = data.messageUsers ?? false;
		this.roles = data.roles ?? {};
		this._rebuildReactionMap();
		return this;
	}
}

module.exports = RoleSelectionMenu;
