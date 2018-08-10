const Zlib         = require('zlib');
const emojiRegex   = require('emoji-regex')();
const Constants    = require('./Constants');
const Resource     = require('./Resource');
const DiscordUtils = require('./DiscordUtils');
const {
	Markdown:md,
	Format:fmt,
	escapeRegExp,
	isUpperCase,
	findEmojis,
	forEachAsync,
	mapAsync,
	diff,
	union
} = require('./Utils');

const Vulgarity = require('./static/vulgarity.json');
const Spam = {
	// bit 0 = 1
	mentionspam(x) {
		// using a global mention or 3+ single mentions
		try {
			let mentions = x.match(/<@!?\d+>/g) || [];
			return /@[here|everyone]/.test(x) || mentions.length >= 3;
		} catch (e) { return false; }
	},
	// bit 1 = 2
	linkspam(x) {
		// matches bit.ly and adf.ly links
		return /\w+\.ly\//.test(x);
	},
	// bit 2 = 4
	letterspam(x) {
		return x.length > 30 && /(.)\1{9,}/.test(x);
	},
	// bit 3 = 8
	capsspam(x) {
		// SPEAKING IN ALL CAPS FOR A LONG MESSAGE
		return x.length > 30 && /\w+/.test(x) && isUpperCase(x);
	},
	// bit 4 = 16
	emojispam(x) {
		// text must not contain more than 20 emojis
		try {
			let customEmojis  = x.match(/<:\w+:\d+>/g) || [];
			let defaultEmojis = x.match(emojiRegex) || [];
			return x.length > 40 && (customEmojis.length + defaultEmojis.length) > 20;
		} catch (e) { return false; }
	}
};
const SPAM_FILTERS = ['mentions','links','letters','caps','emojis'];

function validateTargetUser(client, server, userID, modID) {
	userID = md.userID(userID) || userID;
	if (!userID || (server && !server.members[userID])) {
		throw 'Invalid user ID.';
	} else if (modID && userID == modID) {
		throw 'You cannot target yourself.';
	} else if (userID == client.id) {
		throw 'You cannot target this bot.';
	} else if (userID == client.ownerID) {
		throw 'You cannot target this bot\'s owner.';
	}
	return userID;
}

class ModerationSettings extends Resource {
	constructor(settings) {
		super(Constants.Moderation.TEMPLATE, settings);
	}
	setArchiveChannel(archiveID) {
		return this.archiveID = archiveID;
	}
	setModlogChannel(modlogID) {
		return this.modlogID = modlogID;
	}
	setUserStrikes(userID, strikes) {
		if (strikes) {
			this.strikes[userID] = strikes;
		} else {
			delete this.strikes[userID];
		}
		return strikes;
	}
	addUserStrike(userID) {
		return this.strikes[userID] = (this.strikes[userID] || 0) + 1;
	}
	setVulgarityLevel(level) {
		switch (String(level)) {
			case '0':
			case 'none':
				level = 'NONE';
				break;
			case '1':
			case 'low':
			case 'light':
				level = 'LIGHT';
				break;
			case '2':
			case 'medium':
				level = 'MEDIUM';
				break;
			case '3':
			case 'heavy':
			case 'high':
				level = 'HEAVY';
				break;
		}
		this.vulgarity = Constants.Moderation.LEVELS[level];
		return level;
	}
	setSpamFilters(filters = []) {
		this.spam = 0;
		for (let f of filters) {
			let i = SPAM_FILTERS.indexOf(f.toLowerCase());
			if (i > -1) {
				this.spam |= 1 << i;
			}
		}
		return this.spam;
	}
	setActions(actions) {
		actions = actions instanceof Array ? actions : actions.split('+');
		this.actions = 0;
		for (let a of actions) {
			this.actions |= Constants.Moderation.ACTIONS[a.toUpperCase()];
		}
		return this.actions;
	}
	checkMessage(message) {
		let urls = message.match(/https?:\/\/[^\s]+/g);
		if (this.urls.blacklisted.length) {
			if (urls.some(u => this.urls.blacklisted.some(b => u.includes(b)))) {
				return 'blacklisted_url';
			}
		}
		if (this.urls.whitelisted.length) {
			if (!urls.every(u => this.urls.whitelisted.some(w => u.includes(w)))) {
				return 'not_whitelisted_url';
			}
		}
		let words = message.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/);
		let levels = Object.keys(Vulgarity);
		for (let i = 0, level; i < levels.length; i++) {
			level = levels[i];
			if (this.vulgarity > i && Vulgarity[level].some(word => words.includes(word))) {
				return level;
			}
		}
		levels = Object.keys(Spam);
		for (let i = 0, level; i < levels.length; i++) {
			level = levels[i];
			if ((this.spam & (1 << i)) && Spam[level](message)) {
				return level;
			}
		}
	}
	checkUser(user) {
		return this.names.find(n => {
			n = new RegExp(escapeRegExp(n), 'i');
			return n.test(user.name);
		});
	}
	modlog(client, modID, userID, issue, description = 'None') {
		if (!this.modlogID) {
			return Promise.resolve(0);
		}
		
		let embed = {
			title: `Moderation Log Case #${this.modlogCasenum++}`,
			timestamp: new Date(),
			fields: [
				{
					name: ':police_car: Issue',
					value: issue,
					inline: true
				},
				{
					name: ':cop: Moderator',
					value: md.mention(modID),
					inline: true
				}
			]
		};
		if (Array.isArray(userID)) {
			embed.fields.push({
				name: ':busts_in_silhouette: Users',
				value: userID.map(md.mention).join(', '),
				inline: true
			});
		} else {
			embed.fields.push({
				name: ':bust_in_silhouette: User',
				value: md.mention(userID),
				inline: true
			});
		}
		embed.fields.push({
			name: ':notepad_spiral: Notes',
			value: description,
			inline: false
		});
		
		return client.send(this.modlogID, embed);
	}
}

