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
const EXPRESSION  = '%';
const EXP_START   = '(';
const EXP_END     = ')';

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
		EXPRESSION,
		EXP_START,
		EXP_END,
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
			EXPRESSION,
			EXP_START,
			EXP_END
		]
	},
	Command: {
		DEFAULT_CATEGORY: '',
		DEFAULT_TITLE: '',
		DEFAULT_INFO: '',
		DEFAULT_SUPPRESSION: false,
		DEFAULT_ANALYTICS: true
	},
	Commands: {
		FILE_REGEX: /^[^\.]+\.command\.js$/
	},
	Sessions: {
		FILE_REGEX: /^[^\.]+\.special\.js$/,
		POLL_TIME: 1000
	},
	DragonBot: {
		TEMP_MSG_LIFETIME: 5000,
		RATE_LIMIT_DELAY: 1000,
		DISCONNECT_DELAY: 3000
	}
};
