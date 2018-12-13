const {Jimp,Color,Math,Pointer2D} = require('../../Utils');
const Interpreter = require('./Interpreter');

// cycles for hues and shades
const HUES   = ['red','yellow','green','cyan','blue','magenta'];
const SHADES = ['light','normal','dark'];
const DIRS = Pointer2D.DIRS;

// colors, with the [*hue,*shade] pointers
const RED_LIGHT = 0xFFC0C0;
const RED_MID   = 0xFF0000;
const RED_DARK  = 0xC00000;
const YELLOW_LIGHT = 0xFFFFC0;
const YELLOW_MID   = 0xFFFF00;
const YELLOW_DARK  = 0xC0C000;
const GREEN_LIGHT = 0xC0FFC0;
const GREEN_MID   = 0x00FF00;
const GREEN_DARK  = 0x00C000;
const CYAN_LIGHT = 0xC0FFFF;
const CYAN_MID   = 0x00FFFF;
const CYAN_DARK  = 0x00C0C0;
const BLUE_LIGHT = 0xC0C0FF;
const BLUE_MID   = 0x0000FF;
const BLUE_DARK  = 0x0000C0;
const MAGENTA_LIGHT = 0xFFC0FF;
const MAGENTA_MID   = 0xFF00FF;
const MAGENTA_DARK  = 0xC000C0;
const BLACK_STOP = 0x000000;
const WHITE_PASS = 0xFFFFFF;
const COLOR_TABLE = {
	[RED_LIGHT]: [0,0],
	[RED_MID]:   [0,1],
	[RED_DARK]:  [0,2],
	[YELLOW_LIGHT]: [1,0],
	[YELLOW_MID]:   [1,1],
	[YELLOW_DARK]:  [1,2],
	[GREEN_LIGHT]: [2,0],
	[GREEN_MID]:   [2,1],
	[GREEN_DARK]:  [2,2],
	[CYAN_LIGHT]: [3,0],
	[CYAN_MID]:   [3,1],
	[CYAN_DARK]:  [3,2],
	[BLUE_LIGHT]: [4,0],
	[BLUE_MID]:   [4,1],
	[BLUE_DARK]:  [4,2],
	[MAGENTA_LIGHT]: [5,0],
	[MAGENTA_MID]:   [5,1],
	[MAGENTA_DARK]:  [5,2],
	[BLACK_STOP]: [-1,0],
	[WHITE_PASS]: [-1,1]
};

// opcodes (hue change by shade change)
const OPCODE_TABLE = [
	['nop','push','pop'],
	['add','sub','mult'],
	['div','mod','not'],
	['grt','ptr','swi'],
	['dup','roll','inn'],
	['inc','outn','outc']
];

function oob(x,y,w,h) {
	return x < 0 || x >= w || y < 0 || y >= h;
}

class Codel {
	constructor(x, y, color) {
		this.x = x;
		this.y = y;
		this.color = new Color(color);
	}
	toString() {
		return `(${this.x},${this.y},${this.color.hex})`;
	}
}

class Piet extends Interpreter {
	constructor(image, options = {}) {
		super(image, options);
		this.codelSize = options.codelSize || options.cs || 1;
		this.preprocess();
	}
	toString() {
		return this.code.toString();
	}
	
	get width() {
		return Math.floor(this.code.bitmap.width / this.codelSize);
	}
	get height() {
		return Math.floor(this.code.bitmap.height/ this.codelSize);
	}
	get C() {
		return this.getCodel(this.DP.x, this.DP.y);
	}
	get Cd() {
		return this.getCodel(this.DP.x + this.DP.dx, this.DP.y + this.DP.dy);
	}
	get registers() {
		let codel = this.C;
		let next  = this.Cd;
		return {
			DP: this.DP.toString(),
			CC: this.CC,
			a: this.attempts,
			C: codel ? codel.color.val : '?',
			Cd: next ? next.color.val : '?',
			d: this.d,
			D: this.D,
			i: this.i,
			I: this.I,
			T: this.T,
			l: this.l
		};
	}
	
