const PREFIX      = '!';
const WILDCARD    = '*';
const DELIMITER   = '.';
const CATEGORY    = '&';
const VARIABLE    = '$';
const KEY         = ':';
const HELP        = '?';
const BLOCK_START = '{';
const BLOCK_END   = '}';
const STOP        = ';';
const QUOTE       = '"';
const ESCAPE      = '\\';
const NEWLINE     = '\n';
const EXPRESSION  = '%';
const EXP_START   = '(';
const EXP_END     = ')';
const ARR_START   = '[';
const ARR_END     = ']';
const OBJ_START   = '{';
const OBJ_END     = '}';

const PUBLIC      = 'public';
const PRIVATE     = 'private';
const PRIVILEGED  = 'privileged';
const WHITELIST   = 'inclusive';
const BLACKLIST   = 'exclusive';
const INHERIT     = 'inherit';
const NOOP = function () {};

module.exports = {
	Symbols: {
		PREFIX,
		WILDCARD,
		DELIMITER,
		CATEGORY,
		VARIABLE,
		KEY,
		HELP,
		BLOCK_START,
		BLOCK_END,
		STOP,
		QUOTE,
		ESCAPE,
		NEWLINE,
		EXPRESSION,
		EXP_START,
		EXP_END,
		ARR_START,
		ARR_END,
		OBJ_START,
		OBJ_END,
		RESERVED: [
			WILDCARD,
			DELIMITER,
			CATEGORY,
			VARIABLE,
			PREFIX,
			KEY,
			BLOCK_START,
			BLOCK_END,
			STOP,
			QUOTE,
			ESCAPE,
			NEWLINE,
			EXPRESSION,
			EXP_START,
			EXP_END,
			ARR_START,
			ARR_END,
			OBJ_START,
			OBJ_END
		]
	},
	DragonBot: {
		TEMP_MSG_LIFETIME:  5000,
		RATE_LIMIT_DELAY:   1000,
		DISCONNECT_DELAY:   3000,
		LAST_COMMAND_LIMIT: 50,
		LOGGING: ['None','Limited','Normal','All']
	},
	Command: {
		TEMPLATE: {
			aliases: [],
			category: 'Misc',
			title: '',
			info: '',
			suppress: false,
			analytics: true,
			parameters: [],
			permissions: {},
			properties: {},
			subcommands: {}
		}
	},
	Commands: {
		FILE_REGEX: /^[^\.]+\.command\.js$/
	},
	Session: {
		TEMPLATE: {
			id: '',
			category: '',
			title: '',
			info: '',
			settings: {
				expires: 0,     // how much time the session lasts
				reset:   false, // reset expiration time when an event fires
				max:     -1,    // max number of uses before the session closes
				cancel:  -1,    // max number of misses before the session closes
				silent:  true   // if a miss occurs, an error should not be displayed
			},
			data: {},
			permissions: {},
			resolver: NOOP,
			events: {},
			manager: null,
			started: () => Date.now(),
			uses: 0,
			misses: 0,
			last_channel_id: ''
		}
	},
	Sessions: {
		FILE_REGEX: /^[^\.]+\.special\.js$/,
		POLL_TIME: 1000
	},
	Moderation: {
		ACTIONS: {
			NONE:   0,
			REMIND: 1,
			DELETE: 2,
			STRIKE: 4,
			KICK:   8
		},
		LEVELS: {
			NONE:   0, // no filtering
			LOW:    1, // loose filtering
			MEDIUM: 2, // stricter filtering
			HIGH:   3  // strong filtering
		},
		TEMPLATE: {
			archiveID: '',
			modlogID: '',
			actions: 0,
			vulgarity: 0,
			spam: 0,
			strikes: {},
			urls: {
				blacklisted: [],
				whitelisted: []
			}
		}
	},
	Permissions: {
		TYPES: {
			PUBLIC,
			PRIVATE,
			PRIVILEGED,
			WHITELIST,
			BLACKLIST,
			INHERIT
		},
		DEFAULT_TYPE: INHERIT,
		STRINGS: {
			PUBLIC:     '**Public**: usable by everyone, everywhere.',
			PRIVATE:    '**Private**: only the bot owner may use this.',
			PRIVILEGED: '**Privileged**: only those with the Manage Guild permission can use this.',
			WHITELIST:  '**Inclusive**: use is limited to whitelisted users/roles/channels only.',
			BLACKLIST:  '**Exclusive**: use is restricted from blacklisted users/roles/channels.',
			INHERIT:    'Inherited from supercommand.'
		},
		TARGETS: [
			'users',
			'roles',
			'channels'
		],
		PRIVILEGED_PERMISSION: 'MANAGE_GUILD',
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
		TEMPLATE: {
			users: [],
			roles: [],
			channels: []
		}
	}
};
