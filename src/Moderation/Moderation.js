const ModSettings     = require('./ModSettings');
const ModerationError = require('./ModerationError');
const Offense         = require('./Offense');
const Permissions     = require('../Permissions/Permissions');
const Constants       = require('../Constants/Moderation');
const {Markdown:md,DiscordUtils} = require('../Utils');

/**
 * @class Moderation
 * Moderation utilities to keep the guilds sparkly clean.
 */
class Moderation {
	static getStaff(server) {
		return Permissions.getPrivilegedMembers(server);
	}

	static validateUser(client, server, user, modID) {
		user = user.id || user;
		user = md.userID(user) || user;
		if (!user || (server && !server.members[user])) {
			throw new ModerationError('Invalid user ID: ' + user);
		} else if (modID && user == modID) {
			throw new ModerationError('Target user cannot be yourself');
		} else if (user == client.id) {
			throw new ModerationError('Target user cannot be this bot');
		} else if (user == client.ownerID) {
			//throw new ModerationError('Target user cannot be this bot\'s owner');
		}
		return user;
	}
	static validateChannel(client, server, channel) {
		//this.validateServer(client, server);
		channel = channel.id || channel;
		channel = md.channelID(channel) || channel;
		if (!channel || (server && !server.channels[channel])) {
			throw new ModerationError('Invalid channel ID: ' + channel);
		}
		return channel;
	}
	static validateVoiceChannel(client, server, channel) {
		channel = channel.id || channel;
		channel = md.channelID(channel) || channel;
		let vchannels = DiscordUtils.getServerVoiceChannels(server);

		if (!channel || !vchannels.find(vc => vc.id == channel)) {
			throw new ModerationError('Invalid voice channel ID: ' + channel);
		}
		return channel;
	}
	static validateServer(client, server) {
		server = server.id || server;
		if (!(server in client.servers)) {
			throw new ModerationError('Invalid server ID: ' + server);
		}
		return server;
	}
	
	static table(client) {
		return client.database.get('moderation');
	}
	static get(client, server) {
		server = this.validateServer(client, server);
		return new ModSettings(this.table(client).get(server));
	}
	static set(client, server, settings) {
		server = this.validateServer(client, server);
		return this.table(client).set(server, settings);
	}
	static async modify(client, server, callback) {
		let serverID = this.validateServer(client, server);
		let table = this.table(client);
		let message;
		table.modify(serverID, settings => {
			settings = new ModSettings(settings);
			if (!settings.modlog.channelID) {
				settings.modlog.autoAssign(server);
			}
			message = callback(settings);
			return settings;
		});
		message = await message;
		table.save();
		return message;
	}
	
	static setArchiveChannel(client, server, channel) {
		channel = this.validateChannel(client, server, channel);
		return this.modify(client, server, settings => {
			settings.archiveID = channel;
		});
	}
	static getModlogChannel(client, server) {
		let settings = this.get(client, server);
		return settings.modlog.channelID;
	}
	static setModlogChannel(client, server, channel) {
		let channelID = this.validateChannel(client, server, channel);
		return this.modify(client, server, settings => {
			settings.modlog.channelID = channelID;
		});
	}
	static setLockdownMode(client, server, mode = false) {
		return this.modify(client, server, settings => {
			if (settings.lockdown = mode) {
				// observe the rate at which users post messages
				settings.observer = {};
			} else {
				delete settings.observer;
			}
			client.notice(`${server.name}: Lockdown is ${mode?'enabled':'disabled'}`);
		});
	}
	
	static async archive(client, server, channel, limit, flags) {
		let channelID = this.validateChannel(client, server, channel);
		let settings  = this.get(client, server);
		let archiveID = settings.archiveID;
		if (!archiveID) {
			throw new ModerationError('No archive channel set');
		}
		return client.moveMessages({
			from: channelID,
			to: archiveID,
			limit,
			before: client.channels[channe].last_message_id,
			filter: message => DiscordUtils.filterMessage(client, message, flags)
		});
	}
	static async cleanup(client, server, channel, limit, flags) {
		let channelID = this.validateChannel(client, server, channel);
		// retrieve all messages
		let messages = await client.getMessages({
			channelID,
			limit,
			filter: message => DiscordUtils.filterMessage(client, message, flags)
		});

		// delete messages
		if (!messages.length) {
			throw new ModerationError('No messages found');
		}
		client.notice(`Deleting ${messages.length} messages in ${channelID}...`);
		return client.deleteMessages({channelID, messageIDs: messages});
	}
	static async vckick(client, server, channel) {
		channel = this.validateVoiceChannel(channel);
		let users = await client.vckick(server, channel);
		return `${users.length} users removed from VC ${channel}.`;
	}
	