	getCodel(x,y) {
		if (oob(x, y, this.width, this.height)) return null;
		let hex = this.code.getPixelColor(x * this.codelSize, y * this.codelSize);
		let color = Jimp.intToRGBA(hex);
		return new Codel(x, y, color);
	}
	
	preprocess() {
		this.code.scan(0, 0, this.width, this.height, (x,y,i) => {
			let codel = this.getCodel(x, y);
			let color = codel.color.val;
			if (!(color in COLOR_TABLE)) {
				this.warn(`Invalid codel: ${codel.toString()}`);
			}
		});
	}
	init(input) {
		super.init(input);
		this._initStack();
		this.DP = new Pointer2D(0, 0, DIRS.RIGHT);
		this.CC = DIRS.LEFT;
		this.attempts = 0;
		//this.opcodes = [];
		this.DP.record('start');
	}
	executeOpcode(thisCodel) {
		// validate the codel for movement
		this.log('Current:', thisCodel.toString());
		if (thisCodel.color.equals(BLACK_STOP)) {
			throw new Error('Interpreter is at a black color block somehow...');
		}
		
		// check if the interpreter is about to run into a wall or edge
		let nextCodel = this.Cd;
		if (!nextCodel || nextCodel.color.equals(BLACK_STOP)) {
			this.retry();
			this.log(`Retrying movement... (${this.attempts}/8)`);
			//this.DP.record('retry',this.attempts);
			return;
		} else {
			this.log('Next:',nextCodel.toString());
			this.attempts = 0;
		}
		
		// ensure that opcodes only execute when passing through actual colors
		if (thisCodel.color.equals(WHITE_PASS) || nextCodel.color.equals(WHITE_PASS)) {
			this.DP.forward();
			return;
		}
		
		// calculate an opcode based on the change in hue/shade
		let thisColor = thisCodel.color.val;
		let nextColor = nextCodel.color.val;
		let c1 = COLOR_TABLE[thisColor];
		let c2 = COLOR_TABLE[nextColor];
		let hueChange = (c2[0] - c1[0] + 6) % 6;
		let shdChange = (c2[1] - c1[1] + 3) % 3;
		let opcode = OPCODE_TABLE[hueChange][shdChange];

		// execute the opcode, if valid
		if (opcode && opcode in this) {
			//this.opcodes.push(opcode);
			this.log(`Executing opcode: [${hueChange},${shdChange}]->${opcode}`);
			let info = this[opcode]();
			if (opcode != 'ptr') {
				this.DP.forward();
			}
			this.DP.record(opcode,info);
		} else {
			throw new SyntaxError(`Unknown opcode: color=${thisColor} next=${nextColor} h=${hueChange} s=${shdChange}`);
		}
	}
	next() {
		if (this.attempts == 8) {
			this.done = true;
		} else if (this.C.color.equals(WHITE_PASS)) {
			this.traverseWhite();
		} else {
			this.traverseColorBlock();
		}
	}
	finish() {
		this.DP.record('end');
		let message = super.finish();
		if (this.options.trace && this.trace.length <= 100) {
			return this.drawTrace()
			.then(file => ({message, file, filename: 'piet_trace.png'}));
		} else {
			return message;
		}
	}
	debug() {
		let embed = super.debug();
		embed.fields.push({
			name: 'Opcodes',
			value: this.opcodes.slice(0, 100).join(',')
		});
		return embed;
	}
	