class Moderation {
	static get(client, server) {
		let _server = client.database.get('servers').get(server.id);
		return new ModerationSettings(_server.moderation);
	}
	static modify(client, server, callback) {
		let message;
		let table = client.database.get('servers');
		table.modify(server.id, _server => {
			_server.moderation = new ModerationSettings(_server.moderation);
			message = callback(_server.moderation, _server);
			return _server;
		});
		return Promise.resolve(message).then(m => {
			table.save();
			return m;
		});
	}
	
	static getArchiveChannel(client, server) {
		return this.get(client, server).archiveID;
	}
	static setArchiveChannel(client, server, channelID) {
		channelID = md.channelID(channelID) || channelID;
		if (!channelID || !server.channels[channelID]) {
			throw 'Invalid channel ID.';
		}
		return this.modify(client, server, s => {
			s.setArchiveChannel(channelID);
			return 'Archive channel set: ' + md.channel(channelID);
		});
	}
	
	static archive(client, server, channel, count, flags = []) {
		let channelID = channel.id || channel;
		let archiveID = this.getArchiveChannel(client, server);
		if (!archiveID) {
			throw 'No archive channel set.';
		}
		let lastMessageID = client.channels[channelID].last_message_id;
		return client.getMessages({
			channelID,
			limit: count,
			before: lastMessageID
		})
		.then(messages => DiscordUtils.filterMessages(client, messages, flags))
		.then(messages => {
			if (!messages.length) return;
			client.notice(`Archiving ${messages.length} messages in ${channelID}...`);
			// messages are in chronological order from newest to oldest
			return forEachAsync.call(messages.reverse(), message => {
				return client.send(archiveID,`From ${md.channel(channelID)}:`,DiscordUtils.embedMessage(message))
				.then(() => client.deleteMessage({channelID, messageID: message.id}));
			})
			.then(() => client.notice('Archiving done.'));
		})
		.then(() => `${fmt.plural('message',count)} archived in ${md.channel(archiveID)}.`);
	}
	static cleanup(client, channelID, limit, flags) {
		// retrieve all messages
		return client.getMessages({
			channelID,
			limit
		})
		// filter messages by user-specified flags and count down from the number of messages
		.then(messages => DiscordUtils.filterMessages(client, messages, flags))
		// delete messages
		.then(messages => {
			if (!messages.length) return;
			client.notice(`Deleting ${messages.length} messages in ${channelID}...`);
			return client.deleteMessages({channelID, messageIDs: messages});
		});
	}
	static snipe(client, channelID, userID) {
		userID = md.userID(userID) || userID;
		return client.getMessages({
			channelID,
			limit: client.messageCacheLimit
		})
		// find deleted message(s) by checking the message cache
		.then(messages => {
			let messageIDs = messages.map(m => m.id);
			let cache = client._messageCache[channelID] || {};
			let deletedMessages = [];
			// IDs go from oldest to newest
			for (let id in cache) {
				if (!messageIDs.includes(id) && (!userID || cache[id].author.id == userID)) {
					deletedMessages.push(cache[id]);
				}
			}
			if (deletedMessages.length) {
				let m = deletedMessages.pop();
				delete cache[m.id]; // don't snipe this message again
				return DiscordUtils.embedMessage(m);
			} else {
				throw 'No sniped messages found.';
			}
		});
	}
	
