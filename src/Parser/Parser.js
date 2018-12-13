const Block = require('./Block');
const Constants = require('../Constants/Symbols');
const {escape, cast, includesAt} = require('../Utils');

const AVOID = [Constants.BLOCK_START,Constants.BLOCK_END,Constants.STOP];

/**
 * Parser class constructor
 * Turns raw string input into a complex, runnable command
 * @param {String} input
 * @prop {String}     input  - the original input
 * @prop {Array<Any>} tokens - the tokenized input
 * @prop {Number}     i      - the current parsing index
 */
class Parser {
	constructor(input) {
		this.input = input;
		this.tokens = [];
		//this.token = '';
		this.i = 0;
	}
	/**
	 * Turn tokens into a Block that describes the input
	 * @param {String|Array<String>} input - the input tokens or text string
	 * @param {Boolean} [asCommand] - whether to treat the input as a command or as a normal message
	 * @return {Block}
	 */
	static createBlock(input, asCommand = false) {
		if (typeof(input) === 'string') {
			let instance = new Parser(input);
			input = instance.tokenize();
		}
		return new Block(input, asCommand);
	}
	
	get letter() {
		return this.input[this.i];
	}
	get next() {
		return this.input[this.i+1];
	}
	get next2() {
		return this.letter + this.next;
	}
	get next3() {
		return this.next2 + this.input[this.i+2];
	}
	get EOF() {
		return this.i >= this.input.length;
	}
	
