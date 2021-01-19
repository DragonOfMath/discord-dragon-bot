const OPERATORS = ['+','-','*','/','^','**',',','(',')'];
const PRECEDENCE = {
	'+': 2,
	'-': 2,
	'*': 3,
	'/': 3,
	'^': 4,
	'**': 4,
	',': 999,
	'(': 999,
	')': 999
};
const ASSOCIATIVITY = {
	'**': 1,
	'^': 1,
	'+': 0,
	'-': 0,
	'*': 0,
	'/': 0,
	',': 0,
	'(': -1,
	')': -1
};

const SPACE = /\s/;
const NUMBER = /[\d\.]/;
const WORD = /\w/;

const OPEN = '(';
const CLOSE = ')';
const ARG_SEPARATOR = ',';

class Token {
	constructor(value, type, index, args = 0) {
		this.value = value;
		this.type  = type;
		this.index = index;
		this.args  = args;
	}
	get unary() {
		return this.type == 'operator' && this.args == 1;
	}
	get binary() {
		return this.type == 'operator' && this.args == 2;
	}
	get precedence() {
		switch (this.type) {
			case 'number':
			case 'variable':
			case 'expression':
				return 0;
			case 'operator':
				if (this.unary && this.value == '-') {
					return PRECEDENCE['**'];
				} else {
					return PRECEDENCE[this.value];
				}
			case 'function':
				return PRECEDENCE['**']+1;
		}
	}
	get associativity() {
		if (this.type === 'operator') {
			if (this.unary && this.value == '-') {
				return 1;
			} else {
				return ASSOCIATIVITY[this.value];
			}
		} else {
			return 0;
		}
	}
	toString() {
		return `${this.value} (${this.type}@${this.index})`;
	}
}

class Tokenizer {
	constructor() {
		this.OPERATORS = OPERATORS;
		this.FUNCTIONS = []; // may contain defined functions to sanitize tokens
		this.VARIABLES = []; // may contain defined variables to sanitize tokens
		this.RESERVED  = []; // other reserved token values
		this.tokens    = [];
	}
	get functions() {
		return this.tokens.filter(token => token.type === 'function');
	}
	get variables() {
		return this.tokens.filter(token => token.type === 'variable');
	}
	get expressions() {
		return this.tokens.filter(token => token.type === 'expression');
	}
	// separates an expression string into token substrings, ex. 3+4 -> [3,'+',4]
	parse(input) {
		this.tokens = [];
		for (let i = 0, token, t; i < input.length;) {
			t = input[i];
			if (NUMBER.test(t)) {
				while (input[++i] && NUMBER.test(input[i]) && (t += input[i]));
				if (input[i] === 'i') { // imaginary number
					t += input[i++];
					// expressions are treated like numeric literals except they are not cast to a number
					// evaluation of these is left to the application
					token = new Token(t, 'expression', this.tokens.length);
				} else {
					token = new Token(Number(t), 'number', this.tokens.length);
				}
				this.tokens.push(token);
				continue;
			} else if (WORD.test(t)) {
				while (input[++i] && (WORD.test(input[i])||NUMBER.test(input[i])) && (t += input[i]));
				if (input[i] == OPEN) {
					token = new Token(t, 'function', this.tokens.length);
				} else if (t == 'i') { // 1i implied
					token = new Token(t, 'expression', this.tokens.length);
				} else {
					token = new Token(t, 'variable', this.tokens.length);
				}
				this.tokens.push(token);
				continue;
			} else if (this.OPERATORS.includes(t)) {
				if (t == '*' && input[i+1] == '*') {
					t += input[++i];
				}
				token = new Token(t, 'operator', this.tokens.length);
				this.tokens.push(token);
			}
			++i;
		}
		// argument counting pass
		for (let t = 0, prev, next, token, stack = []; t < this.tokens.length; t++) {
			prev  = this.tokens[t-1];
			token = this.tokens[t];
			next  = this.tokens[t+1];
			if (token.type == 'operator') {
				switch (token.value) {
					case OPEN:
						// start of expression closure or function call
						break;
					case CLOSE:
						// end of expression closure or function call
						if (stack.length) {
							// make sure this isn't a 0-argument function call
							// if it isn't, assume 1 more argument than commas counted
							if (token.index > stack[stack.length-1].index + 1) {
								stack[stack.length-1].args++;
							}
						}
						stack.pop();
						break;
					case ARG_SEPARATOR:
						if (stack.length) {
							stack[stack.length-1].args++;
						} else {
							// TODO: throw error if there's a floating comma?
							throw token.toString() + ' not allowed outside a function argument list';
						}
						break;
					default:
						let leftArg  = prev && (prev.type !== 'operator' || prev.value !== OPEN);
						let rightArg = next && (next.type !== 'operator' || next.value !== CLOSE);
						if (token.value == '-' && !leftArg && rightArg) {
							// unary subtract
							token.args = 1;
							break;
						}
						// operators count values on either side )+( assumes 2, (+) is 0 and invalid
						if (leftArg && rightArg) {
							token.args = 2;
						} else {
							throw token.toString() + ' requires left and right operands.';
						}
				}
			} else if (token.type == 'function') {
				// beginning of function call
				stack.push(token);
			}
		}
		//console.log('Tokens:', this.tokens);
		return this;
	}
	// translates tokens in infix notation to postfix notation
	postfix() {
		let output = [], stack = [];
		for (let token of this.tokens) {
			if (token.value == OPEN) {
				stack.push(token);
			} else if (token.value == CLOSE) {
				let top = stack.pop();
				while (top && top.value !== OPEN) {
					if (top.value == ARG_SEPARATOR) {
						// these can be ignored
					} else {
						output.push(top);
					}
					top = stack.pop();
				}
				if (!top) throw 'Missing ' + OPEN;
			} else if (token.type === 'operator' || token.type === 'function') {
				let top = stack[stack.length-1];
				while (top && top.value !== OPEN
					&& (top.precedence > token.precedence || (
						top.precedence == token.precedence
					&&  top.associativity == 0 // left
					))) {
					output.push(stack.pop());
					top = stack[stack.length-1];
				}
				stack.push(token);
			} else {
				output.push(token);
			}
		}
		while (stack.length) output.push(stack.pop());
		//console.log('Postfix:',output);
		//this.tokens = output;
		//return this;
		return output;
	}
}

module.exports = {Token,Tokenizer};
