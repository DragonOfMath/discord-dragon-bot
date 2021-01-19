const Interpreter = require('./Interpreter');

const S = ' ';
const T = '\t';
const L = '\n';
const R = '\r';
const BINARY = {[S]: 0, [T]: 1};

const OPCODES = {
	[S]: {
		// Stack Manipulation
		[S]: 'read',
		[L]: {
			[S]: 'dupe',
			[T]: 'swap',
			[L]: 'discard'
		}
	},
	[T]: {
		[S]: {
			// Arithmetic
			[S]: {
				[S]: 'add',
				[T]: 'sub',
				[L]: 'mult'
			},
			[T]: {
				[S]: 'div',
				[T]: 'mod'
			}
		},
		[T]: {
			// Heap Access
			[S]: 'store',
			[T]: 'retrieve'
		},
		[L]: {
			// I/O
			[S]: {
				[S]: 'outc',
				[T]: 'outn'
			},
			[T]: {
				[S]: 'inc',
				[T]: 'inn'
			}
		}
	},
	[L]: {
		// Flow Control
		[S]: {
			[S]: 'label',
			[T]: 'call',
			[L]: 'jmp'
		},
		[T]: {
			[S]: 'jmpz',
			[T]: 'jmpn',
			[L]: 'ret'
		},
		[L]: {
			[L]: 'exit'
		}
	}
};
const PARAMS = {
	read: 1,
	label: 1,
	call: 1,
	jmp: 1,
	jmpz: 1,
	jmpn: 1
};

function key(c) {
	if (c == S) {
		return '[Space]';
	} else if (c == T) {
		return '[Tab]';
	} else if (c == L) {
		return '[LF]';
	} else if (c == R) {
		return '[CR]';
	} else {
		return `[${c}]`;
	}
}

class Whitespace extends Interpreter {
	constructor(code, options = {}) {
		// normalize the text from STL's to spaces, tabs, and newlines, respectively
		if (options.normalize) {
			code = code.replace(/s/gi,S).replace(/t/gi,T).replace(/l|\r\n?/g,L);
		}
		super(code, options);
		this.preprocess();
	}
	// convert the code to a readable format
	toString() {
		return this.code.replace(/ /g,'S').replace(/\t/g,'T').replace(/\n/g,'L');
	}
	
	// go through the code and mark labels while validating syntax
	preprocess() {
		this.log('Validating syntax...');
		this.labels = {};
		this.c = 0;
		let hasExit = false;
		while (this.c < this.code.length) {
			let opcode = this.readOpcode();
			let params = this.readParams(PARAMS[opcode]);
			if (opcode == 'label') {
				// store label marker
				this[opcode](params);
			} else if (opcode == 'exit') {
				hasExit = true;
			}
			this.c++;
		}
		if (!hasExit) {
			throw new SyntaxError(`Missing exit opcode`);
		}
		return true;
	}
	init(input) {
		super.init(input);
		this._initStack();
		this.heap      = {}; // for store/retrieve
		this.callstack = []; // for subroutine calls
	}
	executeOpcode() {
		let opcode = this.readOpcode();
		let params = this.readParams(PARAMS[opcode]);
		this.log('Executing opcode:',opcode,params);
		this[opcode](params);
	}
	readOpcode() {
		let chars = [this.C];
		let method = OPCODES[this.C];
		while (typeof(method) == 'object') {
			this.c++;
			chars.push(this.C);
			method = method[this.C];
		}
		if (!method) {
			throw new SyntaxError(`Invalid opcode at ${this.c}: ${chars.map(key).join('')}`);
		} else {
			return method;
		}
	}
	readParams(paramCount = 0) {
		let params = [];
		for (let p = 0; p < paramCount; p++) {
			params.push(this.readNumber());
		}
		return params;
	}
	readNumber() {
		this.c++;
		let x = 0;
		while (this.C != L) {
			x = 2 * x + BINARY[this.C];
			this.c++;
		}
		return x;
	}
	
