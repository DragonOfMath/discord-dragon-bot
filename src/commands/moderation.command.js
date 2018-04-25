/**
	Command file for archiving/cleaning up messages.
*/

const Moderation = require('../Moderation');
const {Markdown:md,Format:fmt} = require('../Utils');

module.exports = {
	'archive': {
		category: 'Moderation',
		//title: 'Archive',
		info: 'Move up to 100 messages in the current channel to an archive channel. Use flags to specify the kinds of messages to filter out: `-cmds`, `-bot`, `-media`, `-text`, and `-pinned`.',
		parameters: ['count', '[...flags]'],
		permissions: {
			type: 'inclusive'
		},
		fn({client, args, channelID, serverID}) {
			return Moderation.archive(client, serverID, channelID, args[0]);
		},
		subcommands: {
			'id': {
				aliases: ['channel', 'channelid'],
				title: 'Archive | ID',
				info: 'Gets or sets the archive channel ID.',
				parameters: ['[channel]'],
				fn({client, channelID, server, args}) {
					if (args[0]) {
						return Moderation.setArchiveChannel(client, server, args[0]);
					} else {
						var archiveID = Moderation.getArchiveChannel(client, server.id);
						return archiveID ? md.channel(archiveID) : 'No archive channel set.';
					}
				}
			}
		}
	},
	'cleanup': {
		aliases: ['delete', 'nuke'],
		category: 'Moderation',
		//title: 'Cleanup',
		info: 'Delete messages in the current channel. Use flags to specify the kinds of messages to filter out: `-cmds`, `-bot`, `-media`, `-text`, and `-pinned`.',
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
			'id': {
				aliases: ['channel', 'channelid', 'modlog', 'log'],
				title: 'Moderation | Modlog ID',
				info: 'Gets or sets the modlog channel ID. The modlog contains information about bans, kicks, and other moderation actions.',
				fn({client, channelID, server, args}) {
					if (args[0]) {
						return Moderation.setModlogChannel(client, server, args[0]);
					} else {
						var modlogID = Moderation.getModlogChannel(client, server.id);
						return modlogID ? md.channel(modlogID) : 'No modlog channel set.';
					}
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
