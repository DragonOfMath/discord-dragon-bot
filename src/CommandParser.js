const Constants = require('./Constants');
const {escape,quote} = require('./Utils');

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
		
		if (tokens.length > 0 && tokens[0].startsWith(Constants.Symbols.PREFIX)) {
			try {
				this.cmd  = tokens.shift().substring(1);
				this.cmds = this.cmd.split(Constants.Symbols.DELIMITER);
				
				read: for (var i = 0, j, scope = 0, temp = []; i < tokens.length; ++i) {
					switch (tokens[i]) {
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
							if (/^(\/\/.*|\/\*.*\*\/)$/.test(tokens[i])) {
								this.comments.push(tokens[i]);
							} else {
								this.args.push(tokens[i]);
							}
							break;
					}
				}
				
				this.arg = this.args.map(String).join(' ');
				
				this.text = Constants.Symbols.PREFIX + this.cmd;
				if (this.arg) {
					this.text += ' ' + this.args.map(a => {
						if (a == Number(a)) return a;
						else if (typeof(a) === 'string') return a.includes(' ') ? quote(a) : a;
						else return '{' + a.toString() + '}';
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
		var tokens = [], token = '', letter, next, quote = false, esc = false, scope = 0;
		
		function push() {
			if (token) tokens.push(token);
			token = '';
		}
		function match(i,sub) {
			return text.substring(i,i+sub.length) == sub;
		}
		function lookahead(i,sub) {
			var j = i;
			while (text[j] && !match(j,sub)) ++j;
			return j;
		}
		function lookaheadWithScope(i,scopeIn,scopeOut) {
			var j = i;
			var _scope = scope++;
			while (text[++j] && scope > _scope) {
				if      (match(j,scopeIn))  scope++;
				else if (match(j,scopeOut)) scope--;
			}
			return j;
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
				quote = !quote;
				continue;
				
			// constructs
			} else if (!quote) {
				// inline comment
				if (letter+next == '//') {
					push();
					j = i;
					i = lookahead(i+2,'\n');
					var comment = text.substring(j,i);
					tokens.push(comment);
					continue;
					
				// block comment
				} else if (letter+next == '/*') {
					push();
					j = i;
					i = lookahead(i+2,'*/') + 1;
					var comment = text.substring(j,i+1);
					tokens.push(comment);
					continue;
					
				// whitespace
				} else if (/\s/.test(letter)) {
					push();
					continue;
					
				// blocks and full stop
				} else if (letter == Constants.Symbols.BLOCK_START || 
						   letter == Constants.Symbols.BLOCK_END   ||
						   letter == Constants.Symbols.STOP) {
					push();
					tokens.push(letter);
					continue;
					
				// expression (read and evaluated at parse time)
				} else if (letter == Constants.Symbols.EXPRESSION && next == Constants.Symbols.EXP_START) {
					j = i;
					i = lookaheadWithScope(i+1, Constants.Symbols.EXP_START, Constants.Symbols.EXP_END);
					var expression = text.substring(j+1,i+1);
					token = eval(expression) || '';
					push();
					continue;
				}
			}
			
			token += letter;
		}
		push();
		
		return tokens;
	}
}

module.exports = CommandParser;