	static async doActions({client, server, user, channel, messageID}, offense) {
		if (!offense || !offense.actions) return;
		
		if (offense.removeable && channel && messageID) {
			await client.deleteMessage({
				channelID: channel.id,
				messageID: messageID
			});
		}

		if (offense.reportable) {
			return this.report(client, server, user.id, client.id, offense.toString());
		} else if (offense.bannable) {
			return this.ban(client, server, user.id, client.id, offense.toString());
		} else if (offense.softbannable) {
			return this.softban(client, server, user.id, client.id, offense.toString());
		} else if (offense.kickable) {
			return this.kick(client, server, user.id, client.id, offense.toString());
		} else if (offense.strikeable) {
			return this.strike(client, server, user.id, client.id, offense.toString());
		} else if (offense.mutable) {
			return this.mute(client, server, user.id, client.id, offense.toString());
		} else if (offense.warnable) {
			return this.warn(client, server, user.id, client.id, offense.toString());
		}
	}
	static getStrikes(client, server, user) {
		let userID = this.validateUser(client, server, user);
		return this.get(client, server).getUserStrikes(userID);
	}
	static setStrikes(client, server, user, strikes) {
		let userID = this.validateUser(client, server, user);
		return this.modify(client, server, settings => {
			return settings.setUserStrikes(userID, strikes);
		});
	}
	static async strike(client, server, userID, modID, reason) {
		userID = this.validateUser(client, server, userID, modID);
		return this.modify(client, server, settings => {
			let strikes = settings.addUserStrike(userID);
			let offense = new Offense('Strike ' + strikes, reason, settings.strikes.actions[strikes-1]);
			
			let message = md.mention(userID) + ' **Strike ' + strikes + ' ' + ':x:'.repeat(strikes) + '!';
			if (strikes >= 3) {
				settings.setUserStrikes(userID, 0);
				return client.ban({serverID: server.id, userID, reason})
				.then(() => settings.recordModlogIncident(client, modID, userID, 'Ban', reason))
				.then(() => message + ' You\'re out!');
			} else {
				settings.record(client, modID, userID, 'Strike', reason);
				if (strikes == 2) {
					message += ' Continue anymore and you are outta here.';
				} else {
					message += ' Continue with your behavior and you will receive another Strike.'
				}
				return message;
			}
		});
	}
	static async unstrike(client, server, userID, modID) {
		userID = this.validateUser(client, server, userID, modID);
		return this.modify(client, server, settings => {
			let strikes = settings.strikes[userID] || 0;
			if (strikes == 0) {
				return 'That user does not have any strikes on record.';
			} else {
				settings.strikes.unstrike(userID);
				return settings.recordModlogIncident(client, modID, userID, 'Strike Removed', `Current Strikes: ${strikes}`)
				.then(() => {
					return `${md.mention(userID)} one of your Strikes was removed. Keep up the good behavior and you won't receive one again.`;
				});
			}
		});
	}
	static async warn(client, server, userID, modID, reason) {
		userID = this.validateUser(client, server, userID, modID);
		if (!reason) {
			throw new ModerationError('Reason required for warning');
		}
		return this.modify(client, server, settings => {
			return settings.recordModlogIncident(client, modID, userID, 'Warning', reason)
			.then(() => client.notice(`${server.name} > User ${userID}: Warned for ${reason}`))
			.then(() => `${md.mention(userID)}, you have been issued a warning for ${md.bold(reason)}.`);
		});
	}
	static async getMuteRole(client, server, createIfMissing = false) {
		let muteRole = DiscordUtils.getServerRoles(server).find(role => {
			if (/^muted?/i.test(role.name)) {
				return role;
			}
		});
		if (!muteRole && createIfMissing) {
			try {
				muteRole = await client.createRole({
					serverID: server.id, 
					name: 'Mute',
					color: 0x505050,
					hoist: false,
					mentionable: false,
					permissions: {
						TEXT_SEND_MESSAGES: false,
						TEXT_SEND_TSS_MESSAGES: false,
						VOICE_CONNECT: false,
						VOICE_SPEAK: false
					}
				});
			} catch (e) {
				throw new ModerationError('Unable to create a mute role: ' + e);
			}
		}
		return muteRole;
	}
	static async mute(client, server, userID, modID, reason) {
		userID = this.validateUser(client, server, userID, modID);
		if (!reason) {
			throw new ModerationError('Reason required for muting');
		}
		let muteRole = await this.getMuteRole(client, server, true);

		let member = server.members[userID];
		if (member.roles.includes(muteRole.id)) {
			throw new ModerationError('User is already muted.');
		}

		return this.modify(client, server, settings => {
			return client.addToRole({
				serverID: server.id,
				userID: userID,
				roleID: muteRole.id
			})
			.then(() => settings.recordModlogIncident(client, modID, userID, 'Mute', reason))
			.then(() => client.notice(`${server.name} > User ${userID}: Muted for ${reason}`))
			.then(() => `${md.mention(userID)} has been muted for ${md.bold(reason)}.`);
		});
	}
	static async unmute(client, server, userID, modID, reason = '') {
		userID = this.validateUser(client, server, userID, modID);
		let muteRole = await this.getMuteRole(client, server);

		let member = server.members[userID];
		if (!member.roles.includes(muteRole.id)) {
			throw new ModerationError('User is not muted.');
		}

		return this.modify(client, server, settings => {
			return client.removeFromRole({
				serverID: server.id,
				userID: userID,
				roleID: muteRole.id
			})
			.then(() => settings.recordModlogIncident(client, modID, userID, 'Unmute', reason))
			.then(() => client.notice(`${server.name} > User ${userID}: Unmuted`))
			.then(() => `${md.mention(userID)} has been unmuted.`);
		});
	}
	static async kick(client, server, userID, modID, reason) {
		userID = this.validateUser(client, server, userID, modID);
		if (!reason) {
			throw new ModerationError('Reason required for kicking');
		}

		return this.modify(client, server, settings => {
			return client.kick({serverID: server.id, userID})
			.then(() => settings.recordModlogIncident(client, modID, userID, 'Kick', reason))
			.then(() => client.notice(`${server.name} > User ${userID}: Kicked for ${reason}`))
			.then(() => `${md.mention(userID)} has been kicked for ${md.bold(reason)}.`);
		});
	}
	static async ban(client, server, userID, modID, reason) {
		userID = this.validateUser(client, null, userID, modID);
		if (!reason) {
			throw new ModerationError('Reason required for banning');
		}
		return this.modify(client, server, settings => {
			return client.ban({serverID: server.id, userID, reason})
			.then(() => settings.recordModlogIncident(client, modID, userID, 'Ban', reason))
			.then(() => this.deleteInvitesByUser(client, server, userID))
			.then(() => client.notice(`${server.name} > User ${userID}: Banned for ${reason}`))
			.then(() => `${md.mention(userID)} has been :hammer: banned for ${md.bold(reason)}.`);
		});
	}
	static async unban(client, server, userID, modID) {
		userID = this.validateUser(client, null, userID, modID);
		return this.modify(client, server, settings => {
			return client.unban({serverID: server.id, userID})
			.then(() => settings.recordModlogIncident(client, modID, userID, 'Unban'))
			.then(() => client.notice(`${server.name} > User ${userID}: Unbanned.`))
			.then(() => `${md.mention(userID)} has been unbanned.`);
		});
	}
	static async softban(client, server, userID, modID, reason) {
		userID = this.validateUser(client, server, userID, modID);
		return this.modify(client, server, s => {
			return client.ban({serverID: server.id, userID, reason})
			.then(() => settings.recordModlogIncident(client, modID, userID, 'Softban'))
			.then(() => client.unban({serverID: server.id, userID}))
			.then(() => client.notice(`${server.name} > User ${userID}: Softbanned for ${reason}`))
			.then(() => `${md.mention(userID)} has been softbanned for ${md.bold(reason)}.`);
		});
	}
	
