const Jimp    = require('jimp');
const Promise = require('bluebird');
const {random} = require('./random');
const {Color} = require('./color');

// https://github.com/oliver-moran/jimp/issues/90
Jimp.prototype.getBufferAsync = Promise.promisify(Jimp.prototype.getBuffer);

Jimp.prototype.convoluteWithScale = function (convolutionMatrix, scale) {
	return this.convolute(convolutionMatrix.map(row => row.map(x => x * scale)));
};

Jimp.prototype.sharpen = function () {
	return this.convolute([
		[ 0,-1, 0],
		[-1, 5,-1],
		[ 0,-1, 0]
	]);
};

Jimp.prototype.unsharpen = function () {
	return this.convoluteWithScale([
		[ 1, 4,   6, 4, 1],
		[ 4,16,  24,16, 4],
		[ 6,24,-476,24, 6],
		[ 4,16,  24,16, 4],
		[ 1, 4,   6, 4, 1]
	], -1/256);
};

Jimp.prototype.emboss = function () {
	return this.convolute([
		[-2,-1, 0],
		[-1, 1, 1],
		[ 0, 1, 2]
	]);
};

Jimp.prototype.symmetry = function (direction) {
	direction = direction.toLowerCase();
	var width = this.bitmap.width;
	var height = this.bitmap.height;
	return this.scan(0, 0, width, height, function (x,y,i) {
		var x2 = width  - 1 - x;
		var y2 = height - 1 - y;
		var c1 = this.getPixelColor(x,y);
		var c2 = this.getPixelColor(x2,y);
		var c3 = this.getPixelColor(x,y2);
		var c4 = this.getPixelColor(x2,y2);
		switch (direction) {
			case 'l-r':
			case 'left-right':
				this.setPixelColor(c1,x2,y);
				break;
			case 'r-l':
			case 'right-left':
				this.setPixelColor(c2,x,y);
				break;
			case 't-b':
			case 'top-bottom':
				this.setPixelColor(c1,x,y2);
				break;
			case 'b-t':
			case 'bottom-top':
				this.setPixelColor(c3,x,y);
				break;
			case 't-l':
			case 'top-left':
				this.setPixelColor(c1,x2,y);
				this.setPixelColor(c1,x,y2);
				this.setPixelColor(c1,x2,y2);
				break;
			case 't-r':
			case 'top-right':
				this.setPixelColor(c2,x,y);
				this.setPixelColor(c2,x,y2);
				this.setPixelColor(c2,x2,y2);
				break;
			case 'b-l':
			case 'bottom-left':
				this.setPixelColor(c3,x,y);
				this.setPixelColor(c3,x2,y);
				this.setPixelColor(c3,x2,y2);
				break;
			case 'b-r':
			case 'bottom-right':
				this.setPixelColor(c4,x,y);
				this.setPixelColor(c4,x2,y);
				this.setPixelColor(c4,x,y2);
				break;
		}
	});
};

Jimp.prototype.gradientX = function () {
	return this.clone().convolute([
		[-1,0,1]
	]);
};

Jimp.prototype.gradientY = function () {
	return this.clone().convolute([
		[-1],
		[0],
		[1]
	]);
	/*
	return this.map((color,x,y,i) => {
		var colors = [
			this.getPixelColor(x,y-1),
			this.getPixelColor(x,y+1)
		].map(Jimp.intToRGBA).map(Color.from);
		
		return colors[2].distance(color) - colors[0].distance(color);
	});
	*/
};

Jimp.prototype.deepfry = function () {
	return this.color([{
		apply: 'saturate',
		params: [random(20,100)]
	}])
	.posterize(random(4,15))
	.quality(random(1,20));
};

Jimp.prototype.getAntiAliasedPixelColor = Jimp.prototype.getAAPixelColor = function (x,y) {
	var x0 = x | 0,
		y0 = y | 0,
		x1 = x0 + 1,
		y1 = y0 + 1;
	if (x0 < x || y0 < y) {
		var colors = [
			this.getPixelColor(x0, y0),
			this.getPixelColor(x1, y0),
			this.getPixelColor(x0, y1),
			this.getPixelColor(x1, y1)
		].map(c => Jimp.intToRGBA(c));
		// linear anti-aliasing
		return Color.interpolate(
			Color.interpolate(colors[0], colors[1], x - x0),
			Color.interpolate(colors[2], colors[3], x - x0),
		y - y0).rgba;
	} else {
		return this.getPixelColor(x0, y0);
	}
};