	drawTrace() {
		return Jimp.loadFont(Jimp.FONT_SANS_8_BLACK)
		.then(font => {
			let traceImg = this.code.clone();
			let traceCS  = this.codelSize;
			// traces must be sufficiently large enough to display the correct information
			// since the longest opcode name is 4 letters, it must be 8px * 4 = 32 pixels/codel to fit
			while (traceCS < 32) {
				traceImg = traceImg.scale(2, Jimp.RESIZE_NEAREST_NEIGHBOR);
				traceCS *= 2;
			}
			// for codel blocks that are visited multiple times,
			// the opcodes are printed in seperate lines to prevent overlap
			let visited = {};
			let w = this.width;
			let prev = this.DP.trace[0];
			for (let t of this.DP.trace) {
				if (t != prev) {
					// draw a line connecting two codels on the path
					let x0 = (prev.x + 0.5) * traceCS;
					let y0 = (prev.y + 0.5) * traceCS;
					let x1 = (t.x + 0.5) * traceCS;
					let y1 = (t.y + 0.5) * traceCS;
					traceImg.drawLine(x0, y0, x1, y1, BLACK_STOP);
				}
				if (t.i) {
					// keep track of how many times this codel is visited
					let id = t.x + t.y * w;
					visited[id] = visited[id] || 0;
					
					// print the info in the upper-left corner
					let opx = t.x * traceCS + 2;
					let opy = t.y * traceCS + 2 + 8 * visited[id]++;
					traceImg.print(font, opx, opy, t.i);
				}
				prev = t;
			}
			return traceImg.getBufferAsync(Jimp.MIME_PNG);
		});
	}
	retry(onWhite) {
		// attempt to traverse the color block in a different direction
		if (onWhite) {
			this.rotateDP();
			this.toggleCC();
			this.attempts++;
		} else if (this.attempts++ % 2) {
			this.rotateDP();
		} else {
			this.toggleCC();
		}
	}
	traverseWhite() {
		this.log('Traversing white...',this.DP.toString());
		this.attempts = 0;
		while (this.attempts < 4) {
			let codel = this.Cd;
			while (codel && codel.color.equals(WHITE_PASS)) {
				this.DP.forward();
				codel = this.Cd;
			}
			if (!codel || codel.color.equals(BLACK_STOP)) {
				this.retry(true);
			} else {
				this.DP.forward();
				return;
			}
		}
		if (this.attempts == 4) {
			this.done = true;
		}
	}
	traverseColorBlock() {
		let combinedDir = (this.DP.dir + this.CC) % 4;
		this.log('Traversing color block...',this.DP.toString());
		let blockCodels = this.getColorBlock(this.DP.x, this.DP.y);
		let edgeCodels  = this.searchInDirection(blockCodels, this.DP.dir);
		let destCodel   = this.searchInDirection(edgeCodels, combinedDir)[0];
		//this.log('Destination:',destCodel.toString())
		this.DP.goto(destCodel);
	}
	getColorBlock(x, y) {
		let w = this.width;
		let h = this.height;
		let visited = [];
		let codels  = [];
		let queue   = [];
		queue.push([x,y]);
		let sameColor = -1;
		do {
			// process the queue
			[x,y] = queue.pop();
			
			// skip positions that are out of bounds
			if (oob(x,y,w,h)) continue;
			
			// avoid visiting previous codels
			let id = x + y * w;
			if (visited.includes(id)) continue;
			visited.push(id);
			
			// get the codel and color
			let codel = this.getCodel(x, y);
			let color = codel.color.val;
			
			// check that the color is the same as the first codel
			if (sameColor === -1) sameColor = color;
			else if (color != sameColor) continue;
			
			// if so, cache this codel
			codels.push(codel);
			
			// queue the neighboring codels
			queue.push([x+1,y]);
			queue.push([x-1,y]);
			queue.push([x,y+1]);
			queue.push([x,y-1]);
		} while (queue.length);
		if (codels.length == 0) {
			throw new Error(`No codels found at (${x},${y})`);
		}
		return codels;
	}
	searchInDirection(codels, dir) {
		if (dir === undefined || isNaN(dir) || dir === '') {
			throw new Error('Direction is undefined');
		}
		let farthest = codels[0];
		codels.forEach(codel => {
			switch (dir) {
			case DIRS.UP:
				if (codel.y < farthest.y) {
					farthest = codel;
				}
				break;
			case DIRS.RIGHT:
				if (codel.x > farthest.x) {
					farthest = codel;
				}
				break;
			case DIRS.DOWN:
				if (codel.y > farthest.y) {
					farthest = codel;
				}
				break;
			case DIRS.LEFT:
				if (codel.x < farthest.x) {
					farthest = codel;
				}
				break;
			}
		});
		return codels.filter(codel => {
			switch (dir) {
			case DIRS.UP:
			case DIRS.DOWN:
				return codel.y == farthest.y;
				break;
			case DIRS.RIGHT:
			case DIRS.LEFT:
				return codel.x == farthest.x;
				break;
			}
		});
	}
	rotateDP(n = 1) {
		if (n > 0) {
			this.DP.clockwise(n);
		} else if (n < 0) {
			this.DP.anticlockwise(Math.abs(n));
		}
	}
	toggleCC() {
		this.CC = this.CC == DIRS.LEFT ? DIRS.RIGHT : DIRS.LEFT;
	}
	
