/*
	https://en.wikipedia.org/wiki/Box-drawing_character

	╔═════════════════╤═══════════════════════════════════════╤═════════════════╗
	║				  │  Unicode Box-Drawing Character Table  │ 				║░
	╟─────────────────┴───────────────────────────────────────┴─────────────────╢░
	║			0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F	║░
	║	U+250x  ─ 	━ 	│ 	┃ 	┄ 	┅ 	┆ 	┇ 	┈ 	┉ 	┊ 	┋ 	┌ 	┍ 	┎ 	┏	║░
	║	U+251x 	┐ 	┑ 	┒ 	┓ 	└ 	┕ 	┖ 	┗ 	┘ 	┙ 	┚ 	┛ 	├ 	┝ 	┞ 	┟	║░
	║	U+252x 	┠ 	┡ 	┢ 	┣ 	┤ 	┥ 	┦ 	┧ 	┨ 	┩ 	┪ 	┫ 	┬ 	┭ 	┮ 	┯	║░
	║	U+253x 	┰ 	┱ 	┲ 	┳ 	┴ 	┵ 	┶ 	┷ 	┸ 	┹ 	┺ 	┻ 	┼ 	┽ 	┾ 	┿	║░
	║	U+254x 	╀ 	╁ 	╂ 	╃ 	╄ 	╅ 	╆ 	╇ 	╈ 	╉ 	╊ 	╋ 	╌ 	╍ 	╎ 	╏	║░
	║	U+255x 	═ 	║ 	╒ 	╓ 	╔ 	╕ 	╖ 	╗ 	╘ 	╙ 	╚ 	╛ 	╜ 	╝ 	╞ 	╟	║░
	║	U+256x 	╠ 	╡ 	╢ 	╣ 	╤ 	╥ 	╦ 	╧ 	╨ 	╩ 	╪ 	╫ 	╬ 	╭ 	╮ 	╯	║░
	║	U+257x 	╰ 	╱ 	╲ 	╳ 	╴ 	╵ 	╶ 	╷ 	╸ 	╹ 	╺ 	╻ 	╼ 	╽ 	╾ 	╿   ║░
	╟─────────────────┬───────────────────────────────────────┬─────────────────╢░
	║				  │ Unicode Block Element Character Table │					║░
	╟─────────────────┴───────────────────────────────────────┴─────────────────╢░
	║			0 	1 	2 	3 	4 	5 	6 	7 	8 	9 	A 	B 	C 	D 	E 	F	║░
	║	U+258x 	▀ 	▁ 	▂ 	▃ 	▄ 	▅ 	▆ 	▇ 	█ 	▉ 	▊ 	▋ 	▌ 	▍ 	▎ 	▏	║░
	║	U+259x 	▐ 	░ 	▒ 	▓ 	▔ 	▕ 	▖ 	▗ 	▘ 	▙ 	▚ 	▛ 	▜ 	▝ 	▞ 	▟	║░
	╚═══════════════════════════════════════════════════════════════════════════╝░
	  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

	Stroke:
	 * Single: ┼
	 * Double: ╬
	 * Hybrid: ╪, ╫
	
	Weight:
	 * Light: ┼
	 * Heavy: ╋
	 * Mixed: ╂
	
	Line Style (horizontal and vertical lines only):
	 * Solid: ─
	 * Dashed: ╌, ┄, ┈ (with heavy variants)
	
	Corner Style:
	 * Rect: ┌
	 * Round: ╭
*/

/*
	Each block has four directions as follows:
	
		0
	  3 ┼ 1
		2
*/
const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;
const DIRS = {UP,RIGHT,DOWN,LEFT};

/*
	Each line stroke can be single, double, heavy, light-dashed, or heavy-dashed.
	This is mapped into a 4-bit value as follows:
	
	╔═══════╦═══════╦═══╤═══╗
	║		║ Dash  ║ D │ S ║░
	╟───────╫───┬───╫───┼───╢░
	║	Bit ║ 3 │ 2 ║ 1 │ 0 ║░
	╟───────╫───┼───╫───┼───╢░
	║	Val ║ 0 │ 0 ║ 1 │ 0 ║░ = Heavy, solid line.
	╚═══════╩═══╧═══╩═══╧═══╝░
	  ░░░░░░░░░░░░░░░░░░░░░░░░

	Stroke type when these bits are set:
	 * 0 = Single
	 * 1 = Double
	 * 0 & 1 = Heavy
	 * ^2 = Dashed x2 
	 * ^3 = Dashed x3
	 * ^2 & 3 = Dashed x4
	 
	 (^for horizontal/vertical line blocks only)
	 Dashed double lines does not exist.
*/

