const {minmax,interp,quantize} = require('./Math');
function clamp(x) {
	return Math.max(0, Math.min(x|0, 0xFF));
}

class Color {
	constructor(r=0,g=0,b=0,a=0xFF) {
		if (arguments.length == 1) {
			if (typeof(r) === 'number') {
				this.rgba = r;
			} else if (typeof(r) === 'object') {
				if (r instanceof Array) {
					this.red   = r[0];
					this.green = r[1];
					this.blue  = r[2];
					this.alpha = r[3] === undefined ? 0xFF : r[3];
				} else {
					this.red   = r.r || r.red;
					this.green = r.g || r.green;
					this.blue  = r.b || r.blue;
					this.alpha = r.a === undefined ? r.alpha === undefined ? 0xFF : r.alpha : r.a;
				}
			} else {
				throw new Error('Invalid Color constructor params: ' + arguments);
			}
		} else {
			this.red   = r;
			this.green = g;
			this.blue  = b;
			this.alpha = a;
		}
	}
	get luminosity() {
		return (0.2126 * this.r + 0.7152 * this.g + 0.0722 * this.b) * (this.a / 255);
	}
	get average() {
		return (this.r + this.g + this.b) / 3;
	}
	get max() {
		return Math.max(this.r, this.g, this.b);
	}
	get min() {
		return Math.min(this.r, this.g, this.b);
	}
	get yellow() {
		return (this.r + this.g) / 2;
	}
	get cyan() {
		return (this.g + this.b) / 2;
	}
	get magenta() {
		return (this.b + this.r) / 2;
	}
	get red() {
		return this.r;
	}
	set red(x) {
		this.r = clamp(x);
	}
	get green() { 
		return this.g;
	}
	set green(x) {
		this.g = clamp(x);
	}
	get blue() {
		return this.b;
	}
	set blue(x) {
		this.b = clamp(x);
	}
	get alpha() {
		return this.a;
	}
	set alpha(x) {
		this.a = clamp(x);
	}
	get rgb() {
		//return (this.r << 16) | (this.g << 8) | this.b;
		return (this.r * 0x10000) + (this.g * 0x100) + this.b;
	}
	set rgb(x) {
		this.b  = x % 0x100;
		x = (x - this.b) / 0x100;
		this.g = x % 0x100;
		x = (x - this.g) / 0x100;
		this.r = x % 0x100;
	}
	get rgba() {
		return this.a + 256 * (this.b + 256 * (this.g + 256 * this.r));
	}
	set rgba(x) {
		this.a = x % 0x100;
		x = (x - this.a) / 0x100;
		this.b = x % 0x100;
		x = (x - this.b) / 0x100;
		this.g = x % 0x100;
		x = (x - this.g) / 0x100;
		this.r = x % 0x100;
	}
	get hex() {
		return '#' + this.rgb.toString(16).padStart(6, '0');
	}
	compare(c) {
		c = c instanceof Color ? c.rgb : c;
		var mine = this.rgb;
		if (mine > c) return 1;
		if (mine < c) return -1;
		return 0;
	}
	equals(c) {
		if (c instanceof Color) {
			return this.rgba === c.rgba;
		} else {
			return this.rgba === c;
		}
	}
	set(c) {
		if (c instanceof Color) {
			this.r = c.r;
			this.g = c.g;
			this.b = c.b;
		} else {
			this.rgb = c;
		}
		return this;
	}
	add(c = 0) {
		if (c instanceof Color) {
			return new Color(this.r + c.r, this.g + c.g, this.b + c.b, this.a);
		} else {
			return new Color(this.r + c, this.g + c, this.b + c, this.a);
		}
	}
	sub(c = 0) {
		if (c instanceof Color) {
			return new Color(this.r - c.r, this.g - c.g, this.b - c.b, this.a);
		} else {
			return new Color(this.r - c, this.g - c, this.b - c, this.a);
		}
	}
	mult(c = 1) {
		if (c instanceof Color) {
			return new Color(this.r * c.r, this.g * c.g, this.b * c.b, this.a);
		} else {
			return new Color(this.r * c, this.g * c, this.b * c, this.a);
		}
	}
	scale(c = 1) {
		return this.mult(c);
	}
	scaleWrap(c) {
		if (c instanceof Color) {
			return new Color((this.r * c.r) % 0x100, (this.g * c.g) % 0x100, (this.b * c.b) % 0x100, this.alpha);
		} else {
			return new Color((this.r * c) % 0x100, (this.g * c) % 0x100, (this.b * c) % 0x100, this.a);
		}
	}
	quantize(q = 1) {
		if (q instanceof Color) {
			return new Color(quantize(this.r, q.r), quantize(this.g, q.g), quantize(this.b, q.b), this.a);
		} else {
			return new Color(quantize(this.r, q), quantize(this.g, q), quantize(this.b, q), this.a);
		}
	}
	interp(c, t = 0) {
		if (c instanceof Color) {
			return new Color(interp(this.r, c.r, t), interp(this.g, c.g, t), interp(this.b, c.b, t), interp(this.a, c.a, t));
		} else {
			return new Color(interp(this.r, c, t), interp(this.g, c, t), interp(this.b, c, t), this.a);
		}
	}
	contrast(c = 0x80, t = 1) {
		if (c instanceof Color) {
			return new Color(interp(c.r, this.r, t), interp(c.g, this.g, t), interp(c.b, this.b, t), interp(c.a, this.a, t));
		} else {
			return new Color(interp(c, this.r, t), interp(c, this.g, t), interp(c, this.b, t), this.a);
		}
	}
	tint(t = 0) {
		return this.interp(0xFF, t);
	}
	shade(s = 0) {
		return this.interp(0, t);
	}
	lighten(l = 0) {
		return this.mult(1 + l);
	}
	darken(d = 0) {
		return this.mult(1 - d);
	}
	greyscale(correct = false) {
		var avg = correct ? this.luminosity : this.average;
		return new Color(avg, avg, avg, this.a);
	}
	grayscale(correct = false) {
		return this.greyscale(correct);
	}
	distance(c) {
		var d = this.sub(c);
		return Math.sqrt((d.r * d.r) + (d.g * d.g) + (d.b * d.b)) / 255;
	}
	invert(c = 0xFF) {
		if (c instanceof Color) {
			return new Color(c.r - this.r, c.g - this.g, c.b - this.b, this.a);
		} else {
			return new Color(c - this.r, c - this.g, c - this.b, this.a);
		}
	}
	NOT(c = 0xFF) {
		return this.invert(c);
	}
	AND(c) {
		if (c instanceof Color) {
			return new Color(this.r & c.r, this.g & c.g, this.b & c.b, this.a);
		} else {
			return new Color(this.r & c, this.g & c, this.b & c, this.a);
		}
	}
	OR(c) {
		if (c instanceof Color) {
			return new Color(this.r | c.r, this.g | c.g, this.b | c.b, this.a);
		} else {
			return new Color(this.r | c, this.g | c, this.b | c, this.a);
		}
	}
	XOR(c) {
		if (c instanceof Color) {
			return new Color(this.r ^ c.r, this.g ^ c.g, this.b ^ c.b, this.a);
		} else {
			return new Color(this.r ^ c, this.g ^ c, this.b ^ c, this.a);
		}
	}
	random(min = 0, max = 0xFF) {
		this.r = interp(min,max,Math.random()) | 0;
		this.g = interp(min,max,Math.random()) | 0;
		this.b = interp(min,max,Math.random()) | 0;
		return this;
	}
	zero() {
		this.r = this.g = this.b = 0;
	}
	clone() {
		return new Color(this);
	}
	toString() {
		return `R=${this.r},G=${this.g},B=${this.b}`;
	}
	static truncate(x) {
		return Math.max(0, Math.min(x | 0, 0xFF));
	}
	static random(min = 0, max = 0xFF) {
		var red   = interp(min,max,Math.random()) | 0;
		var green = interp(min,max,Math.random()) | 0;
		var blue  = interp(min,max,Math.random()) | 0;
		return new Color(red, green, blue);
	}
	static average(...colors) {
		var num = colors.length;
		var avgColor = new Color();
		for (var c of colors) {
			avgColor.r += c.r;
			avgColor.g += c.g;
			avgColor.b += c.b;
			avgColor.a += c.a;
		}
		avgColor.r /= num;
		avgColor.g /= num;
		avgColor.b /= num;
		avgColor.a /= num; 
		return avgColor;
	}
	static interp(c1, c2, t) {
		if (!(c1 instanceof Color)) {
			c1 = new Color(c1);
		}
		if (!(c2 instanceof Color)) {
			c2 = new Color(c2);
		}
		return c1.interp(c2, t);
	}
	// https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSL
	static hsl(hue, saturation, lightness) {
		hue        = minmax(hue, 0, 360);
		saturation = minmax(saturation, 0, 1);
		lightness  = minmax(lightness, 0, 1);
		
		var h      = hue / 60;
		var chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
		var x      = chroma * (1 - Math.abs(h % 2 - 1));
		
		var red = 0, green = 0, blue = 0;
		switch (Math.floor(h)) {
			case 0:
				red   = chroma;
				green = x;
				break;
			case 1:
				red   = x;
				green = chroma;
				break;
			case 2:
				green = chroma;
				blue  = x;
				break;
			case 3:
				green = x;
				blue  = chroma;
				break;
			case 4:
				red   = x;
				blue  = chroma;
				break;
			case 5:
				red   = chroma;
				blue  = x;
				break;
		}
		var m = lightness - chroma / 2;
		red   = 0xFF * (red   + m);
		green = 0xFF * (green + m);
		blue  = 0xFF * (blue  + m);
		return new Color(red, green, blue);
	}
	static resolve(color) {
		if (typeof(color) === 'number') {
			return color;
		}
		if (typeof(color) === 'object') {
			return new Color(color).rgba;
		}
		if (typeof(color) === 'string') {
			if (this[color.toUpperCase()] instanceof Color) {
				return this[color.toUpperCase()].rgba;
			}
		}
		return 0;
	}
	static from(...args) {
		args = args.map(a => Number(a) || parseInt(a,16));
		if (args.length == 1) {
			return new Color(args[0]);
		} if (args.length == 3) {
			return new Color(...args);
		} else {
			return new Color();
		}
	}
}

