const Interpreter = require('./Interpreter');
const {Pointer2D} = require('../../Utils');

const OPCODES93 = '+-*/%!`><^v?_|\":\\$.,#pg&~@';
const OPCODES98 = 'abcdefijknoqrstuwxyz[](){};\'=';

class Befunge extends Interpreter {
	constructor(code, options = {}) {
		if (options.normalize) {
			// replace tabs with 4 spaces and split by newlines/linefeeds
			code = code.replace(/\t/g,'    ').split(/[\n\r]+/);
		}
		if (options.version === undefined) {
			options.version = '93';
		}
		super(code, options);
	}
	get height() {
		return this.code.length;
	}
	get width() {
		return this.code[this.ptr.y].length;
	}
	// opcode
	get C() {
		return this.code[this.ptr.y][this.ptr.x];
	}
	set C(x) {
		this.code[this.ptr.y][this.ptr.x] = typeof(x) === 'number' ? String.fromCharCode(x) : x;
	}
	// next opcode
	get Cd() {
		return this.code[this.ptr.y+this.ptr.dy][this.ptr.x+this.ptr.dx];
	}
	set Cd(x) {
		this.code[this.ptr.y+this.ptr.dy][this.ptr.x+this.ptr.dx] = typeof(x) === 'number' ? String.fromCharCode(x) : x;
	}
	get registers() {
		return {
			x: this.ptr.x,
			y: this.ptr.y,
			dir: this.ptr.dir,
			C: this.C,
			d: this.d,
			D: this.D,
			i: this.i,
			I: this.I,
			EOF: this.EOF,
			T: this.T,
			l: this.l
		};
	}
	
	init(input) {
		super.init(input);
		this._initStack();
		this.q   = false; // string mode
		this.ptr = new Pointer2D(0,0,1,0);
	}
	executeOpcode(opcode) {
		if (this.q && opcode != '"') {
			this.log('Pushing string character:',opcode);
			this._push(opcode.charCodeAt(0));
		} else if (/\s/.test(opcode)) {
			// skip whitespace
		} else if (!isNaN(opcode)) {
			this.log('Pushing number:',opcode);
			this._push(Number(opcode));
		} else if (OPCODES93.includes(opcode)) {
			this.log('Execution opcode:',opcode);
			return this[opcode]();
		} else if (OPCODES98.includes(opcode)) {
			if (this.options.version == '98') {
				this.log('Executing Funge-98 opcode:',opcode);
				return this[opcode]();
			} else {
				throw new SyntaxError(`Funge-98 opcode at ${this.c}: ${opcode} (interpreter is using Befunge-${this.version})`);
			}
		}
	}
	next() {
		this.ptr.forward();
		this.checkOOB();
	}
	prev() {
		this.ptr.reverse();
		this.checkOOB();
	}
	checkOOB() {
		if (this.ptr.OOB(this.width, this.height)) {
			// code pointer moved out of bounds
			this.done = true;
			return true;
		} else {
			return false;
		}
	}
	
	/* opcodes (Befunge-93) */
	
	// addition
	['+']() {
		this._add();
	}
	// subtraction
	['-']() {
		this._sub();
	}
	// multiplication
	['*']() {
		this._mult();
	}
	// integer division
	['/']() {
		this._idiv(true);
	}
	// modulo
	['%']() {
		this._mod(true);
	}
	// logical NOT
	['!']() {
		this._not();
	}
	// greater than
	['`']() {
		this._gt();
	}
	// move right
	['>']() {
		this.ptr.right();
	}
	// move left
	['<']() {
		this.ptr.left();
	}
	// move down
	['v']() {
		this.ptr.down();
	}
	// move up
	['^']() {
		this.ptr.up();
	}
	// move random
	['?']() {
		this.ptr.random();
	}
	// conditional move horizontal
	['_']() {
		if (this._pop()) {
			this.ptr.left();
		} else {
			this.ptr.right();
		}
	}
	// conditional move vertical
	['|']() {
		if (this._pop()) {
			this.ptr.up();
		} else {
			this.ptr.down();
		}
	}
	// start/end string mode
	['"']() {
		this.q = !this.q;
	}
	// duplicate top of stack
	[':']() {
		this._dupe();
	}
	// swap top two stack values
	['\\']() {
		this._swap();
	}
	// discard top of stack
	['$']() {
		this._pop();
	}
	// pop and output as integer and add a space
	['.']() {
		this._outputNumber(this._pop());
	}
	// pop and output as an ASCII character
	[',']() {
		this._outputChar(this._pop());
	}
	// bridge: skip next opcode
	['#']() {
		this.next();
	}
	// change code at (x,y) to ASCII v
	['p']() {
		let y = this._pop();
		let x = this._pop();
		let v = this._pop();
		this.code[y][x] = String.fromCharCode(v);
	}
	// get ASCII value of character at (x,y) of code
	['g']() {
		let y = this._pop();
		let x = this._pop();
		let v = this.code[y][x].charCodAt(0);
		this._push(v);
	}
	// push number from input stream
	['&']() {
		let input = this._inputNumber();
		if (isNaN(input)) {
			this.done = true;
		} else {
			this._push(input);
		}
	}
	// push ASCII value of character from input stream
	['~']() {
		let input = this._inputChar();
		if (input) {
			this._push(input);
		} else {
			this.done = true;
		}
	}
	// end of program
	['@']() {
		this.done = true;
	}
	