// Stroke type/weight
const NONE   = 0b0000;
const SINGLE = 0b0001;
const DOUBLE = 0b0010;
const HEAVY  = 0b0011;
const DASH2  = 0b0100;
const DASH3  = 0b1000;
const DASH4  = 0b1100;
const STROKE = {NONE,SINGLE,DOUBLE,HEAVY,DASH2,DASH3,DASH4};

// Corner type
const RECT = 0;
const ROUND = 1;
const CORNER = {RECT,ROUND};

const SHAPE = {
	ENDS: [0b0001,0b0010,0b0100,0b1000],
	TURNS: [0b0011,0b0110,0b1001,0b1100],
	PIPES: [0b0101,0b1010],
	JUNCTIONS: [0b0111,0b1011,0b1101,0b1110]
};

function resolveCorner(corner) {
	if (typeof(corner) === 'number') {
		return corner ? ROUND : RECT;
	} else if (typeof(corner) === 'string') {
		return (corner.toLowerCase() == 'round') ? ROUND : RECT;
	} else {
		return RECT;
	}
}
function resolveStyle(style) {
	if (typeof(style) === 'number') {
		return style & 0b1111;
	} else if (typeof(style) === 'string') {
		let [stroke,dash] = style.split(' ');
		style = NONE;
		switch (stroke.toLowerCase()) {
			case 'single':
			case 'light':
				style |= SINGLE;
				break;
			case 'double':
				style |= DOUBLE;
				break;
			case 'heavy':
				style |= HEAVY;
				break;
		}
		if (style && dash) {
			switch (dash.toLowerCase()) {
				case 'dash2':
					style |= DASH2;
					break;
				case 'dash3':
					style |= DASH3;
					break;
				case 'dash4':
					style |= DASH4;
					break;
			}
		}
		return style;
	} else {
		return NONE;
	}
}