	debug() {
		let embed = super.debug();
		embed.fields.push({
			name: 'Heap',
			value: Object.map(this.heap, (v,k) => `${k}=${v}`).join(' ') || '[No data]'
		});
		embed.fields.push({
			name: 'Call Stack',
			value: ['(main)', ...this.callstack].join('->')
		});
		return embed;
	}
	
	/* Stack Manipulation (IMP: [Space]) */
	
	// [Space] = Read number and push to stack
	read(args) {
		this._push(args[0]);
	}
	// [LF][Space] = Duplicate top item of stack
	dupe() {
		this._dupe();
	}
	// [LF][Tab] = Swap two 2 items of stack
	swap() {
		this._swap();
	}
	// [LF][LF] = Discard top of stack
	discard() {
		this._pop();
	}
	
	/* Arithmetic (IMP: [Tab][Space]) */
	
	// [Space][Space] = Addition
	add() {
		this._add();
	}
	// [Space][Tab] = Subtraction
	sub() {
		this._sub();
	}
	// [Space][LF] = Multiplication
	mult() {
		this._mult();
	}
	// [Tab][Space] = Integer Division
	div() {
		this._idiv(true);
	}
	// [Tab][Tab] = Modulo
	mod() {
		this._mod(true);
	}
	
	/* Heap Access (IMP: [Tab][Tab]) */
	
	// [Space] = Store value to address
	store() {
		let value   = this._pop();
		let address = this._pop();
		this.heap[address] = value;
	}
	// [Tab] = Retrieve value at address
	retrieve() {
		let address = this._pop();
		this._push(this.heap[address]);
	}
	
	/* I/O (IMP: [Tab][LF]) */
	
	// [Space][Space] = Output (char)
	outc() {
		this._outputChar(this._pop());
	}
	// [Space][Tab] = Output (number)
	outn() {
		this._outputNumber(this._pop());
	}
	// [Tab][Space] = Input (char)
	inc() {
		let input = this._inputChar();
		if (input) {
			this._push(input);
		} else {
			this.done = true;
		}
	}
	// [Tab][Tab] = Input (number)
	inn() {
		let input = this._inputNumber();
		if (isNaN(input)) {
			this.done = true;
		} else {
			this._push(input);
		}
	}
	
	/* Flow Control (IMP: [LF]) */
	
	// [Space][Space] = Mark Location in program
	label(args) {
		let label = args[0];
		this.labels[label] = this.c;
	}
	// [Space][Tab] = Call Subroutine at a label
	call(args) {
		let label = args[0];
		if (label in this.labels) {
			this.callstack.push(this.c);
			this.c = this.labels[label];
		} else {
			throw new Error(`Label ${label} does not exist.`);
		}
	}
	// [Space][LF] = Unconditional Jump to label
	jmp(args) {
		let label = args[0];
		if (label in this.labels) {
			this.c = this.labels[label];
		} else {
			throw new Error(`Label ${label} does not exist.`);
		}
	}
	// [Tab][Space] = Jump to label if top of stack is zero
	jmpz(args) {
		let label = args[0];
		if (label in this.labels) {
			if (this.D == 0) {
				this.c = this.labels[label];
			}
		} else {
			throw new Error(`Label ${label} does not exist.`);
		}
	}
	// [Tab][Tab] = Jump to label if top of stack is negative
	jmpn() {
		let label = args[0];
		if (label in this.labels) {
			if (this.D < 0) {
				this.c = this.labels[label];
			}
		} else {
			throw new Error(`Label ${label} does not exist.`);
		}
	}
	// [Tab][LF] = End Subroutine and return back to caller (or end program)
	ret() {
		if (this.callstack.length) {
			this.c = this.callstack.pop();
		} else {
			this.end();
		}
	}
	// [LF][LF] = End Program
	exit() {
		this.done = true;
	}
}

module.exports = Whitespace;
