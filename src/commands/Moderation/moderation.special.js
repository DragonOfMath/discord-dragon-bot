const Constants  = require('../../Constants');
const Moderation = require('../../Moderation');
const {Markdown:md} = require('../../Utils');

module.exports = {
	id: 'message-moderator',
	info: 'Moderates incoming messages for spam and vulgarity.',
	permissions: 'public',
	resolver({client, server, userID, channelID, messageID, message}) {
		if (!server) return; // no moderation in DMs
		var M = Moderation.get(client, server.id);
		if (!M.actions) return; // no moderation if no actions are set
		
		var offense = M.checkMessage(message);
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
			return md.mention(userID) + ' please do not use racial and ethnic slurs.';
		},
		linkspam({client, userID}) {
			return md.mention(userID) + ' please do not spam with untrusted links.';
		},
		letterspam({client, userID}) {
			return md.mention(userID) + ' please do not spam with repeated letters.';
		},
		capsspam({client, userID}) {
			return md.mention(userID) + ' please do not spam with all caps.';
		},
		not_whitelisted_url({client, userID}) {
			return md.mention(userID) + ' please do not use links that are not whitelisted.';
		},
		blacklisted_url({client, userID}) {
			return md.mention(userID) + ' please do not use links that are blacklisted.';
		}
	}
};