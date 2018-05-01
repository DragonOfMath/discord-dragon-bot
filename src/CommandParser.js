const Constants = require('./Constants');
const {escape,quote,cast} = require('./Utils');

/**
	Abstract representation of a command-line "block", which includes a command and its arguments.
	The name "Block" suggests that Blocks themselves can be arguments of other Blocks.
	@arg {Array<String>} tokens - produced by CommandParser.tokenize()
*/
class Block {
	constructor(tokens) {
		this.text     = '';
		this.cmd      = '';
		this.args     = [];
		this.comments = [];
		
		if (tokens.length > 0 && String(tokens[0]).startsWith(Constants.Symbols.PREFIX)) {
			try {
				this.cmd  = tokens.shift().substring(1);
				this.cmds = this.cmd.split(Constants.Symbols.DELIMITER);
				
				read: for (var i = 0, j, t, scope = 0, temp = []; i < tokens.length; ++i) {
					switch (t= tokens[i]) {
						case Constants.Symbols.BLOCK_START:
							temp.push(i);
							scope++;
							break;
						case Constants.Symbols.BLOCK_END:
							scope--;
							j = temp.pop(i);
							if (j > -1 && scope == 0) {
								var b = tokens.slice(j+1,i);
								if (b.length) this.args.push(new Block(b));
							}
							break;
						case Constants.Symbols.STOP:
							if (scope == 0) {
								break read;
							}
							scope--;
							j = temp.pop(i);
							if (j > -1 && scope == 0) {
								var b = tokens.slice(j+1,i);
								if (b.length) this.args.push(new Block(b));
							}
							temp.push(i);
							scope++;
							break;
						default:
							if (scope != 0) break;
							if (/^(\/\/.*|\/\*.*\*\/)$/.test(t)) {
								this.comments.push(t);
							} else {
								this.args.push(t);
							}
							break;
					}
				}
				
				this.arg = this.args.map(String).join(' ');
				
				this.text = Constants.Symbols.PREFIX + this.cmd;
				if (this.arg) {
					this.text += ' ' + this.args.map(a => {
						if  (typeof(a) === 'string') return a.includes(' ') ? quote(a) : a;
						else if (a instanceof Block) return '{' + a.toString() + '}';
						else return a;
					}).join(' ');
				}
			} catch (e) {
				console.error(e);
			}
		} else {
			this.text = tokens.join(' ');
		}
	}
	toString() {
		return this.text;
	}
}

class CommandParser {
	/**
		Turn raw text input into a command and its arguments
		@arg {String} text
	*/
	static parse(text) {
		text = text.trim();
		return new Block(this.tokenize(text));
	}
	/**
		Turn raw text input into tokens that are then configured into Blocks
		@arg {String} text
	*/
	static tokenize(text) {
		var tokens = [], token = '', letter, next, quote = false, forceString = false, esc = false, scope = 0;
		
		function addToken() {
			if (token) {
				if (!forceString) token = cast(token);
				tokens.push(token);
			}
			token = '';
			forceString = false;
		}
		function match(i,sub) {
			return text.substring(i,i+sub.length) == sub;
		}
		function lookahead(i,sub) {
			while (text[i] && !match(i,sub)) ++i;
			return i;
		}
		function lookaheadWithScope(i,scopeIn,scopeOut) {
			var _scope = scope++;
			do  {
				i++;
				if      (match(i,scopeIn))  scope++;
				else if (match(i,scopeOut)) scope--;
			} while (text[i] && scope > _scope);
			return i;
		}
		
		for (var i = 0, j; i < text.length; ++i) {
			letter = text[i];
			next   = text[i+1];
			
			// escape literal character
			if (esc) {
				esc = false;
			} else if (letter == '\\') {
				esc = true;
				continue;
				
			// enter/leave quote
			} else if (letter == '"') {
				forceString = true;
				quote = !quote;
				continue;
				
			// constructs
			} else if (!quote) {
				// inline comment (only works if the token is empty; otherwise it keeps the // in links)
				if (letter+next == '//' && token == '') {
					j = i;
					i = lookahead(i+2,'\n');
					var comment = text.substring(j,i);
					//tokens.push(comment);
					continue;
					
				// block comment
				} else if (letter+next == '/*') {
					addToken();
					j = i;
					i = lookahead(i+2,'*/') + 1;
					var comment = text.substring(j,i+1);
					//tokens.push(comment);
					continue;
					
				// whitespace
				} else if (/\s/.test(letter)) {
					addToken();
					continue;
					
				// blocks and full stop
				} else if (letter == Constants.Symbols.BLOCK_START || 
						   letter == Constants.Symbols.BLOCK_END   ||
						   letter == Constants.Symbols.STOP) {
					addToken();
					tokens.push(letter);
					continue;
					
				// expression
				} else if (letter == Constants.Symbols.EXPRESSION && next == Constants.Symbols.EXP_START) {
					addToken();
					j = i;
					i = lookaheadWithScope(i+1, Constants.Symbols.EXP_START, Constants.Symbols.EXP_END);
					var expression = text.substring(j,i+1);
					// do NOT evaluate yet!
					tokens.push(expression);
					continue;
				}
			}
			
			token += letter;
		}
		addToken();
		
		return tokens;
	}
}

module.exports = CommandParser;
