const Constants   = require('../../Constants');
const Moderation  = require('../../Moderation');
const Permissions = require('../../Permissions');
const {Markdown:md,Date} = require('../../Utils');

module.exports = {
	id: 'message-moderator',
	info: 'Moderates incoming messages for spam and vulgarity.',
	permissions: 'public',
	resolver({client, server, member, userID, channelID, messageID, message, timestamp, attachments, embeds}) {
		// no moderation in DMs or for the server owner/moderators
		if (!server || userID == server.owner_id || Permissions.memberHasPrivilege(server, member)) return; 
		
		var M = Moderation.get(client, server);
		// observe messages for spam during lockdown/anti-raid mode
		if (M.lockdown) {
			let reason;
			if (/[@&]!?(\d+|here|everyone)/.test(message)) {
				reason = 'Mention during lockdown';
			} else if (timestamp.difference(M.observer[userID]) < 1000) {
				reason = 'Rapid spam during lockdown';
			} else if (attachments.length || embeds.length) {
				reason = 'File upload during lockdown';
			}
			if (reason) {
				client.deleteMessage({channelID,messageID});
				Moderation.kick(client, server, userID, client.id, reason);
				return void delete M.observer[userID];
			} else {
				M.observer[userID] = timestamp;
			}
		}
		
		if (!M.actions) return; // no moderation if no actions are set
		
		var offense = M.checkMessage(message, userID == server.owner_id);
		if (!offense) return;
		if (M.actions & Constants.Moderation.ACTIONS.DELETE) {
			client.deleteMessage({channelID,messageID});
		}
		if (M.actions & Constants.Moderation.ACTIONS.KICK) {
			Moderation.kick(client, server, userID, client.id, offense);
		} else if (M.actions & Constants.Moderation.ACTIONS.STRIKE) {
			Moderation.strike(client, server, userID, client.id, offense);
		}
		if (M.actions & Constants.Moderation.ACTIONS.REMIND) {
			return offense;
		}
	},
	events: {
		swearing({client, userID}) {
			return md.mention(userID) + ' please do not use swear words.';
		},
		heavy_swearing({client, userID}) {
			return md.mention(userID) + ' please do not use heavy swearing.';
		},
		racism({client, userID}) {
			return md.mention(userID) + ' please do not use racial/ethnic slurs.';
		},
		mentionspam({client, userID}) {
			return md.mention(userID) + ' please do not mention more than 2 people.';
		},
		linkspam({client, userID}) {
			return md.mention(userID) + ' please do not spam with untrusted links.';
		},
		letterspam({client, userID}) {
			return md.mention(userID) + ' please do not spam with repeated letters.';
		},
		capsspam({client, userID}) {
			return md.mention(userID) + ' please do not spam in all caps.';
		},
		emojispam({client, userID}) {
			return md.mention(userID) + ' please do not spam emojis.';
		},
		newlinespam({client, userID}) {
			return md.mention(userID) + ' please do not spam newlines.';
		},
		not_whitelisted_url({client, userID}) {
			return md.mention(userID) + ' please do not use links that are not whitelisted.';
		},
		blacklisted_url({client, userID}) {
			return md.mention(userID) + ' please do not use links that are blacklisted.';
		}
	}
};