const {Markdown:md,strcmp,DiscordEmbed,truncate} = require('./Utils');

const CHANNEL_TYPES = [
	'Text',
	'DM',
	'Voice',
	'Group DM',
	'Category'
];
const MESSAGE_TYPES = [
	'Default',
	'Add Recipient',
	'Remove Recipient',
	'Call',
	'Channel Name Change',
	'Channel Icon Change',
	'Channel Pinned Message',
	'Guild Member Joined'
];
const VERIFICATION_LEVELS = [
	'None',
	'Verified Email',
	'Registered for at least 5 minutes',
	'(╯°□°）╯︵ ┻━┻ - Member of the server for longer than 10 minutes',
	'┻━┻ミヽ(ಠ益ಠ)ﾉ彡┻━┻ - Verified phone number'
];

function yes(x) {
	return x ? 'Yes' : 'No';
}
function no(x) {
	return x ? 'No' : 'Yes';
}
function ID(id) {
	return ' (ID: ' + md.code(id) + ')';
}

class DiscordUtils {
	static getIconURL(server) {
		return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
	}
	static getAvatarURL(user) {
		if (user.avatar.startsWith('a_')) {
			return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif`;
		} else {
			return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
		}
	}
	static find(o,a,x) {
		for (var id in o) {
			var k = o[id][a];
			if (k == x || (k instanceof Array && k.includes(x))) return id;
		}
		return '';
	}
	static findAll(o,a,x) {
		var arr = [];
		for (var id in o) {
			var k = o[id][a];
			if (k == x || (k instanceof Array && k.includes(x))) arr.push(id);
		}
		return arr;
	}
	static resolve(o, ...ids) {
		return o[ids.find(id => id in o)];
	}
	static getObjects(o) {
		return o instanceof Array ? o : Object.keys(o).map(id => o[id]);
	}
	static getServerChannels(server) {
		return this.getObjects(server.channels);
	}
	static getServerUsers(users, server) {
		return this.getObjects(users).filter(user => user.id in server.members);
	}
	static getServerMembers(server) {
		return this.getObjects(server.members);
	}
	static getServerRoles(server) {
		return this.getObjects(server.roles);
	}
	static getServerEmojis(server) {
		return this.getObjects(server.emojis);
	}
	static getMemberRoles(member) {
		return this.getObjects(member.roles);
	}
	static getServerByName(servers, serverName) {
		return this.getObjects(servers).find(server => strcmp(server.name, serverName));
	}
	static getChannelByName(server, channelName) {
		return this.getServerChannels(server).find(channel => strcmp(channel.name, channelName));
	}
	static getUserByName(users, server, userName) {
		return this.getServerUsers(users, server).find(user => {
			var nick = server.members[user.id].nick;
			return strcmp(user.username, userName) || (nick && strcmp(nick, userName));
		});
	}
	static getRoleByName(server, roleName) {
		return this.getServerRoles(server).find(role => strcmp(role.name, roleName));
	}
	static getEmojiByName(server, emojiName) {
		return this.getServerEmojis(server).find(emoji => strcmp(emoji.name, emojiName));
	}
	static getMembersWithRole(members, role) {
		return this.getObjects(members).filter(member => member.roles.includes(role.id));
	}
	static getServersByUser(servers, user) {
		return this.getObjects(servers).filter(server => user.id in server.members);
	}
	static getServerByRole(servers, role) {
		return this.getObjects(servers).find(server => role.id in server.roles);
	}
	static getServerByChannel(servers, channel) {
		return this.getObjects(servers).find(server => channel.id in server.channels);
	}
	static getAllChannels(servers) {
		return this.getObjects(servers).map(this.getServerChannels).reduce((a,x) => a.concat(x), []);
	}
	static getAllRoles(servers) {
		return this.getObjects(servers).map(this.getServerRoles).reduce((a,x) => a.concat(x), []);
	}
	static getAllEmojis(servers) {
		return this.getObjects(servers).map(this.getServerEmojis).reduce((a,x) => a.concat(x), []);
	}
	static search(objects, filter) {
		return this.getObjects(objects).filter(filter);
	}
	static hasContent(m) {
		return m.attachments.length > 0 || m.embeds.length > 0 || m.content.match(/https?:\/\//g);
	}
	static filterMessages(client, messages, flags = []) {
		let blacklist = {
			cmds:   flags.includes('-cmds')   || flags.includes('-c'),
			bot:    flags.includes('-bot')    || flags.includes('-b'),
			text:   flags.includes('-text')   || flags.includes('-t'),
			media:  flags.includes('-media')  || flags.includes('-m'),
			pinned: flags.includes('-pinned') || flags.includes('-p')
		};
		return messages.filter(m => {
			if (m.content.startsWith(client.PREFIX) && blacklist.cmds) {
				return false;
			}
			if (m.author.id == client.id && blacklist.bot) {
				return false;
			}
			if (this.hasContent(m)) {
				if (blacklist.media) {
					return false;
				}
			} else {
				if (blacklist.text) {
					return false;
				}
			}
			if (m.pinned && blacklist.pinned) {
				return false;
			}
			return true;
		});
	}
	static embedMessage(message) {
		var embed = {
			description: message.content,
			timestamp: message.timestamp,
			fields: [],
			footer: {
				text: `ID: ${message.id} • Channel ID: ${message.channel_id}`
			}
		};
		
		// stringify any embeds in the message so they are not left out
		for (let embed of message.embeds) {
			embed.description += DiscordEmbed.stringify('', embed);
		}
		embed.description = truncate(embed.description, 2000);
		
		switch (MESSAGE_TYPES[message.type]) {
			case 'Default':
				embed.title = md.atUser(message.author);
				break;
			default:
				embed.title = MESSAGE_TYPES[message.type];
				break;
		}
		
		if (message.attachments.length > 0) {
			embed.fields.push({
				name: 'Attachments and Links',
				value: messages.attachments.map(x => x.url || (x.image && x.image.url) || (x.video && x.video.url)).join('\n')
			});
		}
		
		if (message.reactions && message.reactions.length > 0) {
			embed.fields.push({
				name: 'Reactions',
				value: message.reactions.map(r => {
					var e = r.emoji;
					return (e.id ? md.emoji(e.name, e.id) : e.name) + 'x' + r.count;
				}).join('\n')
			});
		}
		return embed;
	}
	static embedChannel(channel) {
		return {
			title: md.atChannel(channel),
			fields: [
				{
					name: ':1234: ID',
					value: channel.id,
					inline: true
				},
				{
					name: ':speech_balloon: Type',
					value: 	CHANNEL_TYPES[channel.type],
					inline: true
				},
				{
					name: ':mega: Topic',
					value: channel.topic || 'None',
					inline: true
				},
				{
					name: ':top: Position',
					value: channel.position,
					inline: true
				},
				{
					name: ':warning: 18+?',
					value: yes(channel.nsfw),
					inline: true
				}
			]
		};
	}
	static embedServer(server, client) {
		var members  = Object.keys(server.members);
		var channels = Object.keys(server.channels);
		var roles    = Object.keys(server.roles);
		var emojis   = Object.keys(server.emojis);
		var icon     = this.getIconURL(server);
		var owner    = client.users[server.owner_id];
		
		return {
			title: server.name,
			fields: [
				{
					name: ':1234: ID',
					value: server.id,
					inline: true
				},
				{
					name: ':earth_americas: Region',
					value: server.region,
					inline: true
				},
				{
					name: ':cowboy: Owner',
					value: md.atUser(owner) + ' / ' + md.mention(owner),
					inline: true
				},
				{
					name: ':100: Large?',
					value: server.large ? 'Yes' : 'No',
					inline: true
				},
				{
					name: ':white_check_mark: Verification',
					value: VERIFICATION_LEVELS[server.verification_level],
					inline: true
				},
				{
					name: ':busts_in_silhouette: Members',
					value: members.length,
					inline: true
				},
				{
					name: ':robot: Bots',
					value: members.filter(m => client.users[m].bot).length,
					inline: true
				},
				{
					name: ':speech_balloon: Channels',
					value: channels.length,
					inline: true
				},
				{
					name: ':pencil: Roles',
					value: roles.length,
					inline: true
				},
				{
					name: ':joy: Emojis',
					value: emojis.length,
					inline: true
				}
			],
			thumbnail: {
				url: icon,
				width: 60,
				height: 60
			}
		};
	}
	static embedUser(user, member) {
		return {
			title: md.atUser(user) + ` (${member.nick||'No nickname'})`,
			fields: [
				{
					name: ':1234: ID',
					value: user.id,
					inline: true
				},
				{
					name: ':speaking_head: Mention',
					value: md.mention(user),
					inline: true
				},
				{
					name: ':calendar: Joined',
					value: new Date(member.joined_at).toLocaleString(),
					inline: true
				},
				{
					name: ':clock4: Status',
					value: member.status || 'offline?',
					inline: true
				},
				{
					name: ':robot: Is Bot?',
					value: yes(member.bot),
					inline: true
				},
				{
					name: ':pencil: Roles',
					value: member.roles.map(md.role).join('\n') || 'None',
					inline: true
				}
			],
			thumbnail: {
				url: this.getAvatarURL(user),
				width: 60,
				height: 60
			}
		};
	}
	static embedRole(role, server) {
		var membersWithRole = this.getMembersWithRole(server.members, role);
		
		return {
			title: md.atRole(role),
			color: role.color,
			fields: [
				{
					name: ':1234: ID',
					value: role.id,
					inline: true
				},
				{
					name: ':shield: Server',
					value: server.name + ID(server.id),
					inline: true
				},
				{
					name: ':busts_in_silhouette: Members w/ Role',
					value: membersWithRole.length,
					inline: true
				},
				{
					name: ':white_check_mark: Permissions',
					value: role._permissions || 'Same as everyone',
					inline: true
				},
				{
					name: ':loudspeaker: Mentionable?',
					value: yes(role.mentionable),
					inline: true
				},
				{
					name: ':top: Hoisted?',
					value: yes(role.hoist),
					inline: true
				}
			]
		};
	}
	static embedInvite(invite) {
		// TODO: get invite expiration and use count?
		var {inviter,code,guild,channel} = invite;
		return {
			fields: [
				{
					name: ':1234: ID',
					value: code,
					inline: true
				},
				{
					name: ':slight_smile: Inviter',
					value: md.atUser(inviter) + ' / ' + md.mention(inviter),
					inline: true
				},
				{
					name: ':shield: Guild',
					value: guild.name + ID(guild.id),
					inline: true
				},
				{
					name: ':speech_balloon: Channel',
					value: md.atChannel(channel) + ID(channel.id),
					inline: true
				}
			],
			thumbnail: {
				url: this.getIconURL(guild),
				width: 100,
				height: 100
			}
		};
	}
}

module.exports = DiscordUtils;
