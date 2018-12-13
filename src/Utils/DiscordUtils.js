const Constants         = require('../Constants/Discord');
const {Array}           = require('./Array');
const {Markdown:md}     = require('./markdown');
const {strcmp,truncate} = require('./string');
const {Base64}          = require('./base64');
const crypto            = require('crypto');

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
		return server ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=512` : '';
	}
	static getSplashURL(server) {
		return server ? `https://cdn.discordapp.com/splashes/${server.id}/${server.splash}.png` : '';
	}
	static getAvatarURL(user) {
		if (user.avatar == null) {
			return this.getDefaultAvatarURL(user);
		}
		return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_')?'gif':'png'}?size=512`;
	}
	static getDefaultAvatarURL(user) {
		return `https://cdn.discordapp.com/embed/avatars/${user.discriminator%5}.png`;
	}
	static getEmojiURL(emoji) {
		return `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated?'gif':'png'}?v=1`;
	}
	static getInviteLink(invite) {
		return `https://discord.gg/${invite.code||invite}`;
	}
	static getCreationTime(id) {
		return new Date((+id >> 22) + Constants.EPOCH);
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
	static getServerTextChannels(server) {
		return this.getServerChannels(server).filter(channel => channel.type == 'text' || channel.type == 0);
	}
	static getServerVoiceChannels(server) {
		return this.getServerChannels(server).filter(channel => channel.type == 'voice' || channel.type == 2);
	}
	static getServerCategoryChannels(server) {
		return this.getServerChannels(server).filter(channel => channel.type == 'category' || channel.type == 4);
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
		return this.getObjects(servers).map(server => this.getServerChannels(server)).reduce((a,x) => a.concat(x), []);
	}
	static getAllRoles(servers) {
		return this.getObjects(servers).map(server => this.getServerRoles(server)).reduce((a,x) => a.concat(x), []);
	}
	static getAllEmojis(servers) {
		return this.getObjects(servers).map(server => this.getServerEmojis(server)).reduce((a,x) => a.concat(x), []);
	}
	static getUsersByStatus(server, status = 'online') {
		return this.search(server.members, member => member.status == status);
	}
	static getUsersByGame(users, game) {
		let usersInGames = this.search(users, user => !user.bot && user.game);
		let games = Array.groupBy(usersInGames, user => user.game.name);
		if (game) {
			return games[game];
		} else {
			return games;
		}
	}
	static search(objects, filter) {
		return this.getObjects(objects).filter(filter);
	}
	static hasContent(m) {
		return m.attachments.length > 0 || m.embeds.length > 0 || m.content.match(/https?:\/\//g);
	}
	static filterMessage(client, message, flags = new Map()) {
		if (!Map.size) {
			return true;
		}
		if (message.content.startsWith(client.PREFIX) && (flags.has('cmds') || flags.has('c'))) {
			return true;
		}
		if (message.author.id == client.id && (flags.has('bot') || flags.has('b'))) {
			return true;
		}
		if (this.hasContent(message) && (flags.has('media') || flags.has('m'))) {
			return true;
		} else if (message.content.length && (flags.has('text') || flags.has('t'))) {
			return true;
		}
		if (message.pinned && (flags.has('pinned') || flags.has('p'))) {
			return true;
		}
		return false;
	}
	static filterMessages(client, messages, flags = new Map()) {
		return messages.filter(message => this.filterMessage(client, message, flags));
	}
	static embedMessage(message) {
		let embed = {
			description: message.content,
			timestamp: message.timestamp,
			fields: [],
			footer: {
				text: `ID: ${message.id} • Channel ID: ${message.channel_id}`
			}
		};
		
		// stringify any embeds in the message so they are not left out
		for (let e of message.embeds) {
			embed.description += DiscordEmbed.stringify('', e);
		}
		embed.description = truncate(embed.description, 2000);
		
		switch (Constants.MESSAGE_TYPES[message.type]) {
			case 'Default':
				embed.title = md.atUser(message.author);
				break;
			case 'Guild Member Joined':
				embed.description = md.atUser(message.author) + ID(message.author.id);
			default:
				embed.title = Constants.MESSAGE_TYPES[message.type];
				break;
		}
		
		if (message.attachments && message.attachments.length > 0) {
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
					value: 	Constants.CHANNEL_TYPES[channel.type],
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
		var members      = Object.keys(server.members);
		var membersByBot = Array.groupBy(members, m => !!client.users[m.id].bot);
		var channels       = Object.keys(server.channels);
		var channelsByType = Array.groupBy(channels, channel => channel.type);
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
					name: ':white_check_mark: Verification',
					value: Constants.VERIFICATION_LEVELS[server.verification_level],
					inline: true
				},
				{
					name: ':busts_in_silhouette: Members',
					value: `${members.length} (${membersByBot[false].length} 🙂 | ${membersByBot[true].length} 🤖)`,
					inline: true
				},
				{
					name: ':speech_balloon: Channels',
					value: `${channels.length} (${channelsByType[0].length} 💬 | ${channelsByType[2].length} 🔊 | ${channelsByType[4].length} 🗂)`,
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
	static embedUser(user, member, client) {
		let embed = {};
		embed.title = md.atUser(user);
		if (member) {
			embed.title += ` (${member.nick||'No nickname'})`;
		} else {
			embed.title += ` (Not a member in this server)`;
		}
		embed.fields = [];
		embed.fields.push({
			name: ':1234: ID',
			value: user.id,
			inline: true
		});
		embed.fields.push({
			name: ':speaking_head: Mention',
			value: md.mention(user),
			inline: true
		});
		if (!member && client) {
			let sharedServers = this.getServersByUser(client.servers, user);
			embed.fields.push({
				name: ':homes: Servers',
				value: sharedServers.map(s => s.name).join(', ') || 'Not in any shared servers',
				inline: true
			});
			if (sharedServers.length) {
				member = sharedServers[0].members[user.id];
			}
		}
		if (member) {
			embed.fields.push({
				name: ':calendar: Joined',
				value: new Date(member.joined_at).toLocaleString(),
				inline: true
			});
			embed.fields.push({
				name: ':clock4: Status',
				value: member.status || 'offline?',
				inline: true
			});
			embed.fields.push({
				name: ':robot: Is Bot?',
				value: yes(member.bot),
				inline: true
			});
			embed.fields.push({
				name: ':pencil: Roles',
				value: member.roles.map(md.role).join('\n') || 'None',
				inline: true
			});
		}
		embed.thumbnail = {
			url: this.getAvatarURL(user),
			width: 60,
			height: 60
		};
		return embed;
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
		let {inviter,code,guild,channel,revoked} = invite;
		if (revoked) {
			return 'Invite revoked.';
		}
		let embed = {
			fields: [
				{
					name: ':1234: ID',
					value: code,
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
				},
				{
					name: ':white_check_mark: Verification',
					value: Constants.VERIFICATION_LEVELS[guild.verification_level],
					inline: true
				}
			],
			thumbnail: {
				url: this.getIconURL(guild),
				width: 100,
				height: 100
			}
		};
		if (inviter) {
			embed.fields.push({
				name: ':slight_smile: Inviter',
				value: md.atUser(inviter) + ' / ' + md.mention(inviter),
				inline: true
			});
		}
		if (guild.features && guild.features.length) {
			embed.fields.push({
				name: ':tada: Features',
				value: guild.features.join(', '),
				inline: true
			});
		}
		return embed;
	}
	static debugMessage(message) {
		let embed = this.embedMessage(message);
		return DiscordEmbed.stringify(embed);
	}
	static decodeToken(token) {
		let [id,time,hmac] = token.split('.');
		id   = Base64.from(id); // snowflake ID of user
		time = Base64.from(time, 'number'); // time of token generation
		time = new Date((time + Constants.TOKEN_EPOCH) * 1000); // unix time
		return {id, time, hmac};
	}
	static generateFakeToken(id = '123456789012345') {
		let time = Math.floor(Date.now() / 1000) - Constants.TOKEN_EPOCH;
		let hmac = crypto.createHmac('sha256', id);
		hmac.update(time.toString(16));
		hmac.update('poop');
		return [Base64.to(String(id)), Base64.to(time), hmac.digest('base64')].join('.')
		.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
	}
	static getReactions(newMessage, oldMessage) {
		if (newMessage.id != oldMessage.id) return {};

		let reactions = {};
		
		for (let reaction of newMessage.reactions) {
			let emoji = reaction.emoji.name;
			reactions[emoji] = reaction.count;
		}

		for (let reaction of oldMessage.reactions) {
			let emoji = reaction.emoji.name;
			reactions[emoji] = (reactions[emoji] || 0) - reaction.count;
			if(reactions[emoji] == 0) {
				delete reactions[emoji];
			}
		}

		return reactions;
	}
	static getServersInCommon(client, user) {
		let servers = [];
		for(let serverID in client.servers) {
			let server = client.servers[serverID];
			if (server.members[user.id]) {
				servers.push(server);
			}
		}
		return servers;
	}
	static getPermissionNames(flags) {
		const Permissions = require('../Permissions/Permissions');
		return Permissions.getPermissionNames(flags);
	}
	static calculatePermissions(values) {
		const Permissions = require('../Permissions/Permissions');
		return Permissions.calculatePermissions(values);
	}
}

class DiscordEmbed {
	constructor(message = '', embed) {
		this.message = '';
		if (typeof (message) === 'object') {
			if ('embed' in message) {
				({message,embed} = message);
			} else {
				[message, embed] = [embed, message];
			}
		}
		if (typeof(message) === 'string') {
			this.message = message;
		}
		if (typeof(embed) === 'object' && embed != null) {
			this.embed = embed;
		}
	}
	embedThumbnail(url,width,height) {
		this.embed = this.embed || {};
		this.embed.thumbnail = {url,width,height};
		return this;
	}
	embedImage(url,width,height) {
		this.embed = this.embed || {};
		this.embed.image = {url,width,height};
		return this;
	}
	embedVideo(url,width,height) {
		this.embed = this.embed || {};
		this.embed.video = {url,width,height};
		return this;
	}
	embedProvider(name,url) {
		this.embed = this.embed || {};
		this.embed.provider = {name,url};
		return this;
	}
	setAuthor(name,url,icon_url) {
		this.embed = this.embed || {};
		this.embed.author = {name,url,icon_url};
		return this;
	}
	setMessage(x) {
		this.message = x;
		return this;
	}
	setColor(x) {
		this.embed = this.embed || {};
		this.embed.color = Number(x);
		return this;
	}
	setTitle(x) {
		this.embed = this.embed || {};
		this.embed.title = x;
		return this;
	}
	setDescription(x) {
		this.embed = this.embed || {};
		this.embed.description = x;
		return this;
	}
	setFooter(text,icon_url) {
		this.embed = this.embed || {};
		this.embed.footer = {text,icon_url};
		return this;
	}
	setURL(url) {
		this.embed = this.embed || {};
		this.embed.url = url;
		return this;
	}
	addField(name,value,inline) {
		this.embed = this.embed || {};
		this.embed.fields = this.embed.fields || [];
		inline = !!inline;
		this.embed.fields.push({name,value,inline});
		return this;
	}
	/**
		Ensures message + embed are within Discord's size limits
		https://discordapp.com/developers/docs/resources/channel#embed-limits
	*/
	checkPayloadLength() {
		if (typeof(this.message) === 'string' && this.message.length > 2000) {
			throw new Error('Message length exceeds Discord\'s limit: ' + this.message.length);
		}
		
		if (typeof(this.embed) === 'object') {
			let totalLength = 0;
			if (this.embed.title) {
				if (this.embed.title.length > 256) {
					throw new Error('Embed title length exceeds Discord\'s limit: ' + this.embed.title.length);
				} else {
					totalLength += this.embed.title.length;
				}
			}
			if (this.embed.description) {
				if (this.embed.description.length > 2048) {
					throw new Error('Embed description length exceeds Discord\'s limit: ' + this.embed.description.length);
				} else {
					totalLength += this.embed.description.length;
				}
			}
			if (this.embed.fields) {
				if (this.embed.fields.length > 25) {
					throw new Error('Number of embed fields exceeds Discord\'s limit: ' + this.embed.fields.length);
				} else {
					for (let f of this.embed.fields) {
						if (typeof(f.name) !== 'string') {
							f.name = String(f.name);
						}
						if (f.name.length > 256) {
							throw new Error('Embed field name length exceeds Discord\'s limit: ' + f.name.length);
						} else {
							// field names count as double towards the total characters
							totalLength += 2 * f.name.length;
						}
						if (typeof(f.value) !== 'string') {
							f.value = String(f.value);
						}
						if (f.value.length > 1024) {
							throw new Error('Embed field value length exceeds Discord\'s limit: ' + f.value.length);
						} else {
							totalLength += f.value.length;
						}
					}
				}
			}
			if (this.embed.footer && this.embed.footer.text) {
				if (this.embed.footer.text.length > 2048) {
					throw new Error('Embed footer text length exceeds Discord\'s limit: ' + this.embed.footer.text.length);
				} else {
					totalLength += this.embed.footer.text.length;
				}
			}
			if (this.embed.author && this.embed.author.name) {
				if (this.embed.author.name.length > 256) {
					throw new Error('Embed author name length exceeds Discord\'s limit: ' + this.embed.author.name.length);
				} else {
					totalLength += this.embed.author.name.length;
				}
			}
			
			if (totalLength > 6000) {
				throw new Error('Total embed text length exceeds Discord\'s limit: ' + totalLength);
			}
		}
		
		return true;
	}
	/**
		Modifies all string properties and fields
	*/
	replaceAll(regex, sub) {
		if (this.message) {
			this.message = this.message.replace(regex, sub);
		}
		if (this.embed) {
			if (this.embed.title) {
				this.embed.title = String(this.embed.title).replace(regex, sub);
			}
			if (this.embed.description) {
				this.embed.description = String(this.embed.description).replace(regex, sub);
			}
			if (this.embed.footer) {
				this.embed.footer.text = String(this.embed.footer.text).replace(regex, sub);
			}
			if (this.embed.fields) for (var field of this.embed.fields) {
				field.name = String(field.name).replace(regex, sub);
				field.value = String(field.value).replace(regex, sub);
			}
		}
		return this;
	}
	replaceOnly(regex, sub, keys = []) {
		if (keys.includes('message') && this.message) {
			this.message = this.message.replace(regex, sub);
		}
		if (keys.includes('embed') && this.embed) {
			if (keys.includes('title') && this.embed.title) {
				this.embed.title = String(this.embed.title).replace(regex, sub);
			}
			if (keys.includes('description') && this.embed.description) {
				this.embed.description = String(this.embed.description).replace(regex, sub);
			}
			if (keys.includes('footer') ** this.embed.footer) {
				this.embed.footer.text = String(this.embed.footer.text).replace(regex, sub);
			}
			if (keys.includes('fields') && this.embed.fields) for(var field of this.embed.fields) {
				field.name = String(field.name).replace(regex, sub);
				field.value = String(field.value).replace(regex, sub);
			}
		}
		return this;
	}
	toString() {
		var str = this.message + '\n';
		if (this.embed) {
			if (this.embed.title) {
				str += '**' + this.embed.title + '**\n';
			}
			if (this.embed.url) {
				str += this.embed.url + '\n';
			}
			if (this.embed.description) {
				str += this.embed.description + '\n';
			}
			if (this.embed.fields) {
				for (var field of this.embed.fields) {
					str += '**' + field.name + '**\n' + field.value + '\n';
				}
			}
			if (this.embed.footer) {
				str += this.embed.footer.text + '\n';
			}
			if (this.embed.image && this.embed.image.url != this.embed.url) {
				str += this.embed.image.url + '\n';
			}
			if (this.embed.video && this.embed.video.url != this.embed.url) {
				str += this.embed.video.url;
			}
		}
		return str.trim();
	}
	static stringify(message, embed) {
		return new DiscordEmbed(message, embed).toString();
	}
}

module.exports = {DiscordUtils, DiscordEmbed};