function shape(style) {
	let value = 0b0000;
	for (let d in DIRS) {
		if (style[DIRS[d]]) {
			value |= 1 << DIRS[d];
		}
	}
	return value;
}
function ID(style, round) {
	let mask = 0x0000;
	for (let b = 0; b < style.length; b++) {
		mask |= style[b] << (b * 4);
	}
	if (round) {
		// only right-angle shapes can have round corners
		if (SHAPE.TURNS.includes(shape(style))) {
			mask |= 0x10000;
		}
	}
	return mask;
}
const BOX = {
	// UP (0b0001)
	[ID([SINGLE,NONE,NONE,NONE])]: '╵',
	[ID([HEAVY,NONE,NONE,NONE])]:  '╹',
	
	// RIGHT (0b0010)
	[ID([NONE,SINGLE,NONE,NONE])]: '╶',
	[ID([NONE,HEAVY,NONE,NONE])]:  '╺',
	
	// UP + RIGHT (0b0011)
	[ID([SINGLE,SINGLE,NONE,NONE],RECT)]:  '└',
	[ID([SINGLE,SINGLE,NONE,NONE],ROUND)]: '╰',
	[ID([HEAVY,SINGLE,NONE,NONE],RECT)]:   '┖',
	[ID([SINGLE,HEAVY,NONE,NONE],RECT)]:   '┕',
	[ID([HEAVY,HEAVY,NONE,NONE],RECT)]:    '┗',
	[ID([SINGLE,DOUBLE,NONE,NONE],RECT)]:  '╘',
	[ID([DOUBLE,SINGLE,NONE,NONE],RECT)]:  '╙',
	[ID([DOUBLE,DOUBLE,NONE,NONE],RECT)]:  '╚',
	
	// DOWN (0b0100)
	[ID([NONE,NONE,SINGLE,NONE])]: '╷',
	[ID([NONE,NONE,HEAVY,NONE])]:  '╻',
	
	// UP + DOWN (0b0101)
	[ID([SINGLE,NONE,SINGLE,NONE])]: '│',
	[ID([HEAVY,NONE,HEAVY,NONE])]:   '┃',
	[ID([HEAVY,NONE,SINGLE,NONE])]:  '╿',
	[ID([SINGLE,NONE,HEAVY,NONE])]:  '╽',
	[ID([DOUBLE,NONE,DOUBLE,NONE])]: '║',
	
	// UP + DOWN (0b0101) W/ DASH
	[ID([SINGLE|DASH2,NONE,SINGLE|DASH2,NONE])]: '╎',
	[ID([SINGLE|DASH3,NONE,SINGLE|DASH3,NONE])]: '┆',
	[ID([SINGLE|DASH4,NONE,SINGLE|DASH4,NONE])]: '┊',
	[ID([HEAVY|DASH2,NONE,HEAVY|DASH2,NONE])]:   '╏',
	[ID([HEAVY|DASH3,NONE,HEAVY|DASH3,NONE])]:   '┇',
	[ID([HEAVY|DASH4,NONE,HEAVY|DASH4,NONE])]:   '┋',
	
	// DOWN + RIGHT (0b0110)
	[ID([NONE,SINGLE,SINGLE,NONE],RECT)]:  '┌',
	[ID([NONE,SINGLE,SINGLE,NONE],ROUND)]: '╭',
	[ID([NONE,HEAVY,SINGLE,NONE],RECT)]:   '┍',
	[ID([NONE,SINGLE,HEAVY,NONE],RECT)]:   '┎',
	[ID([NONE,HEAVY,HEAVY,NONE],RECT)]:    '┏',
	[ID([NONE,SINGLE,DOUBLE,NONE],RECT)]:  '╒',
	[ID([NONE,DOUBLE,SINGLE,NONE],RECT)]:  '╓',
	[ID([NONE,DOUBLE,DOUBLE,NONE],RECT)]:  '╔',
	
	// UP + RIGHT + DOWN (0b0111)
	[ID([SINGLE,SINGLE,SINGLE,NONE])]: '├',
	[ID([HEAVY,SINGLE,SINGLE,NONE])]:  '┞',
	[ID([SINGLE,HEAVY,SINGLE,NONE])]:  '┝',
	[ID([SINGLE,SINGLE,HEAVY,NONE])]:  '┟',
	[ID([HEAVY,SINGLE,HEAVY,NONE])]:   '┠',
	[ID([HEAVY,HEAVY,SINGLE,NONE])]:   '┡',
	[ID([SINGLE,HEAVY,HEAVY,NONE])]:   '┢',
	[ID([HEAVY,HEAVY,HEAVY,NONE])]:    '┣',
	[ID([SINGLE,DOUBLE,SINGLE,NONE])]: '╞',
	[ID([DOUBLE,SINGLE,DOUBLE,NONE])]: '╟',
	[ID([DOUBLE,DOUBLE,DOUBLE,NONE])]: '╠',
	
	// LEFT (0b1000)
	[ID([NONE,NONE,NONE,SINGLE])]: '╴',
	[ID([NONE,NONE,NONE,HEAVY])]:  '╸',
	
	// UP + LEFT (0b1001)
	[ID([SINGLE,NONE,NONE,SINGLE],RECT)]:  '┘',
	[ID([SINGLE,NONE,NONE,SINGLE],ROUND)]: '╯',
	[ID([HEAVY,NONE,NONE,SINGLE],RECT)]:   '┚',
	[ID([SINGLE,NONE,NONE,HEAVY],RECT)]:   '┙',
	[ID([HEAVY,NONE,NONE,HEAVY],RECT)]:    '┛',
	[ID([SINGLE,NONE,NONE,DOUBLE],RECT)]:  '╛',
	[ID([DOUBLE,NONE,NONE,SINGLE],RECT)]:  '╜',
	[ID([DOUBLE,NONE,NONE,DOUBLE],RECT)]:  '╝',
	
	// RIGHT + LEFT (0b1010)
	[ID([NONE,SINGLE,NONE,SINGLE])]: '─',
	[ID([NONE,HEAVY,NONE,HEAVY])]:   '━',
	[ID([NONE,DOUBLE,NONE,DOUBLE])]: '═',
	[ID([NONE,HEAVY,NONE,SINGLE])]:  '╼',
	[ID([NONE,SINGLE,NONE,HEAVY])]:  '╾',
	
	// RIGHT + LEFT (0b1010) W/ DASH
	[ID([NONE,SINGLE|DASH2,NONE,SINGLE|DASH2])]: '╌',
	[ID([NONE,SINGLE|DASH3,NONE,SINGLE|DASH3])]: '┄',
	[ID([NONE,SINGLE|DASH4,NONE,SINGLE|DASH4])]: '┈',
	[ID([NONE,HEAVY|DASH2,NONE,HEAVY|DASH2])]:   '╍',
	[ID([NONE,HEAVY|DASH3,NONE,HEAVY|DASH3])]:   '┅',
	[ID([NONE,HEAVY|DASH4,NONE,HEAVY|DASH4])]:   '┉',
	
	// UP + RIGHT + LEFT (0b1011)
	[ID([SINGLE,SINGLE,NONE,SINGLE])]: '┴',
	[ID([SINGLE,SINGLE,NONE,HEAVY])]:  '┵',
	[ID([SINGLE,HEAVY,NONE,SINGLE])]:  '┶',
	[ID([SINGLE,HEAVY,NONE,HEAVY])]:   '┷',
	[ID([HEAVY,SINGLE,NONE,SINGLE])]:  '┸',
	[ID([HEAVY,SINGLE,NONE,HEAVY])]:   '┹',
	[ID([HEAVY,HEAVY,NONE,SINGLE])]:   '┺',
	[ID([HEAVY,HEAVY,NONE,HEAVY])]:    '┻',
	[ID([DOUBLE,SINGLE,NONE,SINGLE])]: '╨',
	[ID([SINGLE,DOUBLE,NONE,DOUBLE])]: '╧',
	[ID([DOUBLE,DOUBLE,NONE,DOUBLE])]: '╩',
	
	// DOWN + LEFT (0b1100)
	[ID([NONE,NONE,SINGLE,SINGLE],RECT)]:  '┐',
	[ID([NONE,NONE,SINGLE,SINGLE],ROUND)]: '╮',
	[ID([NONE,NONE,HEAVY,SINGLE],RECT)]:   '┒',
	[ID([NONE,NONE,SINGLE,HEAVY],RECT)]:   '┑',
	[ID([NONE,NONE,HEAVY,HEAVY],RECT)]:    '┓',
	[ID([NONE,NONE,SINGLE,DOUBLE],RECT)]:  '╕',
	[ID([NONE,NONE,DOUBLE,SINGLE],RECT)]:  '╖',
	[ID([NONE,NONE,DOUBLE,DOUBLE],RECT)]:  '╗',

	// UP + DOWN + LEFT (0b1101)
	[ID([SINGLE,NONE,SINGLE,SINGLE])]: '┤',
	[ID([HEAVY,NONE,SINGLE,SINGLE])]:  '┦',
	[ID([SINGLE,NONE,HEAVY,SINGLE])]:  '┧',
	[ID([SINGLE,NONE,SINGLE,HEAVY])]:  '┥',
	[ID([HEAVY,NONE,SINGLE,HEAVY])]:   '┩',
	[ID([HEAVY,NONE,HEAVY,SINGLE])]:   '┨',
	[ID([SINGLE,NONE,HEAVY,HEAVY])]:   '┪',
	[ID([HEAVY,NONE,HEAVY,HEAVY])]:    '┫',
	[ID([SINGLE,NONE,SINGLE,DOUBLE])]: '╡',
	[ID([DOUBLE,NONE,DOUBLE,SINGLE])]: '╢',
	[ID([DOUBLE,NONE,DOUBLE,DOUBLE])]: '╣',
	
	// DOWN + RIGHT + LEFT (0b1110)
	[ID([NONE,SINGLE,SINGLE,SINGLE])]: '┬',
	[ID([NONE,SINGLE,SINGLE,HEAVY])]:  '┭',
	[ID([NONE,SINGLE,HEAVY,SINGLE])]:  '┰',
	[ID([NONE,SINGLE,HEAVY,HEAVY])]:   '┱',
	[ID([NONE,HEAVY,SINGLE,SINGLE])]:  '┮',
	[ID([NONE,HEAVY,SINGLE,HEAVY])]:   '┯',
	[ID([NONE,HEAVY,HEAVY,SINGLE])]:   '┲',
	[ID([NONE,HEAVY,HEAVY,HEAVY])]:    '┳',
	[ID([NONE,SINGLE,DOUBLE,SINGLE])]: '╥',
	[ID([NONE,DOUBLE,SINGLE,DOUBLE])]: '╤',
	[ID([NONE,DOUBLE,DOUBLE,DOUBLE])]: '╦',
	
	// UP + RIGHT + DOWN + LEFT (0b1111)
	[ID([SINGLE,SINGLE,SINGLE,SINGLE])]: '┼',
	// +1 HEAVY
	[ID([HEAVY,SINGLE,SINGLE,SINGLE])]: '╀',
	[ID([SINGLE,HEAVY,SINGLE,SINGLE])]: '┾',
	[ID([SINGLE,SINGLE,HEAVY,SINGLE])]: '╁',
	[ID([SINGLE,SINGLE,SINGLE,HEAVY])]: '┽',
	// +2 HEAVY
	[ID([HEAVY,HEAVY,SINGLE,SINGLE])]: '╄',
	[ID([HEAVY,SINGLE,SINGLE,HEAVY])]: '╃',
	[ID([SINGLE,SINGLE,HEAVY,HEAVY])]: '╅',
	[ID([SINGLE,HEAVY,SINGLE,HEAVY])]: '╆',
	// +3 HEAVY
	[ID([HEAVY,HEAVY,HEAVY,SINGLE])]: '╊',
	[ID([HEAVY,HEAVY,SINGLE,HEAVY])]: '╇',
	[ID([HEAVY,SINGLE,HEAVY,HEAVY])]: '╉',
	[ID([SINGLE,HEAVY,HEAVY,HEAVY])]: '╈',
	// HEAVY/LIGHT
	[ID([SINGLE,HEAVY,SINGLE,HEAVY])]: '┿',
	[ID([HEAVY,SINGLE,HEAVY,SINGLE])]: '╂',
	[ID([HEAVY,HEAVY,HEAVY,HEAVY])]:   '╋',
	// SINGLE/DOUBLE
	[ID([SINGLE,DOUBLE,SINGLE,DOUBLE])]: '╪',
	[ID([DOUBLE,SINGLE,DOUBLE,SINGLE])]: '╫',
	[ID([DOUBLE,DOUBLE,DOUBLE,DOUBLE])]: '╬'
};

