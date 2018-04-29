const {Markdown:md} = require('./Utils');

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

function find(o,a,x) {
	for (let id in o) {
		var k = o[id][a];
		if (k == x || (k instanceof Array && k.indexOf(x) > -1)) return id;
	}
	return '';
}
function findAll(o,a,x) {
	let arr = [];
	for (let id in o) {
		var k = o[id][a];
		if (k == x || (k instanceof Array && k.indexOf(x) > -1)) arr.push(id);
	}
	return arr;
}

function hasContent(m) {
	return m.attachments.length > 0 || m.embeds.length > 0 || m.content.match(/https?:\/\//g);
}

/**
	Creates an embed frame for the message object. Useful for testing previews of archives.
	@arg {Message} message object
*/
function embedMessage(message) {
	try {
		var embed = {
			description: message.content,
			timestamp: message.timestamp,
			fields: [],
			footer: {
				text: `ID: ${message.id} • Channel ID: ${message.channel_id}`
			}
		};
		
		switch (MESSAGE_TYPES[message.type]) {
			case 'Default':
				var user = message.author;
				embed.title = md.atUser(user);
				break;
			default:
				embed.title = MESSAGE_TYPES[message.type];
				break;
		}
		
		if (message.attachments.length > 0 || message.embeds.length > 0) {
			embed.fields.push({
				name: 'Attachments and Links',
				value: (messages.attachments.concat(messages.embeds)).map(x => x.url || (x.image && x.image.url) || (x.video && x.video.url)).join('\n')
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
	} catch (e) {
		console.error(e);
	}
}
function embedChannel(channel) {
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
function embedServer(server, client) {
	var members  = Object.keys(server.members);
	var channels = Object.keys(server.channels);
	var roles    = Object.keys(server.roles);
	var emojis   = Object.keys(server.emojis);
	var icon     = getIconURL(server);
	
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
				value: md.mention(server.owner_id),
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
function embedUser(user, member) {
	return {
		title: md.atUser(user) + ` (${member.nick||'No nickname'})`,
		fields: [
			{
				name: ':1234: ID',
				value: user.id,
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
			url: getAvatarURL(user),
			width: 60,
			height: 60
		}
	};
}
function embedRole(role, server) {
	var members = server.members;
	var membersWithRole = Object.keys(members).filter(m => members[m].roles.includes(role.id));
	
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
function embedInvite(invite) {
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
				value: md.mention(inviter.id),
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
			url: getIconURL(guild),
			width: 100,
			height: 100
		}
	};
}

function ID(id) {
	return ' (ID: ' + md.code(id) + ')';
}
function getIconURL(server) {
	return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
}
function getAvatarURL(user) {
	if (user.avatar.startsWith('a_')) {
		return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif`;
	} else {
		return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
	}
}

module.exports = {
	find,
	findAll,
	hasContent,
	embedMessage,
	embedServer,
	embedChannel,
	embedUser,
	embedRole,
	embedInvite,
	getIconURL,
	getAvatarURL,
	CHANNEL_TYPES,
	MESSAGE_TYPES,
	VERIFICATION_LEVELS
};
