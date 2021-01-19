const {Markdown:md,Object} = require('../../Utils');
const LoggerMixin = require('../../Debugging/LoggerMixin');

class Interpreter extends LoggerMixin(Object) {
	constructor(code, options = {}) {
		super();
		this.code = code;
		if (options.executionTimeLimit === undefined) {
			options.executionTimeLimit = 1000;
		}
		if (options.maxOutputLength === undefined) {
			options.maxOutputLength = 500;
		}
		if (options.maxCycles === undefined) {
			options.maxCycles = 10000;
		}
		if (options.debug === undefined) {
			options.debug = 2;
		}
		this._level  = options.debug;
		this.options = options;
	}
	toString() {
		return this.code;
	}
	
	/* Interpreter Registers */
	
	// opcode
	get C() {
		return this.code[this.c];
	}
	set C(c) {
		this.code[this.c] = c;
	}
	
	// data cell
	get D() {
		return this.data[this.d];
	}
	set D(x) {
		this.data[this.d] = x || 0;
	}
	// data pointer out of bounds
	get OOB() {
		return +(this.d < 0 || this.d >= this.data.length);
	}
	
	// input char (ASCII value)
	get I() {
		return this.stdin[this.i];
	}
	// output size
	get O() {
		return this.stdout.length;
	}
	
	// end of file/input
	get EOF() {
		return +(this.i == this.stdin.length);
	}
	
	// execution time
	get T() {
		return Date.now() - this.t;
	}
	
	get registers() {
		return {
			c: this.c,
			C: this.C,
			d: this.d,
			D: this.D,
			OOB: this.OOB,
			i: this.i,
			I: this.I,
			EOF: this.EOF,
			O: this.O,
			T: this.T,
			l: this.l
		};
	}
	
	init(input) {
		this.log('Initializing with input:', input);
		this.stdin  = input ? String(input) : '';
		this.stdout = '';
		this.stderr = null;
		this.c = 0; // code pointer
		this.d = 0; // data pointer
		this.i = 0; // input pointer
		this.l = 0; // cycles
		this.t = Date.now(); // time
		this.done = false;
	}
	run(input) {
		this.init(input);
		try {
			this.log('Running...');
			while (!this.done) {
				this.executeOpcode(this.C);
				this.next();
				this.l++;
				// execution must not be endless
				if (this.l >= this.options.maxCycles) {
					throw new Error('Execution took too many cycles');
				}
				// execution must not take longer than a second
				if (this.T >= this.options.executionTimeLimit) {
					throw new Error('Execution took too long');
				}
				// execution must not produce long output
				if (this.O >= this.options.maxOutputLength) {
					throw new Error('Output became too long');
				}
			}
			this.stdout += `\n\n[:white_check_mark: Program completed successfully in ${this.l} cycles]`
		} catch (e) {
			this.stderr = e;
		} finally {
			return this.finish();
		}
	}
	executeOpcode(op) {
		throw new Error('You need to override the executeOpcode method!');
	}
	next() {
		if (++this.c >= this.code.length) {
			this.done = true;
		}
	}
	finish() {
		this.log(`Finished in ${this.l} cycles [${this.T}ms].`);
		if (this.stderr) {
			this.error(this.stderr);
			this.stdout += `\n\n[:warning: ${this.stderr.message||this.stderr}]`;
		}
		if (this.options.debug) {
			return {
				message: this.stdout,
				embed: this.debug()
			};
		} else {
			return this.stdout;
		}
	}
	debug() {
		let regs  = this.registers;
		let slice = this.data.slice(0,100);
		this.log('Registers: ', regs);
		this.log('Code:  ', this.toString());
		this.log('Data:  ', slice.join(','));
		this.log('Input: ', this.stdin);
		this.log('Output:', this.stdout);
		return {
			title: this.constructor.name + '| Debugger',
			fields: [
				{
					name: 'Registers',
					value: Object.map(regs, (v,k) => `${k}=${v}`).join(' ')
				},
				{
					name: 'Options',
					value: Object.map(this.options, (v,k) => `${k}=${v}`).join(' ') || '[No options]'
				},
				{
					name: 'Data',
					value: slice.join(',') || '[No data]'
				}
			]
		};
	}
	
	/* I/O helper methods */
	
	_inputChar() {
		if (this.EOF) {
			return 0;
		} else {
			let n = this.stdin.charCodeAt(this.i++);
			this.log('Inputting ASCII:',n);
			return n;
		}
	}
	_inputNumber() {
		if (this.EOF) {
			return NaN;
		} else {
			let n = '';
			do {
				n += this.I;
				this.i++;
			} while (this.I && !/\s/.test(this.I));
			this.log('Inputting number:',n);
			return Number(n);
		}
	}
	_outputChar(x) {
		this.log('Outputting ASCII:',x);
		this.stdout += (typeof(x) === 'number' ? String.fromCharCode(x) : x);
	}
	_outputNumber(x) {
		this.log('Outputting:',x);
		this.stdout += String(x) + ' ';
	}
	
	/* Stack helper methods */
	
	get _length() {
		return this.data.length;
	}
	_initStack() {
		this.data = [];
		this.d    = -1;
	}
	_push(x) {
		this.d++;
		this.data.push(x);
	}
	_pop() {
		if (this.d > -1) this.d--;
		return this.data.pop() || 0;
	}
	_dupe() {
		this._push(this.D);
	}
	_swap() {
		let a = this._pop();
		let b = this._pop();
		this._push(a);
		this._push(b);
	}
	_add() {
		let a = this._pop();
		let b = this._pop();
		this._push(a + b);
	}
	_sub() {
		let a = this._pop();
		let b = this._pop();
		this._push(b - a);
	}
	_mult() {
		let a = this._pop();
		let b = this._pop();
		this._push(a * b);
	}
	_div(ignoreDivideByZero = false) {
		if (this.D == 0) {
			if (ignoreDivideByZero) {
				return;
			} else {
				throw new Error('Division by zero!');
			}
		}
		let a = this._pop();
		let b = this._pop();
		this._push(b / a);
	}
	_idiv(ignoreDivideByZero = false) {
		if (this.D == 0) {
			if (ignoreDivideByZero) {
				return;
			} else {
				throw new Error('Division by zero!');
			}
		}
		let a = this._pop();
		let b = this._pop();
		this._push(Math.trunc(b / a));
	}
	_mod(ignoreDivideByZero = false) {
		if (this.D == 0) {
			if (ignoreDivideByZero) {
				return;
			} else {
				throw new Error('Division by zero!');
			}
		}
		let a = this._pop();
		let b = this._pop();
		this._push(b % a);
	}
	_not() {
		let a = this._pop();
		this._push(a ? 0 : 1);
	}
	_gt() {
		let a = this._pop();
		let b = this._pop();
		this._push(b > a ? 1 : 0);
	}
	_lt() {
		let a = this._pop();
		let b = this._pop();
		this._push(b < a ? 1 : 0);
	}
	_eq() {
		let a = this._pop();
		let b = this._pop();
		this._push(a == b ? 1 : 0);
	}
	_neq() {
		let a = this._pop();
		let b = this._pop();
		this._push(a != b ? 1 : 0);
	}
	_cmp() {
		let b = this._pop();
		let a = this._pop();
		if (a > b) {
			return 1;
		} else if (a < b) {
			return -1;
		} else {
			return 0;
		}
	}
}

module.exports = Interpreter;