	/* opcodes (not in Befunge-93) */
	
	// a-f = hexadecimal values
	['a']() {
		this._push(10);
	}
	['b']() {
		this._push(11);
	}
	['c']() {
		this._push(12);
	}
	['d']() {
		this._push(13);
	}
	['e']() {
		this._push(14);
	}
	['f']() {
		this._push(15);
	}
	// go high
	['h']() {
		throw new SyntaxError('3D opcodes not supported!');
	}
	// input file
	['i']() {
		throw new SyntaxError('File opcodes not supported!');
	}
	// jump - when positive, jumps forward, when negative, jumps backward
	['j']() {
		this.ptr.jump(this._pop());
	}
	// iterate next opcode n times
	['k']() {
		this.next();
		while (this.C == ' ' || this.C == ';') {
			this.next();
		}
		let opcode = this.C;
		if (opcode) {
			let iterations = this._pop();
			while (iterations-- > 0) this.executeOpcode(opcode);
		} else {
			this.done = true;
		}
	}
	// go low
	['l']() {
		throw new SyntaxError('3D opcodes not supported!');
	}
	// conditional 
	['m']() {
		throw new SyntaxError('3D opcodes not supported!');
		if (this._pop()) {
			this['h']();
		} else {
			this['l']();
		}
	}
	// clear stack
	['n']() {
		while (this.d > -1) this._pop();
	}
	// output file
	['o']() {
		throw new SyntaxError('File opcodes not supported!');
	}
	// quit program - also pops value from stack as return value
	['q']() {
		this.done = true;
		return this._pop();
	}
	// reverse/reflect
	['r']() {
		this.ptr.reflect();
	}
	// store character
	['s']() {
		this.Cd = this._pop()
	}
	// concurrent execution
	['t']() {
		throw new SyntaxError('Execution opcodes not supported!');
	}
	// stack under stack
	['u']() {
		throw new SyntaxError('TOSS/SOSS opcodes not supported!');
	}
	// compare
	['w']() {
		let cmp = this._cmp();
		switch (this._cmp()) {
		case 1:
			return this[']']();
		case -1:
			return this['[']();
		}
	}
	// "absolute vector" - pops a dy,dx from the stack and sets the delta to (dx,dy)
	['x']() {
		let dy = this._pop();
		let dx = this._pop();
		this.ptr.dx = Math.sign(dx);
		this.ptr.dy = Math.sign(dy);
	}
	// get system information
	['y']() {
		throw new SyntaxError('System opcodes not supported!');
	}
	// no operation
	['z']() {
		
	}
	// turn left
	['[']() {
		this.ptr.anticlockwise();
	}
	// turn right
	[']']() {
		this.ptr.clockwise();
	}
	// load semantics
	['(']() {
		throw new SyntaxError('Semantics opcodes not supported!');
	}
	// unload semantics
	[')']() {
		throw new SyntaxError('Semantics opcodes not supported!');
	}
	// begin block
	['{']() {
		throw new SyntaxError('TOSS/SOSS opcodes not supported!');
	}
	// end block
	['}']() {
		throw new SyntaxError('TOSS/SOSS opcodes not supported!');
	}
	// jump over to the next ;
	[';']() {
		this.next();
		while (this.C != ';') {
			if (this.checkOOB()) {
				throw new Error('Cannot find destination ;');
			}
			this.next();
		}
	}
	// fetch character
	["'"]() {
		this.push(this.Cd.charCodeAt(0));
	}
	// execute
	['=']() {
		throw new SyntaxError('Execution opcodes not supported!');
	}
}

module.exports = Befunge;
