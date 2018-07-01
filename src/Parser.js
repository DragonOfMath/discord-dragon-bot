const Constants = require('./Constants').Symbols;
const {escape,quote,cast,includesAt} = require('./Utils');

class ParseError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ParseError';
	}
}

/**
	Abstract representation of a command-line "block", which includes a command and its arguments.
	The name "Block" suggests that Blocks themselves can be arguments of other Blocks.
	@arg {Array<Any>} tokens - produced by Parser.tokenize()
*/
class Block {
	constructor(tokens) {
		this.text     = '';
		this.cmd      = '';
		//this.comments = [];
		if (tokens.length > 0) {
			var i, j, t, s, b, stop = false;
			
			if (String(tokens[0]).startsWith(Constants.PREFIX)) {
				this.cmd  = tokens[0].substring(Constants.PREFIX.length);
				this.cmds = this.cmd.split(Constants.DELIMITER);
				this.arg  = '';
				this.args = [];
			} else {
				stop = true;
			}
			
			read:
			for (i = 1; i < tokens.length; ++i) {
				t = tokens[j=i];
				
				if (t == Constants.STOP) {
					stop = true;
					break read;
					
				} else if (/^(\/\/.*|\/\*.*\*\/)$/.test(t)) {
					//this.comments.push(t);
					continue read;
					
				} else if (!stop && t == Constants.BLOCK_START) {
					s = 1;
					do {
						i++;
						switch (tokens[i]) {
							case Constants.BLOCK_START:
								s++;
								break;
							case Constants.BLOCK_END:
								s--;
								if (s > 0) break;
							case Constants.STOP:
								if (s > 1) break;
								b = tokens.slice(j+1,i);
								if (b.length) this.args.push(new Block(b));
								j = i;
								break;
						}
					} while (tokens[i] && s > 0);
					if (s > 0) throw new ParseError(`Missing "${Constants.BLOCK_END}" for token ${j}: ${tokens.join(' ')}`);
					continue read;
					
				} else if (!stop) {
					this.args.push(t);
					continue read;
				}
			}
			
			if (this.cmd) {
				this.arg = this.args.map(String).join(' ');
				
				this.text = Constants.PREFIX + this.cmd;
				if (this.args.length > 0) {
					this.text += ' ' + this.args.map(a => {
						if  (typeof(a) === 'string') return a.includes(' ') ? quote(a) : a;
						else if (a instanceof Block) return '{' + a.toString() + '}';
						else if (a instanceof Object) return '%' + JSON.stringify(a);
						else return a;
					}).join(' ');
				}
			} else {
				this.text = tokens.join(' ');
			}
		}
	}
	toString() {
		return this.text;
	}
}

class Parser {
	/**
		Turn raw text input into a command and its arguments
		@arg {String} text
	*/
	static parseCommand(text) {
		var tokens = this.tokenize(text);
		//console.log(tokens);
		return new Block(tokens);
	}
	/**
		Turn raw text input into tokens that are then configured into Blocks
		@arg {String} text
	*/
	static tokenize(text) {
		var tokens = [], token = '', letter, esc = false;
		
		function push(force) {
			if (token) {
				if (!force) {
					token = cast(token);
				}
				tokens.push(token);
			}
			token = '';
		}
		
		main:
		for (var i = 0, j; i < text.length; ++i) {
			letter = text[j=i];
			
			if (esc) {
				esc = false;
				token += letter;
				continue main;
			}
			
			switch (letter+text[i+1]+text[i+2]) {
				// block string
				case '```':
					j = this.lookahead(text, Constants.NEWLINE, i) + 1;
					i = this.lookahead(text, '```', j) + 2;
					token = text.substring(j, i-2);
					push(true);
					continue main;
			}
			
			switch (letter+text[i+1]) {
				// inline comment
				case '//':
					if (token) break; // avoid breaking links
					i = this.lookahead(text, Constants.NEWLINE, i+1);
					//token = text.substring(j, i);
					push();
					continue main;
					
				// block comment
				case '/*':
					if (token) break; // avoid breaking... regexes?
					i = this.lookahead(text, '*/', i+1) + 1;
					//token = text.substring(j, i+1);
					push();
					continue main;
				
				// expression
				case Constants.EXPRESSION+Constants.EXP_START:
					push();
					i = this.lookaheadCarefully(text, Constants.EXP_START, Constants.EXP_END, i+1);
					token = text.substring(j, i+1);
					push();
					continue main;
				
				// array
				case Constants.EXPRESSION+Constants.ARR_START:
					push();
					i = this.lookaheadCarefully(text, Constants.ARR_START, Constants.ARR_END, i+1);
					token = text.substring(j, i+1);
					push();
					continue main;
				
				// object
				case Constants.EXPRESSION+Constants.OBJ_START:
					push();
					i = this.lookaheadCarefully(text, Constants.OBJ_START, Constants.OBJ_END, i+1);
					token = text.substring(j, i+1);
					push();
					continue main;
			}
			
			switch (letter) {
				// blocks and full stop
				case Constants.BLOCK_START:
				case Constants.BLOCK_END:
				case Constants.STOP:
					push();
					token = letter;
					push();
					continue main;
				
				// whitespace
				case ' ':
				case '\t':
				case '\r':
				case '\n':
					push();
					continue main;
				
				// escape literal character
				case Constants.ESCAPE:
					esc = true;
					continue main;
					
				// enter quote
				case Constants.QUOTE:
					push();
					i = this.lookahead(text, Constants.QUOTE, i+1);
					token = text.substring(j+1,i);
					push(true);
					continue main;
			}
			
			token += letter;
		}
		push();
		return tokens;
	}
	static lookahead(x, y, i = 0) {
		do {
			i++;
			if (x[i] == Constants.ESCAPE) i++;
		} while (x[i] && !includesAt(x,y,i));
		if (!x[i]) throw new ParseError(`Stopping point "${y}" not found.`);
		return i;
	}
	static lookaheadCarefully(x, sin, sout, i = 0) {
		var s = 1;
		do  {
			i++;
			if (x[i] == Constants.ESCAPE)  i++;
			if      (includesAt(x,sin,i))  s++;
			else if (includesAt(x,sout,i)) s--;
		} while (x[i] && s > 0);
		if (s > 0) throw new ParseError(`Cannot find matching "${sout}" to close "${sin}".`);
		return i;
	}
}

module.exports = Parser;
