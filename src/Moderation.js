const Constants    = require('./Constants');
const Resource     = require('./Resource');
const DiscordUtils = require('./DiscordUtils');
const {Markdown:md,Format:fmt,isUpperCase} = require('./Utils');

const Vulgarity = require('./static/vulgarity.json');
const Spam = {
	linkspam(x) {
		// matches bit.ly and adf.ly links
		return /\w+\.ly\//.test(x);
	},
	letterspam(x) {
		return x.length > 30 && /(.)\1{9,}/.test(x);
	},
	capsspam(x) {
		return x.length > 30 && /\w+/.test(x) && isUpperCase(x);
	}
};

function modlog(modID, userID, type, description) {
	var embed = {
		title: 'Moderation Log ' + new Date().toLocaleString(),
		fields: [
			{
				name: ':cop: Moderator',
				value: md.mention(modID),
				inline: true
			},
			{
				name: ':bust_in_silhouette: User',
				value: md.mention(userID),
				inline: true
			},
			{
				name: ':police_car: Issue',
				value: type,
				inline: true
			},
			{
				name: ':notepad_spiral: Notes',
				value: description || 'None',
				inline: false
			}
		]
	};
	return embed;
}
function validateTargetUser(client, server, userID, modID) {
	userID = md.userID(userID) || userID;
	if (!userID || !server.members[userID]) {
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
function filterMessages(client, messages, flags) {
	var blacklist = {
		cmds:   flags.includes('-cmds')   || flags.includes('-c'),
		bot:    flags.includes('-bot')    || flags.includes('-b'),
		text:   flags.includes('-text')   || flags.includes('-t'),
		media:  flags.includes('-media')  || flags.includes('-m'),
		pinned: flags.includes('-pinned') || flags.includes('-p')
	};
	var whitelist = {
		cmds:   flags.includes('+cmds')   || flags.includes('+c'),
		bot:    flags.includes('+bot')    || flags.includes('+b'),
		text:   flags.includes('+text')   || flags.includes('+t'),
		media:  flags.includes('+media')  || flags.includes('+m'),
		pinned: flags.includes('+pinned') || flags.includes('+p')
	};
	return messages.filter(m => {
		if (m.content.startsWith(Constants.Symbols.PREFIX) && blacklist.cmds && !whitelist.cmds) {
			return false;
		}
		if (m.author.id == client.id && blacklist.bot && !whitelist.bot) {
			return false;
		}
		if (DiscordUtils.hasContent(m)) {
			if (blacklist.media && !whitelist.media) {
				return false;
			}
		} else {
			if (blacklist.text && !whitelist.text) {
				return false;
			}
		}
		if (m.pinned && blacklist.pinned && !whitelist.pinned) {
			return false;
		}
		return true;
	});
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
	setSpamLevel(level) {
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
		this.spam = Constants.Moderation.LEVELS[level];
		return level;
	}
	setActions(actions) {
		actions = actions instanceof Array ? actions : actions.split('+');
		this.actions = 0;
		for (var a of actions) {
			this.actions |= Constants.Moderation.ACTIONS[a.toUpperCase()];
		}
		return this.actions;
	}
	checkMessage(message) {
		var urls = message.match(/https?:\/\/[^\s]/g);
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
		var words = message.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/);
		var levels = Object.keys(Vulgarity);
		for (var i = 0, level; i < levels.length; i++) {
			level = levels[i];
			if (this.vulgarity > i && Vulgarity[level].some(word => words.includes(word))) {
				return level;
			}
		}
		var levels = Object.keys(Spam);
		for (var i = 0, level; i < levels.length; i++) {
			level = levels[i];
			if (this.spam > i && Spam[level](message)) {
				return level;
			}
		}
	}
}

class Moderation {
	static get(client, server) {
		var _server = client.database.get('servers').get(server.id);
		return new ModerationSettings(_server.moderation);
	}
	static modify(client, server, callback) {
		var message;
		client.database.get('servers').modify(server.id, _server => {
			_server.moderation = new ModerationSettings(_server.moderation);
			message = callback(_server.moderation, _server);
			return _server;
		}).save();
		return message;
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
	static archive(client, server, channelID, count, flags) {
		var archiveID = this.getArchiveChannel(client, server);
		if (!archiveID) {
			throw 'No archive channel set.';
		}
		var lastMessageID = client.channels[channelID].last_message_id;
		return client.getMessages({
			channelID,
			limit: count,
			before: lastMessageID
		})
		.then(messages => filterMessages(client, messages, flags))
		.then(messages => {
			if (!messages.length) return;
			client.notice(`Archiving ${messages.length} messages in ${channelID}...`);
			function loop() {
				var message = messages.pop(); // messages are in chronological order from newest to oldest
				return client.send(archiveID,`From ${md.channel(channelID)}:`,DiscordUtils.embedMessage(message))
				.then(() => client.deleteMessage({channelID, messageID: message.id}))
				.delay(3000)
				.then(() => {
					if (messages.length > 0) {
						return loop();
					} else {
						return client.notice('Archiving done.');
					}
				});
			}
			return loop();
		})
		.then(() => `${fmt.plural(count,'message')} archived in ${md.channel(archiveID)}.`);
	}
	static cleanup(client, channelID, limit, flags) {
		// retrieve all messages
		return client.getMessages({
			channelID,
			limit
		})
		// filter messages by user-specified flags and count down from the number of messages
		.then(messages => filterMessages(client, messages, flags))
		// delete messages
		.then(messages => {
			if (!messages.length) return;
			client.notice(`Deleting ${messages.length} messages in ${channelID}...`);
			return client.deleteMessages({channelID, messageIDs: messages});
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
			return 'You must give a reason for issuing a strike.';
		}
		return this.modify(client, server, s => {
			var modlogID = s.modlogID;
			
			var strikes = s.addUserStrike(userID);
			var message = md.mention(userID) + ' **Strike ' + strikes + ' ' + ':x:'.repeat(strikes) + '!';
			if (strikes > 3) {
				throw 'That user already has 3 strikes.';
			} else if (strikes == 3) {
				s.setUserStrikes(userID, 0);
				if (modlogID) {
					client.send(modlogID, modlog(modID, userID, '3-Strike Ban', reason));
				}
				return client.ban({serverID: server.id, userID, reason}).then(() => {
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
				return message;
			}
		});
	}
	static unstrike(client, server, userID, modID) {
		userID = validateTargetUser(client, server, userID, modID);
		return this.modify(client, server, s => {
			var modlogID = s.modlogID;
			var strikes = s.strikes[userID] || 0;
			if (strikes == 0) {
				return 'That user does not have any strikes on record.';
			} else {
				s.strikes[userID] = --strikes;
				if (strikes == 0) {
					delete s.strikes[userID];
				}
				if (modlogID) {
					client.send(modlogID, modlog(modID, userID, 'Strike Removed', `Strikes: ${strikes}`));
				}
				return `${md.mention(userID)} one of your Strikes was removed. Keep up the good behavior and you won't receive one again.`;
			}
		});
	}
	static warn(client, server, userID, modID, reason) {
		userID = validateTargetUser(client, server, userID, modID);
		if (!reason) {
			return 'You must give a reason for warning a user.';
		}
		var modlogID = this.getModlogChannel(client, server);
		if (modlogID) {
			client.send(modlogID, modlog(modID, userID, 'Warning', reason));
		}
		return `${md.mention(userID)} has been warned for ${md.bold(reason)}`;
	}
	static kick(client, server, userID, modID, reason) {
		userID = validateTargetUser(client, server, userID, modID);
		if (!reason) {
			return 'You must give a reason for kicking a user.';
		}
		var modlogID = this.getModlogChannel(client, server);
		if (modlogID) {
			client.send(modlogID, modlog(modID, userID, 'Kick', reason));
		}
		return client.kick({serverID: server.id, userID}).then(() => {
			return `${md.mention(userID)} has been kicked by ${md.mention(modID)} for ${md.bold(reason)}.`
		});
	}
	static ban(client, server, userID, modID, reason) {
		userID = validateTargetUser(client, server, userID, modID);
		var modlogID = this.getModlogChannel(client, server);
		if (modlogID) {
			client.send(modlogID, modlog(modID, userID, 'Ban', reason));
		}
		return client.ban({serverID: server.id, userID, reason}).then(() => {
			return `${md.mention(userID)} has been banned by ${md.mention(modID)} for ${md.bold(reason)}.`
		});
	}
	static unban(client, server, userID, modID) {
		userID = validateTargetUser(client, server, userID, modID);
		var modlogID = this.getModlogChannel(client, server);
		if (modlogID) {
			client.send(modlogID, modlog(modID, userID, 'Unban'));
		}
		return client.unban({serverID: server.id, userID}).then(() => {
			return `${md.mention(userID)} has been unbanned by ${md.mention(modID)}.`
		});
	}
	static setActions(client, server, actions) {
		return this.modify(client, server, s => {
			s.setVulgarityActions(actions);
			return 'Set to ' + md.bold(actions.join(' + '));
		});
	}
	static setVulgarityLevel(client, server, level) {
		return this.modify(client, server, s => {
			level = s.setVulgarityLevel(level);
			return 'Set to ' + md.bold(level);
		});
	}
	static setSpamLevel(client, server, level) {
		return this.modify(client, server, s => {
			level = s.setSpamLevel(level);
			return 'Set to ' + md.bold(level);
		});
	}
	static listURLs(client, server) {
		var urls = this.get(client, server).urls;
		return {
			fields: [
				{
					name: 'Whitelisted',
					value: urls.whitelisted.join('\n') || 'none'
				},
				{
					name: 'Blacklisted',
					value: urls.blacklisted.join('\n') || 'none'
				}
			]
		};
	}
	static addWhitelistedURLs(client, server, urls) {
		return this.modify(client, server, s => {
			s.urls.blacklisted = s.urls.blacklisted.filter(u => !urls.includes(u));
			for (var u of urls) {
				if (!s.urls.whitelisted.includes(u)) {
					s.urls.whitelisted.push(u);
				}
			}
			return 'Server URL whitelist updated.';
		});
	}
	static addBlacklistedURLs(client, server, urls) {
		return this.modify(client, server, s => {
			s.urls.whitelisted = s.urls.whitelisted.filter(u => !urls.includes(u));
			for (var u of urls) {
				if (!s.urls.blacklisted.includes(u)) {
					s.urls.blacklisted.push(u);
				}
			}
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
}

module.exports = Moderation;
