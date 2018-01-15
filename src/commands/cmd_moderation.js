/**
	cmd_moderation.js
	Command file for archiving/cleaning up messages.
*/

const Moderation = require('../Moderation');
const {embedMessage,hasContent} = require('../DiscordUtils');
const {Markdown:md,Format:fmt} = require('../Utils');

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
			return Moderation.archive(client, serverID, channelID, args[0]);
		},
		subcommands: {
			'setup': {
				aliases: ['init'],
				title: 'Archive | Setup',
				info: 'Setup the archive channel.',
				parameters: ['channel'],
				fn({client, args, channelID, server}) {
					return Moderation.setArchiveChannel(client, server, args[0]);
				}
			},
			'id': {
				aliases: ['channel', 'channelid'],
				title: 'Archive | ID',
				info: 'Gets the archive channel ID if one is set.',
				fn({client, channelID, serverID}) {
					let archiveID = Moderation.getArchiveChannel(client, serverID);
					return archiveID ? md.channel(archiveID) : 'No archive channel set.';
				}
			}
		}
	},
	'cleanup': {
		aliases: ['delete', 'nuke'],
		category: 'Moderation',
		title: 'Cleanup',
		info: 'Delete up to 100 messages in the current channel. (Specify `count` and any flags (`-media`, `-pinned`, `-text`) to prevent deleting images, pinned messages, or text messages.)',
		parameters: ['[count]','[...flags]'],
		permissions: {
			type: 'inclusive'
		},
		fn({client, args, channelID}) {
			Moderation.cleanup(client, channelID, args[0], args.slice(1));
		}
	},
	'mod': {
		aliases: ['moderation'],
		category: 'Moderation',
		title: 'Moderation',
		info: 'The subset of commands for moderating the users: kicking, banning, unbanning, and issuing strikes.',
		permissions: {
			type: 'inclusive'
		},
		subcommands: {
			'setup': {
				aliases: ['init'],
				title: 'Moderation | Setup Modlog',
				info: 'Setup a modlog channel that keeps a log of moderation cases.',
				parameters: ['channel'],
				permissions: {
					type: 'private'
				},
				fn({client, args, channelID, server}) {
					return Moderation.setModlogChannel(client, server, args[0]);
				}
			},
			'id': {
				aliases: ['channel', 'channelid'],
				title: 'Moderation | Modlog ID',
				info: 'Get the modlog channel ID if one is set.',
				fn({client, channelID, serverID}) {
					var modlogID = Moderation.getModlogChannel(client, serverID);
					return modlogID ? md.channel(modlogID) : 'No modlog channel set.';
				}
			},
			'strike': {
				aliases: ['x'],
				title: 'Moderation | Strike',
				info: 'Issue a strike to a user. If they accumulate 3 strikes, they are automatically banned.',
				parameters: ['user', '...reason'],
				fn({client, args, server, userID}) {
					return Moderation.strike(client, server, args[0], userID, args.slice(1).join(' '));
				}
			},
			'unstrike': {
				aliases: ['unx'],
				title: 'Moderation | Unstrike',
				info: 'Remove a strike from a user. This is if they display continuous good behavior.',
				parameters: ['user'],
				fn({client, args, server, userID}) {
					return Moderation.unstrike(client, server, args[0], userID);
				}
			},
			'checkstrikes': {
				aliases: ['checkx'],
				title: 'Moderation | Check Strikes',
				info: 'Get the strike count for a given user.',
				parameters: ['user'],
				permissions: {
					type: 'inclusive'
				},
				fn({client, args, server, userID}) {
					var strikes = Moderation.getStrikes(client, server, args[0]);
					return `That user has **${fmt.plural('Strike',strikes)}** on record.`;
				}
			},
			'kick': {
				title: 'Moderation | Kick',
				info: 'Kick a user from the server and give a reason why.',
				parameters: ['user', '...reason'],
				permissions: {
					type: 'inclusive'
				},
				fn({client, args, server, userID}) {
					return Moderation.kick(client, server, args[0], userID, args.slice(1).join(' '));
				}
			},
			'ban': {
				title: 'Moderation | Ban',
				info: 'Ban a user from the server and give a reason why.',
				parameters: ['user', '...reason'],
				permissions: {
					type: 'inclusive'
				},
				fn({client, args, server, userID}) {
					return Moderation.ban(client, server, args[0], userID, args.slice(1).join(' '));
				}
			},
			'unban': {
				title: 'Moderation | Unban',
				info: 'Unban a user.',
				parameters: ['user'],
				permissions: {
					type: 'inclusive'
				},
				fn({client, args, server, userID}) {
					return Moderation.unban(client, server, args[0], userID);
				}
			}
		}
	}
};
