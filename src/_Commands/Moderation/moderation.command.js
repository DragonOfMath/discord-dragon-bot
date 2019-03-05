/**
	Command file for archiving/cleaning up messages.
*/

const Constants  = require('../../Constants/Moderation');
const Moderation = require('../../Moderation/Moderation');
const Actions    = require('../../Moderation/Actions');
const Spam       = require('../../Moderation/Spam');
const {Markdown:md,Format:fmt,DiscordUtils,Array,random} = require('../../Utils');

function getUsers(args) {
	let users = [];
	for (let a of args) {
		a = md.userID(a) || a.match(/^\d+$/);
		if (a) {
			users.push(a);
		} else {
			break;
		}
	}
	return users;
}

module.exports = {
	'dehoist': {
		aliases: ['unhoist'],
		category: 'Moderation',
		title: 'De-Hoist Member',
		info: 'Change a user\'s nickname such that they are no longer hoisted (e.g. using a "!" in their name) in the member list.',
		parameters: ['user'],
		permissions: 'privileged',
		fn({client, server, userID, args}) {
			let targetUserID = Moderation.validateUser(client, server, args[0], userID);
			let theirNickname = client.members[targetUserID].nick || client.users[targetUserID].username;
			let dehoistedName = theirNickname.replace(/^[!\$\^\[\]\(\)\{\}]*\s*/, '');
			if (theirNickname == dehoistedNickname) {
				throw 'No need to de-hoist user.';
			}
			// if the user's name was entirely for hoisting, then give them a default name :^)
			if (!dehoistedName) {
				dehoistedName = random(['some unknown noob','default name','i dont like names','nobody','i hoisted my name','nickname']);
			}
			return client.editNickname({
				serverID: server.id,
				userID: targetUserID,
				nick: dehoistedName
			})
			.then(() => {
				client.notice(`[${server.name}] De-hoisted ${thierNickname} as ${dehoistedName}.`);
				return md.bold(dehoistedName) + ' successfully de-hoisted.'
			})
			.catch(e => {
				client.error(e);
				return 'Unable to de-hoist user. Maybe I don\'t have permission to?';
			});
		}
	},
	'archive': {
		aliases: ['move','mirror'],
		category: 'Moderation',
		//title: 'Archive',
		info: 'Move messages in the current channel to an archive channel (or a specified channel if using the aliases). Use flags to specify the kinds of messages to target: `-cmds`, `-bot`, `-media`, `-text`, and `-pinned`.',
		parameters: ['count|...messages', '[channel]'],
		flags: ['b|bot','c|cmds','t|text','m|media','p|pinned'],
		permissions: 'privileged',
		fn({client, server, channel, cmds, args, flags}) {
			let cmd = cmds[0].toLowerCase();
			if (cmd == 'move' || cmd == 'mirror') {
				let channelID = args.pop();
				channelID = md.channelID(channelID) || channelID;
				if (!server.channels[channelID]) {
					throw 'Invalid channel ID: ' + channelID;
				}
				return client.moveMessages({
					from: channel.id,
					to: channelID,
					messages: args,
					keepOriginalMessages: (cmd == 'mirror')
				});
			} else {
				return Moderation.archive(client, server, channel, args[0], flags);
			}
		},
		subcommands: {
			'id': {
				aliases: ['channel', 'channelid'],
				title: 'Archive | Get/Set ID',
				info: 'Gets or sets the archive channel ID.',
				parameters: ['[channel]'],
				fn({client, server, args}) {
					if (args[0]) {
						let archiveID = Moderation.setArchiveChannel(client, server, args[0])
						.then(() => 'Set to ' + md.channel(archiveID));
					} else {
						let archiveID = Moderation.getArchiveChannel(client, server);
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
		info: 'Delete messages in the current channel. Use flags to specify the kinds of messages to filter out.',
		parameters: ['[count]'],
		flags: ['b|bot','c|cmds','t|text','m|media','p|pinned'],
		permissions: 'privileged',
		fn({client, server, channel, args, flags}) {
			return Moderation.cleanup(client, server, channel, args[0], flags);
		}
	},
	'snipe': {
		category: 'Moderation',
		title: 'Sniped!',
		info: 'Find the most recent deleted message in the channel.',
		parameters: ['[user]'],
		permissions: 'privileged',
		fn({client, args, channelID}) {
			return client.snipe(channelID, args[0])
			.then(DiscordUtils.embedMessage);
		}
	},
	'vckick': {
		category: 'Moderation',
		title: 'VC Kick',
		info: 'Kick users out of a voice channel.',
		parameters: ['channel'],
		permissions: 'privileged',
		fn({client, server, arg}) {
			let channel = DiscordUtils.getChannelByName(server, arg);
			channel = channel ? channel.id : arg;
			return Moderation.vckick(client, server, channel);
		}
	},
	'warn': {
		category: 'Moderation',
		title: 'Moderation | Warn',
		info: 'Warn a user (or several) and give a reason why.',
		parameters: ['...users', 'reason'],
		permissions: 'privileged',
		fn({client, server, args, userID}) {
			let users  = getUsers(args);
			let reason = args.slice(users.length).join(' ');
			return users.unique().mapAsync(function warn(id) {
				return Moderation.warn(client, server, id, userID, reason);
			}).then(msgs => msgs.join('\n'));
		}
	},
	'mute': {
		category: 'Moderation',
		title: 'Moderation | Mute',
		info: 'Mute a user (or several) to prevent them from sending messages or using voice channels.',
		parameters: ['...users', 'reason'],
		permissions: 'privileged',
		fn({client, server, args, userID}) {
			let users = getUsers(args);
			let reason = args.slice(users.length).join(' ');
			return users.unique().mapAsync(function mute(id) {
				return Moderation.mute(client, server, id, userID, reason);
			}).then(msgs => msgs.join('\n'));
		}
	},
	'unmute': {
		category: 'Moderation',
		title: 'Moderation | Unmute',
		info: 'Unmute a user (or several) to enable them to read messages and join voice channels once again.',
		parameters: ['...users', '[reason]'],
		permissions: 'privileged',
		fn({client, server, args, userID}) {
			let users = getUsers(args);
			let reason = args.slice(users.length).join(' ');
			return users.unique().mapAsync(function unmute(id) {
				return Moderation.unmute(client, server, id, userID, reason);
			}).then(msgs => msgs.join('\n'));
		}
	},
	'kick': {
		category: 'Moderation',
		title: 'Moderation | Kick',
		info: 'Kick a user (or several) from the server and give a reason why.',
		parameters: ['...users', 'reason'],
		permissions: 'privileged',
		fn({client, server, args, userID}) {
			let users  = getUsers(args);
			let reason = args.slice(users.length).join(' ');
			return users.unique().mapAsync(function kick(id) {
				return Moderation.kick(client, server, id, userID, reason);
			}).then(msgs => msgs.join('\n'));
		}
	},
	'ban': {
		category: 'Moderation',
		title: 'Moderation | Ban',
		info: 'Ban a user (or several) from the server and give a reason why.',
		parameters: ['...users', 'reason'],
		permissions: 'privileged',
		fn({client, server, args, userID}) {
			let users  = getUsers(args);
			let reason = args.slice(users.length).join(' ');
			return users.unique().mapAsync(function ban(id) {
				return Moderation.ban(client, server, id, userID, reason);
			}).then(msgs => msgs.join('\n'));
		}
	},
	'unban': {
		aliases: ['pardon'],
		category: 'Moderation',
		title: 'Moderation | Unban',
		info: 'Unban a user.',
		parameters: ['...users', '[reason]'],
		permissions: 'privileged',
		fn({client, server, args, userID}) {
			let users = getUsers(args);
			return users.unique().mapAsync(function unban(id) {
				return Moderation.unban(client, server, id, userID);
			}).then(msgs => msgs.join('\n'));
		}
	},
	'softban': {
		aliases: ['tempban'],
		category: 'Moderation',
		title: 'Moderation | Softban',
		info: 'Softban (ban+unban) a user (or several).',
		parameters: ['...users','reason'],
		permissions: 'privileged',
		fn({client, server, args, userID}) {
			let users  = getUsers(args);
			let reason = args.slice(users.length).join(' ');
			return users.unique().mapAsync(function softban(id) {
				return Moderation.softban(client, server, id, userID, reason);
			}).then(msgs => msgs.join('\n'));
		}
	},
	'strike': {
		aliases: ['x'],
		category: 'Moderation',
		title: 'Moderation | Strike',
		info: 'Issue a strike to a user (or several). Each strike will dispatch the assigned action.',
		parameters: ['...users', 'reason'],
		permissions: 'privileged',
		fn({client, server, args, userID}) {
			let users  = getUsers(args);
			let reason = args.slice(users.length).join(' ');
			return users.unique().mapAsync(function strike(id) {
				return Moderation.strike(client, server, id, userID, reason);
			}).then(msgs => msgs.join('\n'));
		}
	},
	'unstrike': {
		aliases: ['unx'],
		category: 'Moderation',
		title: 'Moderation | Unstrike',
		info: 'Remove a strike from a user. This is if they display continuous good behavior.',
		parameters: ['user'],
		permissions: 'privileged',
		fn({client, server, args, userID}) {
			let users  = getUsers(args);
			let reason = args.slice(users.length).join(' ');
			return users.unique().mapAsync(function unstrike(id) {
				return Moderation.unstrike(client, server, id, userID);
			}).then(msgs => msgs.join('\n'));
		}
	},
	'lockdown': {
		aliases: ['codered'],
		category: 'Moderation',
		title: 'Moderation | Lockdown',
		info: 'In the event of a raid/attack, lockdown mode will delete recent invites, set the server to maximum verification level (TODO: monkey-patch this in discord.io?), and observe new members. Should any user spam messages in a short amount of time or mention anyone, they will be kicked immediately.',
		parameters: ['<on|off|1|0|true|false>'],
		permissions: 'privileged',
		fn({client, args, server, userID}) {
			return Moderation.setLockdownMode(client, server, args[0] == 'on' || (args[0] !== 'off' && args[0]));
		}
	},
	'mods': {
		aliases: ['moderators','admins','staff'],
		category: 'Moderation',
		title: 'Moderators/Admins/Staff',
		info: 'List the server staff and their statuses.',
		permissions: 'public',
		fn({client, server}) {
			let staffByStatus = Array.groupBy(Moderation.getStaff(server), 'status');
			let msg = '\n';
			for (let status of ['Online', 'Idle', 'DnD', 'Offline']) {
				let staff = staffByStatus[status.toLowerCase()];
				if (!staff) continue;
				msg += md.bold(status) + ':\n';
				msg += staff.map(m => md.atUser(client.users[m.id])).join('\n');
				msg += '\n';
			}
			return msg;
		}
	},
	'mod': {
		aliases: ['moderation', 'modsettings'],
		category: 'Moderation',
		title: 'Moderation',
		info: 'Displays moderation settings for the server. Also assumes the interface for modifying these settings.',
		permissions: 'privileged',
		fn({client, server}) {
			return Moderation.get(client, server).embed();
		},
		subcommands: {
			'actions': {
				title: 'Moderation | Automod Actions',
				info: 'Lists automod actions.',
				fn() {
					return Actions.get().map(a => `${md.bold(a)} (${Constants.ACTIONS[a]})`).join(', ');
				}
			},
			'log': {
				aliases: ['modlog'],
				title: 'Moderation | Modlog',
				info: 'Get information regarding the moderation log.',
				fn({client, server}) {
					return Moderation.get(client, server).modlog.toString();
				},
				subcommands: {
					'id': {
						aliases: ['channel', 'channelid'],
						title: 'Moderation | Modlog Channel ID',
						info: 'Gets or sets the modlog channel ID. The modlog contains information about bans, kicks, and other moderation actions.',
						parameters: ['[channel]'],
						fn({client, server, args, channel}) {
							let channelID = args[0] || channel;
							if (channelID) {
								Moderation.setModlogChannel(client, server, channelID);
								return 'Modlog channel set: ' + md.channel(channelID);
							} else {
								var modlogID = Moderation.getModlogChannel(client, server);
								return modlogID ? md.channel(modlogID) : 'No modlog channel set.';
							}
						}
					},
					'case': {
						aliases: ['reason', 'notes'],
						title: 'Moderation | Modlog Case',
						info: 'Get or edit a modlog case.',
						parameters: ['caseID', '[notes]'],
						fn({client, server, args}) {
							let [caseID, ...notes] = args;
							notes = notes.join(' ');
							
							if (notes) {
								return Moderation.modify(client, server, settings => {
									return settings.editModlogIncident(client, caseID, incident => {
										incident.notes = notes;
										return incident;
									})
									.then(() => 'Case ' + caseID + ' updated.');
								});
							} else {
								return Moderation.get(client, server).getModlogIncident(caseID).embed();
							}
						}
					},
					'revoke': {
						aliases: ['undo'],
						title: 'Moderation | Revoke Case',
						info: 'Revoke a case from the modlog.',
						parameters: ['caseID'],
						fn({client, server, args}) {
							let caseID = args[0];
							return Moderation.modify(client, server, settings => {
								return settings.revokeModlogIncident(client, caseID)
								.then(() => 'Case ' + caseID + ' revoked.');
							});
						}
					},
					'checkuser': {
						aliases: ['userincidents','checkincidents'],
						title: 'Moderation | Check User Incidents',
						info: 'Gets a list of incidents pertaining to a user.',
						parameters: ['userID'],
						fn({client, server, args}) {
							let userID = md.userID(args[0]) || args[0];
							let incidents = Moderation.get(client, server).getModlogUserIncidents(userID);
							if (incidents.length) {
								return 'Cases: ' + incidents.map(c => `${c.caseID} (${c.issue})`).join(', ');
							} else {
								return 'There are no incidents involving that user.';
							}
						}
					}
				}
			},
			'strikes': {
				aliases: ['checkstrikes','checkx','getx'],
				title: 'Moderation | Strikes',
				info: 'Get the strike count for a given user.',
				parameters: ['[user]'],
				fn({client, arg, server, userID}) {
					let settings = Moderation.get(client, server);
					if (!arg) {
						return {
							description: settings.strikes.toString()
						};
					} else {
						let user = client.users[arg] || DiscordUtils.getUserByName(client.users, server, arg);
						if (!user) throw 'Invalid user ID or name.';
						let strikes = settings.getUserStrikes(client, server, user.id);
						return md.bold(user.username) + ' has ' + md.bold(fmt.plural('Strike',strikes)) + ' on record.';
					}
				},
				subcommands: {
					'clear': {
						aliases: ['pardon'],
						title: 'Moderation | Clear All Strikes',
						info: 'Pardons all users that have strikes.',
						fn({client, server}) {
							return Moderation.modify(client, server, settings => {
								settings.strikes.clearAll();
								return 'All users have been relieved of strikes.';
							});
						}
					},
					'actions': {
						aliases: ['xactions'],
						title: 'Moderation | Get/Set Strike Actions',
						info: 'Get or set the actions assigned when 1, 2, and 3+ strikes are reached.',
						parameters: ['[action1]','[action2]','[action3]'],
						fn({client, args, server, userID}) {
							if (!args.length) {
								let actions = Moderation.get(client, server).strikes.getActions();
								return actions.map(aa => a.map(md.bold).join('+')).join(' -> ');
							}
							return Moderation.modify(client, server, settings => {
								settings.strikes.setActions(args);
								let actions = settings.strikes.getActions();
								return 'Set to ' + actions.map(aa => a.map(md.bold).join('+')).join(' -> ');
							});
						}
					}
				}
			},
			'vulgarity': {
				title: 'Moderation | Vulgarity',
				info: 'Display the current vulgarity level and actions.',
				fn({client, server}) {
					return {
						description: Moderation.get(client, server).vulgarity.toString()
					};
				},
				subcommands: {
					'level': {
						title: 'Moderation | Get/Set Vulgarity Level',
						info: 'Allow the bot to filter messages containing certain words and phrases that are vulgar, offensive, lewd, racist, etc.',
						parameters: ['[<0|none|1|low|2|medium|3|high>]'],
						fn({client, server, args}) {
							if (!args.length) {
								let level = Moderation.get(client, server).vulgarity.getLevel();
								return md.bold(level);
							}
							return Moderation.modify(client, server, settings => {
								let level = settings.setVulgarityLevel(args[0]);
								return 'Set to ' + md.bold(level);
							});
						}
					},
					'actions': {
						title: 'Moderation | Get/Set Vulgarity Actions',
						info: 'Get or apply settings for how the bot responds to vulgar messages.',
						parameters: ['[...actions]'],
						fn({client, server, args}) {
							if (!args.length) {
								let actions = Moderation.get(client, server).vulgarity.getActions();
								return actions.map(md.bold).join('+');
							}
							return Moderation.modify(client, server, settings => {
								let actions = Actions.get(settings.setVulgarityActions(args));
								return 'Set to ' + actions.map(md.bold).join('+');
							});
						}
					}
				}
			},
			'spam': {
				title: 'Moderation | Spam',
				info: 'Display the current spam filters and actions.',
				fn({client, server}) {
					return {
						description: Moderation.get(client, server).spam.toString()
					};
				},
				subcommands: {
					'filters': {
						title: 'Moderation | Get/Set Spam Level',
						info: 'Allow the bot the filter spam messages, including all caps, repetitive letters, global mentions, and untrusted links.',
						parameters: ['[...<mentions|links|letters|allcaps|emojis|newlines>]'],
						fn({client, args, server}) {
							if (!args.length) {
								let filter = Moderation.get(client, server).spam.getFilters();
								return filter.map(md.bold).join(', ');
							}
							return Moderation.modify(client, server, settings => {
								let filter = Spam.getFilters(settings.setSpamFilters(args));
								return 'Set to ' + filter.map(md.bold).join(', ');
							});
						}
					},
					'actions': {
						title: 'Moderation | Get/Set Spam Actions',
						info: 'Get or apply settings for how the bot responds to spam messages.',
						parameters: ['[...actions]'],
						fn({client, args, server}) {
							if (!args.length) {
								let actions = Moderation.get(client, server).spam.getActions();
								return actions.map(md.bold).join('+');
							}
							return Moderation.modify(client, server, settings => {
								let actions = Actions.get(settings.setSpamActions(args));
								return 'Set to ' + actions.map(md.bold).join('+');
							});
						}
					}
				}
			},
			'urls': {
				aliases: ['url'],
				title: 'Moderation | URL Banlist',
				info: 'Display the current URL banlist.',
				fn({client, server}) {
					return {
						description: Moderation.get(client, server).banlist.urls.join('\n')
					};
				},
				subcommands: {
					'clear': {
						title: 'Moderation | Clear Banned URLs',
						info: 'Clears the URL banlist.',
						fn({client, server}) {
							return Moderation.modify(client, server, settings => {
								settings.clearBannedURLs();
								return 'Cleared.';
							});
						}
					},
					'add': {
						aliases: ['ban'],
						title: 'Moderation | Ban URLs',
						info: 'Add URLs to the banlist.',
						parameters: ['...urls'],
						fn({client, server, args}) {
							return Moderation.modify(client, server, settings => {
								settings.addBannedURLs(args);
								return 'Updated.';
							});
						}
					},
					'remove': {
						aliases: ['unban'],
						title: 'Moderation | Unban URLs',
						info: 'Remove URLs from the banlist.',
						parameters: ['...urls'],
						fn({client, server, args}) {
							return Moderation.modify(client, server, settings => {
								settings.removeBannedURLs(args);
								return 'Updated.';
							});
						}
					}
				}
			},
			'names': {
				aliases: ['usernames', 'bannednames'],
				title: 'Moderation | Username Banlist',
				info: 'Display the current usernam banlist.',
				fn({client, server}) {
					return {
						description: Moderation.get(client, server).banlist.usernames.join(', ')
					};
				},
				subcommands: {
					'clear': {
						title: 'Moderation | Clear Banned Usernames',
						info: 'Clears all banned username filters.',
						fn({client, server}) {
							return Moderation.modify(client, server, settings => {
								settings.clearBannedNames();
								return 'Cleared.';
							});
						}
					},
					'add': {
						aliases: ['ban'],
						title: 'Moderation | Ban Usernames',
						info: 'Add username filters to the name banlist.',
						fn({client, server, args}) {
							return Moderation.modify(client, server, settings => {
								settings.addBannedNames(args);
								return 'Updated.';
							});
						}
					},
					'remove': {
						aliases: ['unban'],
						title: 'Moderation | Unban Usernames',
						info: 'Remove username filters from the name banlist.',
						fn({client, server, args}) {
							return Moderation.modify(client, server, settings => {
								settings.removeBannedNames(args);
								return 'Updated.';
							});
						}
					}
				}
			}
		}
	}
};
