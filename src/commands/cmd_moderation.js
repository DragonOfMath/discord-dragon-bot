/**
	cmd_moderation.js
	Command file for archiving/cleaning up messages.
*/

const {embedMessage,hasContent} = require('../DiscordUtils');
const {Markdown:md} = require('../Utils');

module.exports = {
	'archive': {
		category: 'Moderation',
		title: 'Archive',
		info: 'Move up to 100 messages in the current channel to an archive that anyone can access. (Deletes original messages)',
		parameters: ['count'],
		permissions: {
			type: 'inclusive'
		},
		fn({client, args, channelID, serverID}) {
			let limit = ~~args[0];
			limit = Math.max(1, Math.min(limit, 99)) + 1;
			
			let serverTable = client.database.get('servers');
			let archiveID = serverTable.get(serverID).archiveID;
			if (!archiveID) {
				return 'No archive channel set.';
			}
			
			return client.getAll(channelID, limit)
			.then(messages => {
				function next() {
					if (messages.length == 0) {
						return true;
					}
					
					let message = messages.pop();
					
					if (message.content.match(/archive/)) {
						return client.delete(message.channel_id, message.id).then(next);
					} else {
						let embed = embedMessage(message);
						return client.send(archiveID,`From ${md.channel(message.channel_id)}:`,embed).then(() => client.delete(message.channel_id, message.id)).then(next);
					}
				}
				return next();
			})
			.then(res => `${count-1} message${count>2?"s were":" was"} archived in ${md.channel(archiveID)}.`);
		},
		subcommands: {
			'setup': {
				aliases: ['init'],
				title: 'Archive | Setup',
				info: 'Setup the archive channel.',
				parameters: ['channel'],
				fn({client, args, channelID, server}) {
					let archiveID = md.id(args[0]);
					if (!archiveID || !server.channels[archiveID]) {
						throw 'Invalid channel ID.';
					}
					client.database.get('servers').modify(server.id, s => {
						s.archiveID = archiveID;
						return s;
					}).save();
					
					return 'Archive channel ID set: ' + md.channel(archiveID);
				}
			},
			'id': {
				aliases: ['channelid'],
				title: 'Archive | ID',
				info: 'Gets the archive channel ID if one is set.',
				fn({client, channelID, serverID}) {
					let id = client.database.get('servers').get(serverID).archiveID;
					return id ? md.channel(id) : 'No archive channel set.';
				}
			}
		}
	},
	'cleanup': {
		aliases: ['delete', 'nuke'],
		category: 'Moderation',
		title: 'Cleanup',
		info: 'Delete up to 100 messages in the current channel. (Specify `count` and any flags (`-media`, `-pinned`) to prevent deleting images or pinned messages.)',
		parameters: ['[count]','[flag1]','[flag2]'],
		permissions: {
			type: 'inclusive'
		},
		fn({client, args, channelID}) {
			let [count = 50, ...flags] = args;
			count = Math.max(1, Math.min(~~count, 99)) + 1;
			
			client.getAll(channelID, count)
			.then(messages => {
				if (flags.indexOf('-media') > -1) {
					messages = messages.filter(hasContent);
				}
				if (flags.indexOf('-pinned') > -1) {
					messages = messages.filter(m => !m.pinned);
				}
				if (messages.length) {
					let messageIDs = messages.map(x => x.id);
					return client.deleteAll(channelID, messageIDs);
				}
			});
		}
	}
}