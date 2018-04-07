class Color {
	constructor(r,g,b) {
		if (arguments.length == 1) {
			if (typeof(r) === 'number') {
				this.val = r;
			} else if (typeof(r) === 'object') {
				this.red   = r.r;
				this.green = r.g;
				this.blue  = r.b;
			}
		} else {
			this.red   = r;
			this.green = g;
			this.blue  = b;
		}
	}
	static get RED() {
		return 0xFF0000;
	}
	static get GREEN() {
		return 0x00FF00;
	}
	static get BLUE() {
		return 0x0000FF;
	}
	static get MAX() {
		return 0xFFFFFF;
	}
	static truncate(x) {
		return Math.max(0, Math.min(x | 0, 0xFF));
	}
	get red() {
		return this.r;
	}
	set red(x) {
		this.r = Color.truncate(x);
	}
	get green() { 
		return this.g;
	}
	set green(x) {
		this.g = Color.truncate(x);
	}
	get blue() {
		return this.b;
	}
	set blue(x) {
		this.b = Color.truncate(x);
	}
	get rgba() {
		return (this.val << 8) | 0xFF;
	}
	get val() {
		return (this.r * 0x10000) + (this.g * 0x100) + this.b;
	}
	set val(x) {
		this.red   = Math.floor(x/0x10000);
		this.green = Math.floor(x/0x100) % 0x100;
		this.blue  = x % 0x100;
	}
	get greyscale() {
		let average = (this.r + this.g + this.b) / 3;
		return new Color(average,average,average);
	}
	random(max = 0xFF) {
		this.red   = max * Math.random();
		this.green = max * Math.random();
		this.blue  = max * Math.random();
		return this;
	}
	compare(c) {
		if (this.val > c.val) return 1;
		if (this.val < c.val) return -1;
		return 0;
	}
	add(c) {
		return new Color(this.r + c.r,this.g + c.g,this.b + c.b);
	}
	subtract(c) {
		return new Color(this.r - c.r,this.g - c.g,this.b - c.b);
	}
	scale(c) {
		return new Color(this.r * c,this.g * c,this.b * c);
	}
	scaleWrap(c) {
		return new Color((this.r * c) % 0x100, (this.g * c) % 0x100, (this.b * c) % 0x100);
	}
	average() {
		let colors = [...arguments];
		let num = colors.length + 1;
		let avgColor = new Color(this.r,this.g,this.b);
		for (let c of colors) {
			avgColor.r += c.r;
			avgColor.g += c.g;
			avgColor.b += c.b;
		}
		avgColor.red   = avgColor.r / num;
		avgColor.green = avgColor.g / num;
		avgColor.blue  = avgColor.b / num;
		return avgColor;
	}
	interpolate(c,w) {
		return new Color(this.r + w * (c.r - this.r),
		                 this.g + w * (c.g - this.g),
						 this.b + w * (c.b - this.b));
	}
	reset() {
		this.r = this.g = this.b = 0;
	}
	toString() {
		return `R=${this.r},G=${this.g},B=${this.b}`;
	}
}

class ColorPalette {
	constructor() {
		this.colors = [];
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
		return c1.interpolate(c2, x % 1);
	}
	random(x) {
		this.clear();
		for (;x;--x) this.add(new Color().random());
		return this;
	}
	toEmbedObject(page) {
		return {
			title: 'Color Palette',
			description: `Scale: ${this.scale}`,
			fields: this.colors.map((c,i) => {
				return {
					name: String(i+1),
					value: c.toString(),
					inline: true
				};
			})
		};
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
}

module.exports = {
	Color,
	ColorPalette,
	ColorGradient
};