	/**
	 * Turn raw text input into tokens that are then configured into Blocks.
	 * @return {Array<Any>} this.tokens
	 */
	tokenize() {
		while (!this.EOF) {
			this.skipWhitespace();
			if (this.letter) {
				let token = this.parseAny();
				if (token) this.tokens.push(token);
			}
		}
		return this.tokens;
	}
	/**
	 * Increment the parser counter until non-whitespace is found.
	 * @param {Number} [start] - override the starting index
	 */
	skipWhitespace(start = this.i) {
		this.i = start;
		while (/\s/.test(this.letter)) this.i++;
	}
	/**
	 * Parse the next token according to its next character(s).
	 * @param {Number} [start] - override the starting index
	 * @return {Any} the token
	 */
	parseAny(start = this.i) {
		this.i = start;
		
		// block quote using ```
		if (this.next3 == Constants.BLOCK_QUOTE) {
			return this.parseMultilineString();
		}
		
		switch (this.next2) {
		// inline comment
		case '//':
			return void this.parseInlineComment();
			
		// block comment
		case '/*':
			return void this.parseBlockComment();
		
		// expression
		case Constants.EXPRESSION+Constants.EXP_START:
			return this.parseExpression();
			
		// array
		case Constants.EXPRESSION+Constants.ARR_START:
			return this.parseArray();
		
		// object
		case Constants.EXPRESSION+Constants.OBJ_START:
			return this.parseObject();
		}
		
		switch (this.letter) {
		case Constants.ESCAPE:
			return this.parseEscape();
			
		// blocks and full stop
		case Constants.BLOCK_START:
		case Constants.BLOCK_END:
		case Constants.STOP:
			return this.parseChar();
			
		// enter quote
		case Constants.QUOTE:
			return this.parseString();
		
		// flag
		// special case: since flags follow the syntax -flag[:value],
		// they must be parsed differently to allow any value to follow the :
		case Constants.FLAG:
			return this.parseFlag();
		}
		
		// any value as long as it isn't interrupted by a space
		return cast(this.parseRaw());
	}
	/**
	 * Parse the next token as a single character.
	 * @param {Number} [start] - override the starting index
	 * @return {String} a single character
	 */
	parseChar(start = this.i) {
		this.i = start;
		let token = this.letter;
		this.i++;
		return token;
	}
	/**
	 * Parse the next token as an escape sequence.
	 * @param {Number} [start] - override the starting index
	 * @param {Boolean} [includeEsc=false] - whether to include the backslash in the returned token
	 * @return {String} the escaped character
	 */
	parseEscape(start = this.i, includeEsc = false) {
		let token = this.parseChar(start+Constants.ESCAPE.length);
		if (includeEsc) {
			token = Constants.ESCAPE + token;
		}
		return token;
	}
	/**
	 * Parse the next token until whitespace is found, then cast to an appropriate type.
	 * @param {Number} [start] - override the starting index
	 * @return {Any} the token 
	 */
	parseRaw(start = this.i) {
		let token = '';
		this.i = start;
		while (this.letter && !/\s/.test(this.letter)) {
			if (AVOID.includes(this.letter)) {
				return token;
			}
			token += this.letter;
			this.i++;
		}
		return cast(token);
	}
	/**
	 * Parse the next token as a number, until it encounters a non-numeric character.
	 * @param {Number} [start] - override the starting index
	 * @return {Number} the number token 
	 */
	parseNumber(start = this.i) {
		let token = '';
		this.i = start;
		while (this.letter && !isNaN(token+this.letter)) {
			token += this.letter;
			this.i++;
		}
		return Number(token);
	}
	/**
	 * Parse the next token as a boolean (true, false).
	 * @param {Number} [start] - override the starting index
	 * @return {Boolean} the boolean token 
	 */
	parseBoolean(start = this.i) {
		let token = this.parseRaw(start);
		if (!token || token === 'false') {
			return false;
		} else {
			return true;
		}
	}
	/**
	 * Parse the next token as a quoted string.
	 * @param {Number} [start] - override the starting index
	 * @return {String} the contents of the string
	 */
	parseString(start = this.i) {
		return this.lookahead(start+1, Constants.QUOTE);
	}
	/**
	 * Parse the next token as a string with multiple lines, i.e. a code block
	 * @param {Number} [start] - override the starting index
	 * @return {String} the contents of the code block
	 */
	parseMultilineString(start = this.i) {
		let lang = this.lookahead(start, Constants.NEWLINE);
		let code = this.lookahead(this.i, Constants.NEWLINE+Constants.BLOCK_QUOTE, true);
		return code;
	}
	/**
	 * Parse the next token as an inline comment.
	 * @param {Number} [start] - override the starting index
	 * @return {String} the comment string 
	 */
	parseInlineComment(start = this.i) {
		return this.lookahead(start, Constants.NEWLINE);
	}
	/**
	 * Parse the next token as a block comment.
	 * @param {Number} [start] - override the starting index
	 * @return {String} the comment string
	 */
	parseBlockComment(start = this.i) {
		return this.lookahead(start, '*/');
	}
	/**
	 * Parse the next token as a raw expression; evaluate later.
	 * @param {Number} [start] - override the starting index
	 * @return {String} the expression
	 */
	parseExpression(start = this.i) {
		return this.lookaheadCarefully(start, Constants.EXP_START, Constants.EXP_END);
	}
	/**
	 * Parse the next token as an array expression; evaluate later.
	 * @param {Number} [start] - override the starting index
	 * @return {String} the expression
	 */
	parseArray(start = this.i) {
		return this.lookaheadCarefully(start, Constants.ARR_START, Constants.ARR_END);
	}
	/**
	 * Parse the next token as an object expression; evaluate later.
	 * @param {Number} [start] - override the starting index
	 * @return {String} the expression
	 */
	parseObject(start = this.i) {
		return this.lookaheadCarefully(start, Constants.OBJ_START, Constants.OBJ_END);
	}
	/**
	 * Parse the next token as a regular expression; evaluate later.
	 * @param {Number} [start] - override the starting index
	 * @return {String} the expression
	 */
	parseRegex(start = this.i) {
		// parse %/..../ and flags afterwards
		this.i = start;
		return this.letter + this.lookahead(this.i+1, Constants.RGX_END, true) + this.parseRaw();
	}
	/**
	 * Parse the next token(s) as a flag, preserving its name and value if any.
	 * If however, this is not a flag, but merely a negative number, then return it as such.
	 * @param {Number} [start] - override the starting index
	 * @return {String} the flag name and contents
	 */
	parseFlag(start = this.i) {
		let flag = this.lookahead(start, () => this.letter == ':' || this.letter == ' ');
		if (!flag) {
			return Constants.FLAG;
		} else if (/^\d+/.test(flag)) {
			return isFinite(flag) ? -Number(flag) : (Constants.FLAG + flag);
		} else if (flag != Constants.FLAG) {
			// flag value indicator
			if (this.letter == Constants.KEY) {
				flag += this.parseChar();
				flag += this.parseAny();
			}
		}
		return flag;
	}
	/**
	 * Parse until a string sequence is found or the callback is satisfied.
	 * @param {Number} [start] - override the starting index
	 * @param {String|Function} callback - the string sequence or callback that returns a boolean
	 * @param {Boolean} [includeEsc=false] - preserve escape chars in escape sequences
	 * @return {String} the token
	 */
	lookahead(start = this.i, callback, includeEsc = false) {
		let stopAt = '';
		if (typeof(callback) === 'string') {
			stopAt = callback;
			callback = () => includesAt(this.input, stopAt, this.i);
		}
		let token = '';
		this.i = start;
		do {
			if (this.letter == Constants.ESCAPE) {
				token += this.parseEscape(this.i, includeEsc);
			} else {
				token += this.letter;
				this.i++;
			}
		} while (this.letter && !callback(this.i, token));
		this.i += stopAt.length;
		return token;
	}
	/**
	 * Parse with respect to scope until the current scope is exited.
	 * @param {Number} [start] - override the starting index
	 * @param {String} [scopeEnter] - the character that starts a scope
	 * @param {String} [scopeExit] - the character that ends a scope
	 * @param {Boolean} [includeEsc=false] - preserve escape chars in escape sequences
	 * @return {String} the token
	 */
	lookaheadCarefully(start = this.i, scopeEnter, scopeExit, includeEsc = false) {
		let s = 1;
		let token = '';
		this.i = start;
		do  {
			if (this.letter == Constants.ESCAPE) {
				token += this.parseEscape(this.i, includeEsc);
			} else {
				token += this.letter;
				this.i++;
				if (this.letter == scopeEnter) {
					s++;
				} else if (this.letter == scopeExit) {
					s--;
				}
			}
		} while (this.letter && s > 0);
		if (s > 0) throw new SyntaxError(`Cannot find matching "${scopeExit}" to close "${scopeEnter}".`);
		return token;
	}
}

module.exports = Parser;