	/**
	 * Delete all server invites that were made by the specified user.
	 * This is to prevent "revenge" raids from banned users.
	 */
	static async deleteInvitesByUser(client, server, userID) {
		try {
			let invites = await client.getServerInvites(server.id);
			invites = invites.filter(invite => invite.inviter.id == userID);
			for (let invite of invites) {
				client.notice(`Deleting invite by ${md.atUser(invite.inviter)} in ${server.name}: ${invite.code}`);
				await client.deleteInvite(invite.code);
			}
		} catch (e) {
			// pay no attention to errors like these, they aren't useful yet
			//client.error(e);
		}
	}
	
	/**
	 * Deprecated. Don't know if it works or not.
	 * @param {Client} client - any client that uses discord.io
	 * @param {Snowflake} channelID 
	 * @param {*} limit 
	 * @param {*} format 
	 * @param {*} flags 
	 */
	static async collectMessages(client, server, channel, limit = 1000, format = 'json', flags) {
		let channelID = this.validateChannel(client, server, channel);
		let limit = Math.min(limit, 10000);
		let messages = await client.getMessages({
			channelID,
			limit,
			before: client.channels[channelID].last_message_id
		});
		messages = DiscordUtils.filterMessages(client, messages, flags);
		
		const Zlib = require('zlib');
			
		let buffer = '';
		if (format.toLowerCase() == 'json') {
			buffer = JSON.stringify(messages);
		} else {
			buffer = messages.map(m => `[ID:${m.id}]\n`+DiscordUtils.debugMessage(m)).join('\n');
		}
		return {
			file: Zlib.deflateSync(buffer),
			filename: `${channelID}-${client.channels[channelID].name}.${format}.zip`
		};
	}
}

module.exports = Moderation;