const SHADOW_BLOCKS = [' ','░','▒','▓','█'];
const QUAD_BLOCKS   = [' ','▘','▝','▀','▖','▌','▞','▛','▗','▚','▐','▜','▄','▙','▟','█'];
const HORIZ_BLOCKS  = [' ','▏','▎','▍','▌','▋','▊','▉','█'];
const VERT_BLOCKS   = [' ','▁','▂','▃','▄','▅','▆','▇'];

/**
 * TextBoxBlock - a single block in a TextBox grid.
 * @class
 * @prop {Array}   style - the style of each of the four directions
 * @prop {Boolean} round - using round corners instead of the default rectangular ones
 */
class TextBoxBlock {
	/**
	 * TextBoxBlock constructor.
	 * @param {Array|Object} style - the descriptor of the node whose indices are the four directions and whose values are bitmaps for the lines
	 * @param {Boolean} [round=false] - the rounding style of corners
	 */
	constructor(value, style = [], round = false) {
		this.value = value;
		this.style = [0,0,0,0];
		if (style instanceof Array) {
			for (let d in DIRS) {
				this.style[DIRS[d]] = resolveStyle(style[DIRS[d]]);
			}
		} else if (typeof(style) === 'object') {
			for (let d in DIRS) {
				this.style[DIRS[d]] = resolveStyle(style[d.toLowerCase()]);
			}
		}
		this.round = round;
	}
	get up() {
		return this.style[DIRS.UP];
	}
	set up(x) {
		this.style[DIRS.UP] = resolveStyle(x);
	}
	get right() {
		return this.style[DIRS.RIGHT];
	}
	set right(x) {
		this.style[DIRS.RIGHT] = resolveStyle(x);
	}
	get down() {
		return this.style[DIRS.DOWN];
	}
	set down(x) {
		this.style[DIRS.DOWN] = resolveStyle(x);
	}
	get left() {
		return this.style[DIRS.LEFT];
	}
	set left(x) {
		this.style[DIRS.LEFT] = resolveStyle(x);
	}
	get shape() {
		return shape(this.style);
	}
	get ID() {
		return ID(this.style, this.round);
	}
	get charCode() {
		if (typeof(this.value) == 'string') {
			return this.value.charCodeAt(0);
		} else try {
			return BOX[this.ID].charCodeAt(0);
		} catch (e) {
			return 0x20;
		}
	}
	toString() {
		if (typeof(this.value) == 'string') {
			return this.value;
		} else try {
			return BOX[this.ID] || ' ';
		} catch (e) {
			return ' ';
		}
	}
}

