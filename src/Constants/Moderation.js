module.exports = {
	// bitmapped actions to take when an offense is made
	ACTIONS: {
		NONE:     0,
		WARN:     1,
		DELETE:   2,
		MUTE:     4,
		STRIKE:   8,
		KICK:     16,
		SOFTBAN:  32,
		BAN:      64,
		REPORT:   128
	},
	LEVELS: {
		NONE:   0, // no filtering
		LOW:    1, // loose filtering
		MEDIUM: 2, // stricter filtering
		HIGH:   3  // strong filtering
	},
	EMOJI_REGEX: require('emoji-regex')(),
	SPAM_FILTERS: ['mentions','links','letters','allcaps','emojis','newlines'],
	LOCKDOWN_ACTIONS: 18,
	TEMPLATE: {
		archiveID: '',
		lockdown: false,
		// holds information about the modlog of the server
		// keeps track of strikes on users
		strikes: {
			users: {},
			actions: [1,5,16]
		}, 
		// usernames and URLs which are banned on the server (prevents raid bots from joining, for example)
		banlist: {
			usernames: [],
			urls: []
		},
		// spam filter settings
		spam: {
			filters: 0,
			actions: 0
		},
		// vulgarity level settings
		vulgarity: {
			level: 0,
			actions: 0
		},
		// modlog management
		modlog: { 
			channelID: '',
			lastCaseID: 0,
			cases: {}
		}
	}
};
