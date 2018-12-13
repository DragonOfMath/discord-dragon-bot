const Constants   = require('../../Constants/Moderation');
const Moderation  = require('../../Moderation/Moderation');
const Permissions = require('../../Permissions/Permissions');
const {Markdown:md} = require('../../Utils');

module.exports = {
	id: 'message-moderator',
	info: 'Moderates incoming messages for spam and vulgarity.',
	permissions: 'public',
	data: {
		msg: ''
	},
	resolver(context) {
		let {client, server, member, userID, message} = context;
		
		// no moderation in DMs or for the server owner/moderators
		if (!server || userID == server.owner_id || Permissions.memberHasPrivilege(server, member)) return; 
		
		let settings = Moderation.get(client, server);
		
		// observe messages for spam during lockdown/anti-raid mode
		let offense;
		if (settings.lockdown) {
			offense = settings.observeLockdown(context);
		}
		if (!offense) {
			offense = settings.checkMessage(message);
		}
		if (offense) {
			this.data.msg = Moderation.doActions(context, offense);
			return 'msg';
		}
	},
	events: {
		msg() {
			return this.data.msg;
		},
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
		banned_url({client, userID}) {
			return md.mention(userID) + ' please do not use links that are banned.';
		}
	}
};
