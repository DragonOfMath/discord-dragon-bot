class Color {
	constructor(r,g,b,a) {
		if (arguments.length == 1) {
			if (typeof(r) === 'number') {
				this.val = r;
			} else if (typeof(r) === 'object') {
				this.red   = r.r;
				this.green = r.g;
				this.blue  = r.b;
				this.alpha = r.a === undefined ? 0xFF : r.a;
			}
		} else {
			this.red   = r;
			this.green = g;
			this.blue  = b;
			this.alpha = a === undefined ? 0xFF : a;
		}
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
	get yellow() {
		return (this.r + this.g) / 2;
	}
	get cyan() {
		return (this.g + this.b) / 2;
	}
	get magenta() {
		return (this.b + this.r) / 2;
	}
	get alpha() {
		return this.a;
	}
	set alpha(x) {
		this.a = Color.truncate(x);
	}
	get rgba() {
		// bitwise operations are 32 bits only
		// return (this.val << 8) | this.a;
		return (this.val * 0x100) + this.a;
	}
	get argb() {
		//return (this.a << 24) | this.val;
		return (this.a * 0x1000000) + this.val;
	}
	get val() {
		//return (this.r << 16) | (this.g << 8) | this.b;
		return (this.r * 0x10000) + (this.g * 0x100) + this.b;
	}
	set val(x) {
		this.red   = Math.floor(x/0x10000);
		this.green = Math.floor(x/0x100) % 0x100;
		this.blue  = x % 0x100;
	}
	get greyscale() {
		var average = (this.r + this.g + this.b) / 3;
		return new Color(average,average,average);
	}
	random(max = 0xFF) {
		return Color.random(max);
	}
	compare(c) {
		if (this.val > c.val) return 1;
		if (this.val < c.val) return -1;
		return 0;
	}
	add(c) {
		return new Color(this.r + c.r, this.g + c.g, this.b + c.b, this.a);
	}
	subtract(c) {
		return new Color(this.r - c.r, this.g - c.g, this.b - c.b, this.a);
	}
	scale(c) {
		return new Color(this.r * c, this.g * c, this.b * c, this.a);
	}
	scaleWrap(c) {
		return new Color((this.r * c) % 0x100, (this.g * c) % 0x100, (this.b * c) % 0x100, this.a);
	}
	average() {
		return Color.average(this, ...arguments);
	}
	interpolate(c,w) {
		return Color.interpolate(this, c, w);
	}
	reset() {
		this.r = this.g = this.b = 0;
	}
	toString() {
		return `R=${this.r},G=${this.g},B=${this.b}`;
	}
	clone() {
		return new Color(this);
	}
	
	static truncate(x) {
		return Math.max(0, Math.min(x | 0, 0xFF));
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
		avgColor.red   = avgColor.r / num;
		avgColor.green = avgColor.g / num;
		avgColor.blue  = avgColor.b / num;
		avgColor.alpha = avgColor.a / num;
		return avgColor;
	}
	static interpolate(c1, c2, w) {
		return new Color(c1.r + w * (c2.r - c1.r),
		                 c1.g + w * (c2.g - c1.g),
						 c1.b + w * (c2.b - c1.b),
						 c1.a + w * (c2.a - c1.a));
	}
	static random(max = 0xFF) {
		var red   = max * Math.random();
		var green = max * Math.random();
		var blue  = max * Math.random();
		return new Color(red, green, blue);
	}
	// https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSL
	static hsl(hue, saturation, lightness) {
		hue        = Math.max(Math.min(hue, 360), 0);
		saturation = Math.max(Math.min(saturation, 1), 0);
		lightness  = Math.max(Math.min(lightness, 1), 0);
		
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