Jimp.prototype.map = function (map) {
	var clone = this.clone();
	this.scan(0, 0, this.bitmap.width, this.bitmap.height, (x,y,i)	=> {
		var color = Jimp.intToRGBA(this.getPixelColor(x,y));
		color = map(color, x, y, i, this);
		if (typeof(color) === 'object') {
			color = Jimp.rgbaToInt(color.r|0,color.g|0,color.b|0,color.a);
		}
		clone.setPixelColor(color, x, y);
	});
	return clone;
};

Jimp.prototype.transform = function (T) {
	return this.map((color,x,y,i,img) => {
		// transform x and y
		({x,y} = T(x,y));
		return this.getAAPixelColor(x,y);
	});
};

Jimp.prototype.differentialBlur = function (D) {
	var w = this.bitmap.width;
	var h = this.bitmap.height;
	var d = Math.hypot(w,h); // diagonal
	return this.map((color,x,y,i,img) => {
		var hex, color2;
		
		// get the differential at the x and y
		var {dx,dy} = D(x,y);
		
		// find its scalar value
		var dist = Math.hypot(dx, dy);
		if (isFinite(dist)) {
			// normalize the stepping values
			dx /= dist;
			dy /= dist;
			
			// calculate the starting point and the line length
			var count = 1, step = 0, max = Math.min(dist, d);
			
			// start at one end of the slope line
			var tx = x - dx * max / 2;
			var ty = y - dy * max / 2;
			
			for (; step < max; ++step) {
				if (tx < 0 || tx > w || ty < 0 || ty > h) {
					// skip out of bounds
				} else {
					hex    = this.getPixelColor(tx|0, ty|0);
					color2 = Jimp.intToRGBA(hex);
					color.r += color2.r;
					color.g += color2.g;
					color.b += color2.b;
					count++;
				}
				tx += dx;
				ty += dy;
			}
			// set the clone's pixel color to the average of the colors traversed
			color.r /= count;
			color.g /= count;
			color.b /= count;
			
			return color;
		}
	});
};

Jimp.prototype.swirl = function (strength, radius) {
	var w = this.bitmap.width;
	var h = this.bitmap.height;
	var ox = w / 2;
	var oy = h / 2;
	if (!radius) {
		radius = Math.log(2) * Math.min(w,h) / 5;
	}
	return this.transform((x,y) => {
		var dx = x - ox;
		var dy = y - oy;
		var dd = Math.hypot(dx, dy);
		var theta = Math.atan2(dy, dx) + (strength * Math.PI * Math.exp(-dd/radius));
		x = ox + dd * Math.cos(theta);
		y = oy + dd * Math.sin(theta);
		return {x,y};
	});
};

Jimp.prototype.recursion = Jimp.prototype.droste = function (ox, oy, scale = 0.5) {
	if (scale > 0 && scale < 0.95) {
		var depth = Math.log(this.bitmap.width) / Math.log(1/scale);
		for (var i = 0; i < depth; i++) {
			this.composite(this.clone().scale(scale), ox, oy);
		}
	}
	return this;
};

class Seam {
	constructor(startx = 0, starty = 0) {
		this.points = [];
		this.weight = 0;
		this.push(startx,starty);
	}
	goto(x,y) {
		this.points.push({x,y});
	}
	static horizontalSeam(img, y) {
		var seam = new Seam(0,y);
		
	}
	static verticalSeam(img, x) {
		var seam = new Seam(x,0);
		
	}
}

// https://en.wikipedia.org/wiki/Seam_carving
Jimp.prototype.liquid_rescale = function (width, height, delta_x = 1, delta_y = 1) {
	throw 'Work in progress!';
	
	var gs = this.greyscale();
	var gX = gs.gradientX();
	var gY = gs.gradientY();
	var seamsX = Array.of(this.bitmap.width);
	for (var s in seamsX) {
		seamsX[s] = Seam.verticalSeam(gY, s);
	}
	var seamsY = Array.of(this.bitmap.height);
	for (var s in seamsY) {
		seamsY[s] = Seam.horizontalSeam(gX, s);
	}
	
	return this;
};

Jimp.prototype.magik = function () {
	var w = this.bitmap.width;
	var h = this.bitmap.height;
	return this.liquid_rescale(0.5 * w, 0.5 * h, 1, 1).liquid_rescale(1.0 * w, 1.0 * h, 1, 1);
};

module.exports = {Jimp};
