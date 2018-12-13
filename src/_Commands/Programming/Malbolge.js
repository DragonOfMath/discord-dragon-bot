const Interpreter = require('./Interpreter');

const OPCODES = [4,5,23,39,40,62,68,81];
const ENCRYPTION = '9m<.TVac`uY*MK\'X~xDl}REokN:#?G"i@5z]&gqtyfr$(we4{WP)H-Zn,[%\\3dL+Q;>U!pJS72FhOA1CB6v^=I_0/8|jsb';
const CRZ_TABLE = [
	[1,0,0],
	[1,0,2],
	[2,2,1]
];

function ternary(x) {
	return Number(x).toString(3);
}
function decimal(x) {
	return parseInt(x, 3);
}
function crz(a, b) {
	a = ternary(a);
	b = ternary(b);
	let c = '';
	for (let t = 0; t < a.length; t++) {
		c += String(CRZ_TABLE[a[t]][b[t]]);
	}
	return decimal(c);
}
function rotr(t) {
	t = ternary(t);
	t = t[t.length-1] + t.substring(t.length - 1);
	return decimal(t);
}

class Malbolge extends Interpreter {
	constructor(code, options = {}) {
		super(code, options);
		this.preprocess();
	}
	
	get C() {
		return this.data[this.c];
	}
	set C(x) {
		this.data[this.c] = x;
	}
	
	get registers() {
		return Object.assign({a: this.a}, super.regs);
	}
	
	preprocess() {
		this.log('Loading program into memory...');
		this.data = Array(59049).fill(0);
		let _C, opcode;
		// fill the first part of the memory with the program, ignoring whitespace, but validating the opcode
		for (this.c = 0, this.d = 0; this.c < this.code.length; this.c++) {
			_C = this.code[this.c];
			opcode = _C.charCodeAt(0);
			opcode = (opcode + this.c) % 94;
			if (!OPCODES.includes(opcode)) {
				throw new SyntaxError(`Invalid opcode ${_C}->${opcode} at ${this.c}`);
			}
			this.data[this.d++] = opcode;
		}
		// fill the rest of the memory with results from crz([d-2], [d-1])
		this.log('Filling rest of memory with crz...');
		while (this.d < this.data.length) {
			this.D = crz(this.data[this.d-2], this.data[this.d-1]);
			this.d++;
		}
	}
	
	init(input) {
		super.init(input);
		this.a = 0; // accumulator
	}
	
	executeOpcode(opcode) {
		// opcode = ([c] + c) % 94
		opcode = (opcode + this.c) % 94;
		if (!OPCODES.includes(opcode)) {
			opcode = 68;
		}
		this.log('Executing opcode:',opcode);
		this[opcode]();
	}
	next() {
		// Encrypt the guilty instruction so it may not be used again, unless it was a jump.
		// If so, encrypt the instruction just before the one jumped to.
		this.C = ENCRYPTION[this.C % 94];
		
		// Increment the code and data pointers, wrapping back to zero if at the end
		this.c++;
		if (this.c == this.data.length) {
			this.c = 0;
		}
		this.d++;
		if (this.d == this.data.length) {
			this.d = 0;
		}
	}
	
	// jump to [d] (but go back one to encrypt it prior to the one it jumped)
	['4']() {
		this.c = this.D - 1;
	}
	// output a as an ASCII character
	['5']() {
		this._outputChar(this.a);
	}
	// input an ASCII code
	['23']() {
		let input = this._inputChar();
		if ('\n\r'.includes(input)) {
			this.a = 10;
		} else if (input) {
			this.a = input;
		} else {
			this.a = 59048;
		}
	}
	// rotate [d] and store in [d] and a
	['39']() {
		this.a = this.D = rotr(this.D);
	}
	// copy [d] to d
	['40']() {
		this.d = this.D;
	}
	// crazy operation between [d] and a
	['62']() {
		this.a = this.D = crz(this.D, this.a);
	}
	// no operation
	['68']() {
		
	}
	// end the program
	['81']() {
		this.done = true;
	}
}

module.exports = Malbolge;
