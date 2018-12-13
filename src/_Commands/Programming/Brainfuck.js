const Interpreter = require('./Interpreter');

const OPCODES = '><+-.,[]';

class Brainfuck extends Interpreter {
	constructor(code, options = {}) {
		if (options.normalize) {
			code = code.replace(/\s+/g, ''); // remove all whitespace
		}
		if (options.strict === undefined) {
			options.strict = true;
		}
		super(code, options);
		this.preprocess();
	}
	
	// validate the syntax and cache bracket pointers
	preprocess() {
		let s  = []; // pointer stack
		this.s = {}; // pointer cache
		this.c = 0;  // code pointer
		
		this.log('Validating syntax...');
		while (this.c < this.code.length) {
			if (OPCODES.includes(this.C)) {
				if (this.C == '[') {
					s.push(this.c);
				} else if (this.C == ']') {
					let p = s.pop();
					if (p === undefined) {
						throw new SyntaxError(`Unexpected ${this.C} at ${this.c}.`);
					}
					this.s[this.c] = p;
					this.s[p] = this.c;
				}
			} else if (this.options.strict) {
				throw new SyntaxError(`${this.C} at ${this.c} is not a valid opcode.`);
			}
			this.c++;
		}
		if (s.length) {
			throw new SyntaxError(`Missing ] for bracket(s) at ${s.join(', ')}`);
		}
		// valid syntax!
		return true;
	}
	
	// override
	init(input) {
		super.init(input);
		this.data = [0];
	}
	
	// override
	executeOpcode(opcode) {
		if (OPCODES.includes(opcode)) {
			this.log('Executing opcode:',opcode);
			this[opcode]();
		} else if (this.options.strict) {
			throw new SyntaxError(`${opcode} at ${this.c} is not a valid opcode.`);
		}
	}
	
	/* opcode methods */
	
	// move data pointer to the right (increment pointer)
	['>']() {
		this.d++;
		if (this.d == this.data.length) {
			this.data.push(0);
		}
	}
	// move data pointer to the left (decrement pointer)
	['<']() {
		this.d--;
		if (this.OOB) {
			throw new Error('Data pointer out of bounds');
		}
	}
	// increment data cell at data pointer
	['+']() {
		this.D++;
	}
	// decrement data cell at data pointer
	['-']() {
		this.D--;
	}
	// output character with the ASCII value of the current data cell
	['.']() {
		this._outputChar(this.D);
	}
	// input character's ASCII value to the current data cell
	[',']() {
		let input = this._inputChar();
		if (input) {
			this.D = input;
		} else {
			this.done = true;
		}
	}
	// loop start - break to matching loop end if zero
	['[']() {
		if (!this.D) {
			this.c = this.s[this.c];
		}
	}
	// loop end - point back to matching loop start if nonzero
	[']']() {
		if (this.D) {
			this.c = this.s[this.c];
		}
	}
}

module.exports = Brainfuck;