	static getModlogChannel(client, server) {
		return this.get(client, server).modlogID;
	}
	static setModlogChannel(client, server, channelID) {
		channelID = md.channelID(channelID) || channelID;
		if (!channelID || !server.channels[channelID]) {
			throw 'Invalid channel ID.';
		}
		return this.modify(client, server, s => {
			s.setModlogChannel(channelID);
			return 'Modlog channel set: ' + md.channel(channelID);
		});
	}
	
	static getStrikes(client, server, userID) {
		userID = validateTargetUser(client, server, userID);
		var strikes = this.get(client, server).strikes;
		return strikes[userID] || 0;
	}
	static setStrikes(client, server, userID, strikes) {
		return this.modify(client, server, s => {
			return s.setUserStrikes(userID, strikes);
		});
	}
	static strike(client, server, userID, modID, reason) {
		userID = validateTargetUser(client, server, userID, modID);
		if (!reason) {
			throw 'You must give a reason for issuing a strike.';
		}
		return this.modify(client, server, s => {
			let strikes = s.addUserStrike(userID);
			reason = `[Strike ${strikes}] ${reason}`;
			let message = md.mention(userID) + ' **Strike ' + strikes + ' ' + ':x:'.repeat(strikes) + '!';
			if (strikes > 3) {
				throw 'That user already has 3 strikes.';
			} else if (strikes == 3) {
				s.setUserStrikes(userID, 0);
				return client.ban({serverID: server.id, userID, reason})
				.then(() => {
					return s.modlog(client, modID, userID, 'Ban', reason);
				})
				.then(() => {
					return message + ' You\'re out!';
				});
			} else {
				if (modlogID) {
					client.send(modlogID, modlog(modID, userID, 'Strike', reason));
				}
				if (strikes == 2) {
					message += ' Continue anymore and you are outta here.';
				} else {
					message += ' Continue with your behavior and you will receive another Strike.'
				}
				return s.modlog(client, modID, userID, 'Strike', reason)
				.then(() => {
					return message;
				});
			}
		});
	}
	static unstrike(client, server, userID, modID) {
		userID = validateTargetUser(client, server, userID, modID);
		return this.modify(client, server, s => {
			let strikes = s.strikes[userID] || 0;
			if (strikes == 0) {
				return 'That user does not have any strikes on record.';
			} else {
				s.strikes[userID] = --strikes;
				if (strikes == 0) {
					delete s.strikes[userID];
				}
				return s.modlog(client, modID, userID, 'Strike Removed', `Current Strikes: ${strikes}`)
				.then(() => {
					return `${md.mention(userID)} one of your Strikes was removed. Keep up the good behavior and you won't receive one again.`;
				})
			}
		});
	}
	
	static warn(client, server, userID, modID, reason) {
		userID = validateTargetUser(client, server, userID, modID);
		if (!reason) {
			throw 'You must give a reason for warning a user.';
		}
		return this.modify(client, server, s => {
			return s.modlog(client, modID, userID, 'Warning', reason)
			.then(() => `${md.mention(userID)}, you have been issued a warning for ${md.bold(reason)}.`);
		});
	}
	static kick(client, server, userID, modID, reason) {
		userID = validateTargetUser(client, server, userID, modID);
		if (!reason) {
			throw 'You must give a reason for kicking a user.';
		}
		return this.modify(client, server, s => {
			return client.kick({serverID: server.id, userID})
			.then(() => s.modlog(client, modID, userID, 'Kick', reason))
			.then(() => `${md.mention(userID)} has been kicked for ${md.bold(reason)}.`);
		});
	}
	static ban(client, server, userID, modID, reason) {
		userID = validateTargetUser(client, null, userID, modID);
		if (!reason) {
			throw 'You must give a reason for banning a user.';
		}
		return this.modify(client, server, s => {
			return client.ban({serverID: server.id, userID, reason})
			.then(() => this.deleteInvitesByUser(client, server, userID))
			.then(() => s.modlog(client, modID, userID, 'Ban', reason))
			.then(() => `${md.mention(userID)} has been :hammer: banned for ${md.bold(reason)}.`);
		});
	}
	static massBan(client, server, userIDs, modID, reason) {
		return mapAsync.call(userIDs, id => this.ban(client, server, id, modID, reason)).then(msgs => msgs.join('\n'));
	}
	static unban(client, server, userID, modID) {
		userID = validateTargetUser(client, null, userID, modID);
		return this.modify(client, server, s => {
			return client.unban({serverID: server.id, userID})
			.then(() => s.modlog(client, modID, userID, 'Unban'))
			.then(() => `${md.mention(userID)} has been unbanned.`);
		});
	}
	static softban(client, server, userID, modID, reason) {
		userID = validateTargetUser(client, server, userID, modID);
		return this.modify(client, server, s => {
			return client.ban({serverID: server.id, userID, reason})
			.then(() => s.modlog(client, modID, userID, 'Softban'))
			.then(() => client.unban({serverID: server.id, userID}))
			.then(() => `${md.mention(userID)} has been softbanned for ${md.bold(reason)}.`);
		});
	}
	