/**
 * TextBox class - produces textual graphics using box-drawing unicode characters.
 * @class
 * @prop {Number} width - the width of the grid
 * @prop {Number} height - the height of the grid
 * @prop {Array<TextBoxBlock>} grid - the uniform grid of TextBoxBlocks
 */
class TextBox {
	constructor(width, height, options = {}) {
		this.width = width;
		this.height = height;
		this.grid = Array(width * height).fill(0).map(() => new TextBoxBlock());
		this.defaultCornerStyle = options.defaultCornerStyle || RECT;
		this.defaultStrokeStyle = options.defaultStrokeStyle || SINGLE;
	}
	get(x,y) {
		return this.grid[y * this.width + x];
	}
	set(x,y,value) {
		let block = this.get(x,y);
		block.value = value;
	}
	isSpace(x,y) {
		let code = this.get(x,y).charCode;
		return code == 0x20 || code == 0x0A || code == 0x0D;
	}
	isBox(x,y) {
		let code = this.get(x,y).charCode;
		return code >= 0x2500 && code < 0x2580;
	}
	isBlock(x,y) {
		let code = this.get(x,y).charCode;
		return code >= 0x2580 && code < 0x25A0;
	}
	_stroke(x,y,dir,style) {
		let block = this.get(x,y);
		block[dir] = style;
		block.value = null;
	}
	drawHorizLine(x0, y, x1, style = this.defaultStrokeStyle) {
		[x0,x1] = [x0,x1].sort();
		let x = x0;
		while (x < x1) {
			this._stroke(x,y,'right',style);
			x++;
			this._stroke(x,y,'left',style);
		}
		return this;
	}
	drawVertLine(x, y0, y1, style = this.defaultStrokeStyle) {
		[y0,y1] = [y0,y1].sort();
		let y = y0;
		while (y < y1) {
			this._stroke(x,y,'down',style);
			y++;
			this._stroke(x,y,'up',style);
		}
		return this;
	}
	drawBox(x0, y0, x1, y1, style = this.defaultStrokeStyle, corners = this.defaultCornerStyle, shadow) {
		if (typeof(style) == 'object') {
			shadow = style;
			style = this.defaultStrokeStyle;
		}
		if (typeof(corners) == 'object') {
			shadow = corners;
			style = this.defaultCornerStyle;
		}
		
		this.drawHorizLine(x0,y0,x1,style);
		this.drawHorizLine(x0,y1,x1,style);
		this.drawVertLine(x0,y0,y1,style);
		this.drawVertLine(x1,y0,y1,style);
		
		this.get(x0,y0).round = corners;
		this.get(x1,y0).round = corners;
		this.get(x0,y1).round = corners;
		this.get(x1,y1).round = corners;
		
		if (shadow) {
			let {xOffset = 1, yOffset = 1, weight = 1} = shadow;
			weight = Math.min(weight, SHADOW_BLOCKS.length - 1);
			[x0,x1] = [x0,x1].sort();
			[y0,y1] = [y0,y1].sort();
			let x, y, sx, sy;
			for (y = y0; y <= y1; y++) {
				sy = y + yOffset;
				for (x = x0; x <= x1; x++) {
					sx = x + xOffset;
					if (sx < x0 || sx > x1 || sy < y0 || sy > y1) {
						if (sx > -1 && sx < this.width && sy > -1 && sy < this.height) {
							this.set(sx, sy, SHADOW_BLOCKS[weight]);
						}
					}
				}
			}
		}
		return this;
	}
	print(text, x, y) {
		let ox = x, oy = y, lookahead, endx, words = text.split(/\s+/), w = 0, word;
		while (w < words.length && y < this.height) {
			word = words[w];
			endx = x + word.length;
			lookahead = x;
			while (lookahead < this.width - 1 && this.isSpace(lookahead, y)) {
				lookahead++;
			}
			if (lookahead >= endx) {
				for (let i = 0; x < endx && y < this.height; i++) {
					if (word[i] == '\n') {
						x = ox;
						y++;
					} else {
						this.set(x++,y,word[i]);
					}
				}
				x++;
				w++;
			} else {
				x = ox;
				y++;
			}
		}
		return this;
	}
	toString() {
		let str = '';
		for (let r = 0; r < this.height; r++) {
			str += this.grid.slice(r * this.width, (r+1) * this.width).map(block => block.toString()).join('') + '\n';
		}
		return str;
	}
}

TextBox.SHADOW = SHADOW_BLOCKS;
TextBox.QUAD   = QUAD_BLOCKS;
TextBox.HORIZ  = HORIZ_BLOCKS;
TextBox.VERT   = VERT_BLOCKS;
TextBox.STROKE = STROKE;
TextBox.CORNER = CORNER;

module.exports = {TextBox,TextBoxBlock};
