/**
	Command file for archiving/cleaning up messages.
*/

const Moderation = require('../../Moderation');
const {Markdown:md,Format:fmt} = require('../../Utils');

module.exports = {
	'archive': {
		aliases: ['move'],
		category: 'Moderation',
		//title: 'Archive',
		info: 'Move messages in the current channel to an archive channel. Use flags to specify the kinds of messages to filter out: `-cmds`, `-bot`, `-media`, `-text`, and `-pinned` (use `+` instead of `-` to whitelist messages of that kind).',
		parameters: ['count', '[...flags]'],
		permissions: 'privileged',
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
		aliases: ['delete', 'nuke', 'prune', 'purge', 'tidy'],
		category: 'Moderation',
		//title: 'Cleanup',
		info: 'Delete messages in the current channel. Use flags to specify the kinds of messages to filter out: `-cmds`, `-bot`, `-media`, `-text`, and `-pinned` (use `+` instead of `-` to whitelist messages of that kind).',
		parameters: ['[count]','[...flags]'],
		permissions: 'privileged',
		fn({client, args, channelID}) {
			Moderation.cleanup(client, channelID, args[0], args.slice(1));
		}
	},
	'mod': {
		aliases: ['moderation'],
		category: 'Moderation',
		title: 'Moderation',
		info: 'The subset of commands for moderating the users: kicking, banning, unbanning, and issuing strikes.',
		permissions: 'privileged',
		subcommands: {
			'id': {
				aliases: ['channel', 'channelid', 'modlog', 'log'],
				title: 'Moderation | Modlog ID',
				info: 'Gets or sets the modlog channel ID. The modlog contains information about bans, kicks, and other moderation actions.',
				parameters: ['[channel]'],
				fn({client, server, args}) {
					var [channel] = args;
					if (channel) {
						return Moderation.setModlogChannel(client, server, channel);
					} else {
						var modlogID = Moderation.getModlogChannel(client, server);
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
				aliases: ['checkx','getx'],
				title: 'Moderation | Check Strikes',
				info: 'Get the strike count for a given user.',
				parameters: ['user'],
				fn({client, args, server, userID}) {
					var [user] = args;
					var strikes = Moderation.getStrikes(client, server, user);
					return `That user has **${fmt.plural('Strike',strikes)}** on record.`;
				}
			},
			'kick': {
				title: 'Moderation | Kick',
				info: 'Kick a user from the server and give a reason why.',
				parameters: ['user', '...reason'],
				fn({client, args, server, userID}) {
					var [user, ...reason] = args;
					reason = reason.join(' ');
					return Moderation.kick(client, server, user, userID, reason);
				}
			},
			'ban': {
				title: 'Moderation | Ban',
				info: 'Ban a user from the server and give a reason why.',
				parameters: ['user', '...reason'],
				fn({client, args, server, userID}) {
					var [user, ...reason] = args;
					reason = reason.join(' ');
					return Moderation.ban(client, server, user, userID, reason);
				}
			},
			'unban': {
				title: 'Moderation | Unban',
				info: 'Unban a user.',
				parameters: ['user'],
				fn({client, args, server, userID}) {
					var [user] = args;
					return Moderation.unban(client, server, user, userID);
				}
			},
			'actions': {
				title: 'Moderation | Automod Actions',
				info: 'Specify what actions the bot should take when it finds an inappropriate message: `remind` to reply to the user, `delete` to delete the message, and `strike` to add a strike to the user.',
				parameters: ['...actions'],
				fn({client, args, server}) {
					return Moderation.setActions(client, server, args);
				}
			},
			'vulgarity': {
				title: 'Moderation | Vulgarity Level',
				info: 'Allow the bot to filter messages containing certain words and phrases that are vulgar, offensive, lewd, racist, etc.',
				parameters: ['<0|none|1|low|2|medium|3|high>'],
				fn({client, args, server}) {
					return Moderation.setVulgarityLevel(client, server, args[0]);
				}
			},
			'spam': {
				title: 'Moderation | Spam Level',
				info: 'Allow the bot the filter spam messages, including all caps, repetitive letters, global mentions, and untrusted links.',
				parameters: ['<0|none|1|low|2|medium|3|high>'],
				fn({client, args, server}) {
					return Moderation.setSpamLevel(client, server, args[0]);
				}
			},
			'urls': {
				aliases: ['url'],
				title: 'Moderation | URLs',
				info: 'Interface for editing what URLs are allowed/disallowed on the server.',
				fn({client, args, server}) {
					return Moderation.listURLs(client, server);
				},
				subcommands: {
					'clear': {
						title: 'Moderation | Clear URLs',
						info: 'Clears all blacklisted/whitelisted URLs for the server.',
						fn({client, server}) {
							return Moderation.clearURLs(client, server);
						}
					},
					'whitelist': {
						title: 'Moderation | Whitelist URLs',
						info: 'Add URLs to the server\'s whitelist.',
						fn({client, server, args}) {
							return Moderation.addWhitelistedURLs(client, server, args);
						}
					},
					'blacklist': {
						title: 'Moderation | Blacklist URLs',
						info: 'Add URLs to the server\'s blacklist.',
						fn({client, server, args}) {
							return Moderation.addBlacklistedURLs(client, server, args);
						}
					}
				}
			}
		}
	}
};