	static setLockdownMode(client, server, mode = false) {
		return this.modify(client, server, s => {
			s.lockdown = mode;
			if (s.lockdown) {
				// observe the rate at which users post messages
				s.observer = {};
			} else {
				delete s.observer;
			}
		});
	}
	static setActions(client, server, actions) {
		return this.modify(client, server, s => {
			s.setActions(actions);
			return 'Set to ' + md.bold(actions.join(' + '));
		});
	}
	static setVulgarityLevel(client, server, level) {
		return this.modify(client, server, s => {
			level = s.setVulgarityLevel(level);
			return 'Set to ' + md.bold(level);
		});
	}
	static setSpamFilters(client, server, filters) {
		return this.modify(client, server, s => {
			s.setsSpamFilters(filters);
			return 'Set to ' + md.bold(filters.join(' + ')||'none');
		});
	}
	
	static listURLs(client, server) {
		let urls = this.get(client, server).urls;
		return {
			fields: [
				{
					name: 'Whitelisted',
					value: urls.whitelisted.join('\n') || 'None'
				},
				{
					name: 'Blacklisted',
					value: urls.blacklisted.join('\n') || 'None'
				}
			]
		};
	}
	static addWhitelistedURLs(client, server, urls) {
		return this.modify(client, server, s => {
			s.urls.blacklisted = diff(s.urls.blacklisted, urls);
			s.users.whitelisted = union(s.urls.whitelisted, urls);
			return 'Server URL whitelist updated.';
		});
	}
	static addBlacklistedURLs(client, server, urls) {
		return this.modify(client, server, s => {
			s.urls.whitelisted = diff(s.urls.whitelisted, urls);
			s.users.blacklisted = union(s.urls.blacklisted, urls);
			return 'Server URL blacklist updated.';
		});
	}
	static clearURLs(client, server) {
		return this.modify(client, server, s => {
			s.urls.whitelisted = [];
			s.urls.blacklisted = [];
			return 'Server URL whitelist/blacklist were cleared.';
		});
	}
	
	static listBannedNames(client, server) {
		let names = this.get(client, server).names;
		return {
			title: '',
			description: names.map(md.code).join(', ') || 'None'
		};
	}
	static clearBannedNames(client, server) {
		return this.modify(client, server, s => {
			s.names = [];
			return 'Server name filters were cleared.';
		});
	}
	static addBannedNames(client, server, names) {
		return this.modify(client, server, s => {
			s.names = union(s.names, names);
			return 'Server name filters updated.';
		});
	}
	static removeBannedNames(client, server, names) {
		return this.modify(client, server, s => {
			s.names = diff(s.names, names);
			return 'Server name filters updated.';
		});
	}
	
	/**
		Delete all server invites that were made by the specified user.
		This is to prevent "revenge" raids from banned users.
	*/
	static deleteInvitesByUser(client, server, userID) {
		return client.getServerInvites(server.id)
		.then(invites => {
			return forEachAsync.call(invites.filter(invite => invite.inviter.id == userID), invite => {
				client.notice(`Deleting invite by ${md.atUser(invite.inviter)} in ${server.name}: ${invite.code}`);
				return client.deleteInvite(invite.code);
			});
		})
		.catch(err => {
			// pay no attention to errors like these, they aren't useful yet
			//client.error(err);
		});
	}
	
	static collectMessages(client, channelID, limit = 1000, format = 'json', flags = []) {
		let limit = Math.min(limit, 10000);
		return client.getMessages({
			channelID,
			limit,
			before: client.channels[channelID].last_message_id
		})
		.then(messages => {
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
		});
	}
}

module.exports = Moderation;