Color.RED   = new Color(0xFF, 0, 0);
Color.GREEN = new Color(0, 0xFF, 0);
Color.BLUE  = new Color(0, 0, 0xFF);
Color.YELLOW  = new Color(0xFF, 0xFF, 0);
Color.CYAN    = new Color(0, 0xFF, 0xFF);
Color.MAGENTA = new Color(0xFF, 0, 0xFF);
Color.BLACK = new Color(0, 0, 0);
Color.WHITE = new Color(0xFF, 0xFF, 0xFF);

class ColorPalette {
	constructor() {
		this.colors = [];
	}
	get length() {
		return this.colors.length;
	}
	clear() {
		this.colors = [];
	}
	add() {
		if (this.colors.length == 20) {
			throw 'Limit of 20 colors.';
		}
		var color = new Color(...arguments);
		if (arguments.length == 0) color.random();
		this.colors.push(color);
		return color;
	}
	remove(color) {
		var idx = -1;
		if (color instanceof Color && this.colors.includes(color)) {
			idx = this.colors.indexOf(color);
		} else if (color instanceof Object && color.r && color.g && color.b) {
			idx = this.colors.find(c => c.r == color.r && c.g == color.g && c.b == color.b);
		} else if (arguments.length == 3) {
			idx = this.colors.find(c => c.r == arguments[0] && c.g == arguments[1] && c.b == arguments[2]);
		}
		if (idx > -1) this.colors.splice(idx, 1);
		return this;
	}
	get(x) {
		let c1 = this.colors[(x|0) % this.colors.length];
		let c2 = this.colors[(1+x|0) % this.colors.length];
		return c1.interp(c2, x % 1);
	}
	random(x) {
		this.clear();
		for (;x;--x) this.add(new Color().random());
		return this;
	}
	embed(page) {
		return {
			fields: this.colors.map((c,i) => {
				return {
					name: '#' + String(i+1),
					value: c.toString(),
					inline: true
				};
			})
		};
	}
	toString() {
		return this.colors.map((c,i) => `${String(i+1)}: ${c.toString()}`).join('\n');
	}
}

class ColorGradient extends ColorPalette {
	constructor() {
		super();
		this.gradientCache = [];
		this.scale = 4;
	}
	blend(size) {
		this.gradientCache.length = 0;
		for (var t=0;t<size;++t) {
			this.gradientCache.push(this.get(t/this.scale));
		}
		return this;
	}
	embed() {
		return Object.assign(super.embed(), {
			description: `Scale: ${this.scale}`
		});
	}
}

module.exports = {
	Color,
	ColorPalette,
	ColorGradient
};
