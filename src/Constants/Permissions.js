const PUBLIC      = 'public';
const PRIVATE     = 'private';
const PRIVILEGED  = 'privileged';
const DM_ONLY     = 'dm';
const WHITELIST   = 'inclusive';
const BLACKLIST   = 'exclusive';
const INHERIT     = 'inherit';
const DEFAULT     = INHERIT;
const PRIVILEGED_PERMISSION = 'MANAGE_CHANNELS';

module.exports = {
	DEFAULT,
	TYPES: {
		PUBLIC,
		PRIVATE,
		PRIVILEGED,
		WHITELIST,
		BLACKLIST,
		DM_ONLY,
		INHERIT
	},
	STRINGS: {
		PUBLIC:     '**Public**: usable by everyone, everywhere.',
		PRIVATE:    '**Private**: only the bot owner may use this.',
		PRIVILEGED: '**Privileged**: only those with the ' + PRIVILEGED_PERMISSION + ' permission can use this.',
		WHITELIST:  '**Inclusive**: use is limited to whitelisted users/roles/channels only.',
		BLACKLIST:  '**Exclusive**: use is restricted from blacklisted users/roles/channels.',
		DM_ONLY:    'This command may only be used in DMs with the bot.',
		INHERIT:    'Inherited from supercommand.'
	},
	TARGETS: [
		'users',
		'roles',
		'channels'
	],
	PRIVILEGED_PERMISSION,
	FLAGS: {
		CREATE_INSTANT_INVITE: 0,
		KICK_MEMBERS: 1,
		BAN_MEMBERS: 2,
		ADMINISTRATOR: 3,
		MANAGE_CHANNELS: 4,
		MANAGE_GUILD: 5,
		ADD_REACTIONS: 6,
		VIEW_AUDIT_LOG: 7,
		VIEW_CHANNEL: 10,
		SEND_MESSAGES: 11,
		SEND_TTS_MESSAGES: 12,
		MANAGE_MESSAGES: 13,
		EMBED_LINKS: 14,
		ATTACH_FILES: 15,
		READ_MESSAGE_HISTORY: 16,
		MENTION_EVERYONE: 17,
		USE_EXTERNAL_EMOJIS: 18,
		CONNECT: 20,
		SPEAK: 21,
		MUTE_MEMBERS: 22,
		DEAFEN_MEMBERS: 23,
		MOVE_MEMBERS: 24,
		USE_VAD: 25,
		CHANGE_NICKNAME: 26,
		MANAGE_NICKNAMES: 27,
		MANAGE_ROLES: 28,
		MANAGE_WEBHOOKS: 29,
		MANAGE_EMOJIS: 30
	},
	DISCORDIO_FLAGS: require('discord.io').Permissions, // for compatibility
	TEMPLATE: {
		users: [],
		roles: [],
		channels: []
	}
};
