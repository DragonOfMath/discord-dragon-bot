const PREFIX      = '🐉'; // dragon :D
const WILDCARD    = '*';
const DELIMITER   = '.';
const CATEGORY    = '&';
const VARIABLE    = '$';
const FLAG        = '-';
const KEY         = ':';
const HELP        = '?';
const BLOCK_START = '{';
const BLOCK_END   = '}';
const STOP        = ';';
const QUOTE       = '"';
const BLOCK_QUOTE = '```';
const ESCAPE      = '\\';
const NEWLINE     = '\n';
const EXPRESSION  = '%';
const EXP_START   = '(';
const EXP_END     = ')';
const ARR_START   = '[';
const ARR_END     = ']';
const OBJ_START   = '{';
const OBJ_END     = '}';
const RGX_START   = '/';
const RGX_END     = '/';
const BOM         = '\ufeff';
const ZWS         = '\u200b';
const NBSP        = '\u00a0';

module.exports = {
	PREFIX,
	WILDCARD,
	DELIMITER,
	CATEGORY,
	VARIABLE,
	FLAG,
	KEY,
	HELP,
	BLOCK_START,
	BLOCK_END,
	STOP,
	QUOTE,
	BLOCK_QUOTE,
	ESCAPE,
	NEWLINE,
	EXPRESSION,
	EXP_START,
	EXP_END,
	ARR_START,
	ARR_END,
	OBJ_START,
	OBJ_END,
	RGX_START,
	RGX_END,
	RESERVED: [
		WILDCARD,
		DELIMITER,
		CATEGORY,
		VARIABLE,
		//PREFIX,
		//FLAG,
		//KEY,
		BLOCK_START,
		BLOCK_END,
		STOP,
		QUOTE,
		BLOCK_QUOTE,
		ESCAPE,
		NEWLINE,
		EXPRESSION,
		EXP_START,
		EXP_END,
		ARR_START,
		ARR_END,
		OBJ_START,
		OBJ_END,
		RGX_START,
		RGX_END
	],
	BOM,
	ZWS,
	NBSP
};