	// no operation (when moving to a codel of the same color)
	nop() {
		
	}
	// push color block value to stack (value = number of codels)
	push() {
		let codels = this.getColorBlock(this.DP.x, this.DP.y);
		let n = codels.length;
		this._push(n);
		return n;
	}
	// pop and discard the top value of the stack
	pop() {
		return this._pop();
	}
	// pop 2 and push their sum (first + second)
	add() {
		this._add();
	}
	// pop 2 and push their difference (second - first)
	sub() {
		this._sub();
	}
	// pop 2 and push their product (first * second)
	mult() {
		this._mult();
	}
	// pop 2 and push their integer quotient (second / first)
	// if divide-by-zero occurs, ignore operation
	div() {
		this._idiv(true);
	}
	// pop 2 and push the remainder of second divided by first (second % first)
	// result has same sign as first value
	// if divide-by-zero occurs, ignore operation
	mod() {
		if (this.D == 0) return;
		let a = this._pop();
		let b = this._pop();
		this._push(Math.modulo(b, a));
	}
	// pop 1 and push 1 if zero, 0 if otherwise
	not() {
		this._not();
	}
	// pop 2 and push 1 if second > first, 0 if otherwise
	grt() {
		this._gt();
	}
	// pop 1 and rotate the DP clockwise that many steps (or anticlockwise if negative)
	ptr() {
		// only rotate after moving forward
		let n = this._pop();
		this.DP.forward();
		this.rotateDP(n % 4);
		return n;
	}
	// pop 1 and toggle the CC by that many times (absolute value if negative)
	swi() {
		let n = this._pop();
		if (Math.abs(n) % 2) {
			this.toggleCC();
		}
		return n;
	}
	// duplicate the top value of the stack
	dup() {
		this._dupe();
	}
	/*
		Pops the top two values off the stack and "rolls" the remaining stack entries
		to a depth equal to the second value popped, by a number of rolls equal to the
		first value popped. A single roll to depth n is defined as burying the top value
		on the stack n deep and bringing all values above it up by 1 place. A negative
		number of rolls rolls in the opposite direction. A negative depth is an error
		and the command is ignored. If a roll is greater than an implementation-dependent
		maximum stack depth, it is handled as an implementation-dependent error, though
		simply ignoring the command is recommended.
	*/
	roll() {
		// depth must be sufficient for the roll
		if (this._length < 2) return;
		
		let rolls = this._pop();
		let depth = this._pop();
		
		// depth must be positive and no bigger than the length of the stack
		if (depth <= 0 || depth > this._length) {
			this._push(depth);
			this._push(rolls);
			return;
		}
		
		// get the last n entries of the stack
		let slice = [];
		while (slice.length < depth) slice.push(this.data.pop());
		
		// roll the slice by way of pushes/pops and shifts/unshifts
		if (rolls > 0) while (rolls--) {
			slice.push(slice.shift());
		} else if (rolls < 0) while (rolls++) {
			slice.unshift(slice.pop());
		}
		
		// put the slice back into the stack
		while (slice.length) this.data.push(slice.pop());
		
		return `${depth} ${rolls}`;
	}
	// input a number
	inn() {
		let input = this._inputNumber();
		if (isNaN(input)) {
			this.done = true;
			return 'EOF';
		} else {
			this._push(input);
			return input;
		}
	}
	// input an ASCII character
	inc() {
		let input = this._inputChar();
		if (input) {
			this._push(input);
			return input;
		} else {
			this.done = true;
			return 'EOF';
		}
	}
	// output a number
	outn() {
		let n = this._pop();
		this._outputNumber(n);
		return n;
	}
	// output an ASCII code
	outc() {
		let n = this._pop();
		this._outputChar(n);
		return n;
	}
}

module.exports = Piet;
