const Jimp     = require('jimp');
const {random} = require('./random');
const {Color}  = require('./Color');
const {Array}  = require('./Array');

// https://github.com/oliver-moran/jimp/issues/90
// update 8/4/2018:
// this was implemented in https://github.com/oliver-moran/jimp/blob/ba15d12ba6bf4f395a238ba387ef6e61a80db22c/src/index.js#L672
//Jimp.prototype.getBufferAsync = require('bluebird').promisify(Jimp.prototype.getBuffer);

Jimp.prototype.getBufferAs = function (filename) {
	var mime = /\.png$/i.test(filename) ? Jimp.MIME_PNG : Jimp.MIME_JPEG;
	return this.getBufferAsync(mime).then(file => ({file, filename}));
};

Jimp.hashDistance = function hashDistance(h1, h2) {
	let sum = 0;
	for (let i = 0; i < h1.length; i++) {
		if (h1[i] != h2[i]) sum++;
	}
	return sum / h1.length;
};

Jimp.prototype.rescale = Jimp.prototype.scale;

// Jimp is broken ;-;

/*
Jimp.measureText = function measureText(font, text) {
	let canvas = new Jimp(1000, 128, 0xFFFFFFFF);
	canvas.print(font, 0, 0, String(text), 1000, 128).autocrop();
	return canvas.bitmap.width;
};
*/

// Monkeypatch for alignment bug
let _print = Jimp.prototype.print;
Jimp.prototype.print = function print(font, x, y, text, width, height) {
	let alignmentX = Jimp.HORIZONTAL_ALIGN_CENTER;
	let alignmentY = Jimp.HORIZONTAL_ALIGN_MIDDLE;
	if (typeof(text) === 'object') {
		({text,alignmentX,alignmentY} = text);
	}
	let textWidth  = Jimp.measureText(font, text);
	let textHeight = Jimp.measureTextHeight(font, text, width);
	
	switch (alignmentX) {
		case Jimp.HORIZONTAL_ALIGN_RIGHT:
			if (isFinite(width)) x += width - textWidth;
			break;
		case Jimp.HORIZONTAL_ALIGN_CENTER:
			if (isFinite(width)) x += (width - textWidth) / 2;
			break;
		case Jimp.HORIZONTAL_ALIGN_LEFT:
		default:
			break;
	}
	
	switch (alignmentY) {
		case Jimp.VERTICAL_ALIGN_BOTTOM:
			if (isFinite(height)) y += height - textHeight;
			break;
		case Jimp.VERTICAL_ALIGN_MIDDLE:
			if (isFinite(height)) y += (height - textHeight) / 2;
		case Jimp.VERTICAL_ALIGN_TOP:
		default:
			break;
	}
	
	return _print.call(this, font, x|0, y|0, text, width, height);
};

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
};

Jimp.prototype.deepfry = function () {
	return this.color([{
		apply: 'saturate',
		params: [random(20,100)]
	}])
	.posterize(random(4,15))
	.quality(random(1,20));
};

Jimp.prototype.pixelate = function (pixels = 32) {
	var w = this.bitmap.width;
	var h = this.bitmap.height;
	return this.resize(pixels, Jimp.AUTO).resize(w, h, Jimp.RESIZE_NEAREST_NEIGHBOR);
};

Jimp.prototype.cropCircle = Jimp.prototype.circleCrop = function cropCircle(resizeToFit = false) {
	let width    = this.bitmap.width;
	let height   = this.bitmap.height;
	let centerx  = width / 2;
	let centery  = height / 2;
	let diameter = Math.min(width, height);
	let radius   = Math.min(centerx, centery);
	if (resizeToFit) {
		this.resize(diameter, diameter);
	}
	return this.map((color,x,y) => {
		if (Math.floor(Math.hypot(x - centerx, y - centery)) > radius) {
			color.a = color.r = color.g = color.b = 0;
		}
		return color;
	});
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

Jimp.prototype.fill = function fill(color, ox = 0, oy = 0, width = this.bitmap.width, height = this.bitmap.height) {
	return this.scan(ox, oy, width, height, (x,y,i) => {
		this.setPixelColor(color, x, y);
	});
};

Jimp.prototype.bucket = function bucket(newColor, ox = 0, oy = 0, tolerance = 0.001) {
	let jimp = this;
	
	let color1 = jimpl.getPixelColor(ox, oy);
	let rgba1 = Jimp.IntToRGBA(color1);
	
	b(ox, oy);
	return this;
	
	function b(x, y) {
		if (x < 0 || x >= jimp.bitmap.width || y < 0 || y > jimp.bitmap.height) return;
		
		let color2 = jimp.getPixelColor(x, y);
		if (color2 == newColor) return;
		
		let rgba2  = Jimp.IntToRGBA(color2);
		if (Jimp.colorDiff(rgba1,rgba2) > tolerance) return;
		
		jimp.setPixelColor(newColor, x, y);
		b(x+1,y),b(x-1,y),b(x,y+1),b(x,y-1);
	}
};

Jimp.prototype.map = function map(M) {
	var clone = this.clone();
	this.scan(0, 0, this.bitmap.width, this.bitmap.height, (x,y,i)	=> {
		var color = Jimp.intToRGBA(this.getPixelColor(x,y));
		color = M(color, x, y, i, this);
		if (typeof(color) === 'object') {
			color = Jimp.rgbaToInt(color.r|0,color.g|0,color.b|0,color.a);
		}
		clone.setPixelColor(color, x, y);
	});
	return clone;
};

Jimp.prototype.transform = function transform(T) {
	return this.map((color,x,y,i,img) => {
		// transform x and y
		({x,y} = T(x,y,i,color));
		return this.getAAPixelColor(x,y);
	});
};

Jimp.prototype.differentialBlur = function differentialBlur(D) {
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

Jimp.prototype.swirl = function swirl(strength, radius) {
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

Jimp.prototype.recursion = Jimp.prototype.droste = function droste(ox, oy, scale = 0.5) {
	if (scale > 0 && scale < 0.95) {
		var depth = Math.log(this.bitmap.width) / Math.log(1/scale);
		for (var i = 0; i < depth; i++) {
			this.composite(this.clone().scale(scale), ox, oy);
		}
	}
	return this;
};

// https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
Jimp.prototype.drawLine = Jimp.prototype.line = function drawLine(x0, y0, x1, y1, color = 0x000000FF, AA = false) {
	x0=x0|0;y0=y0|0;x1=x1|0;y1=y1|0;
	
	if (y0 == y1) {
		return this.drawScanX(x0, y0, x1, color);
	}
	if (x0 == x1) {
		return this.drawScanY(x0, y0, y1, color);
	}
	
	//color = new Color(color).rgba;
	let c = Jimp.intToRGBA(color);
	
	let jimp = this;
	function plot(x,y) {
		jimp.setPixelColor(color, x, y);
	}
	function blend(x,y,t) {
		let b = Color.interpolate(Jimp.intToRGBA(jimp.getPixelColor(x,y)), c, t);
		jimp.setPixelColor(Jimp.rgbaToInt(b.r, b.g, b.b, b.a), x, y);
	}
	
	let x = x0;
	let y = y0;
	let deltax = x1 - x0;
	let deltay = y1 - y0;
	let dx = Math.sign(deltax);
	let dy = Math.sign(deltay);
	
	let err = 0.0;
	let deltaerr = Math.abs(deltay / deltax);
	
	for (;x!=x1;x+=dx) {
		err += deltaerr;
		do {
			if (AA) {
				blend(x,y, err/deltaerr);
				blend(x,y+dy, 1 - err/deltaerr);
			} else {
				plot(x,y);
			}
			if (err > 0.5) {
				y += dy;
				err -= 1;
			}
		} while (err > 0.5);
	}
	return this;
};

// optimized variants for drawing pixels in a cardinal line
Jimp.prototype.drawHorizScanline = Jimp.prototype.drawScanX = function scanx(x0, y, x1, color = 0x000000FF) {
	x0=x0|0;x1=x1|0;
	if (x0 > x1) [x0,x1] = [x1,x0];
	x0 = Math.max(0, x0);
	x1 = Math.min(this.bitmap.width-1, x1);
	while (x0 <= x1) this.setPixelColor(color, x0++, y);
	return this;
};
Jimp.prototype.drawVertScanline  = Jimp.prototype.drawScanY = function scany(x, y0, y1, color = 0x000000FF) {
	y0=y0|0;y1=y1|0;
	if (y0 > y1) [y0,y1] = [y1,y0];
	y0 = Math.max(0, y0);
	y1 = Math.min(this.bitmap.height-1, y1);
	while (y0 <= y1) this.setPixelColor(color, x, y0++);
	return this;
};

// https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
// Need to find Wu algorithm to provide correct anti-aliasing
Jimp.prototype.drawCircle = function drawCircle(x0, y0, radius, color = 0x000000FF, AA = false) {
	x0=x0|0;y0=y0|0;radius=radius|0;
	
	let c = Jimp.IntToRGBA(color);
	
	let jimp = this;
	function plot(x,y) {
		jimp.setPixelColor(color, x, y);
	}
	function blend(x,y,t) {
		let b = Color.interpolate(Jimp.intToRGBA(jimp.getPixelColor(x,y)), c, t);
		jimp.setPixelColor(Jimp.rgbaToInt(b.r, b.g, b.b, b.a), x, y);
	}
	
	let bx = radius, by = 0, d = 0, err;
	do {
		if (AA) {
			// TODO: actually calculate AA error weight
			err = d - bx;
			
			blend(x0 + bx, y0 + by, 1 - err);
			blend(x0 + bx - 1, y0 + by, err);
			
			blend(x0 + by, y0 + bx, 1 - err);
			blend(x0 + by, y0 + bx - 1, err);
			
			blend(x0 - bx, y0 + by, 1 - err);
			blend(x0 - bx + 1, y0 + by, err);
			
			blend(x0 - by, y0 + bx, 1 - err);
			blend(x0 - by, y0 + bx + 1, err);
			
			blend(x0 + bx, y0 - by, 1 - err);
			blend(x0 + bx - 1, y0 - by, err);
			
			blend(x0 + by, y0 - bx, 1 - err);
			blend(x0 + by, y0 - bx + 1, err);
			
			blend(x0 - bx, y0 - by, 1 - err);
			blend(x0 - bx + 1, y0 - by, err);
			
			blend(x0 - by, y0 - bx, 1 - err);
			blend(x0 - by, y0 - bx - 1, err);
			
		} else {
			plot(x0 + bx, y0 + by);
			plot(x0 + by, y0 + bx);
			plot(x0 - bx, y0 + by);
			plot(x0 - by, y0 + bx);
			plot(x0 + bx, y0 - by);
			plot(x0 + by, y0 - bx);
			plot(x0 - bx, y0 - by);
			plot(x0 - by, y0 - bx);
		}
		by--;
		d += 1 + 2 * by;
		if (1 + 2 * (d - bx) > 0) {
			bx--;
			d += 1 - 2 * bx;
		}
	} while (bx > by);
};

// TODO: copy the above function but use lines to plot instead
Jimp.prototype.fillCircle = Jimp.prototype.circleFill = function fillCircle(color, x0 = 0, y0 = 0, radius = 100) {
	x0=x0|0;y0=y0|0;radius=radius|0;
	
	let bx = radius, by = 0, d = 0, err;
	do {
		this.drawScanX(x0 - bx, y0 + by, x0 + bx);
		this.drawScanX(x0 - bx, y0 - by, x0 + bx);
		this.drawScanX(x0 - by, y0 + bx, x0 + by);
		this.drawScanX(x0 - by, y0 - bx, x0 + by);
		by--;
		d += 1 + 2 * by;
		if (1 + 2 * (d - bx) > 0) {
			bx--;
			d += 1 - 2 * bx;
		}
	} while (bx > by);
};

// http://www-users.mat.uni.torun.pl/~wrona/3d_tutor/tri_fillers.html
Jimp.prototype.fillTriangle = Jimp.prototype.triFill = function fillTriangle(x0, y0, x1, y1, x2, y2, color = 0x000000FF) {
	x0=x0|0;y0=y0|0;x1=x1|0;y1=y1|0;x2=x2|0;y2=y2|0;
	let [start, mid, end] = [[x0,y0],[x1,y1],[x2,y2]].sort((p0,p1) => p0[1] > p1[1] ? 1 : p0[1] < p1[1] ? -1 : 0);
	if (start[1] == mid[1] && start[1] == end[1]) return this.drawScanX(start[0], start[1], end[0], color);
	if (start[0] == mid[0] && start[0] == end[0]) return this.drawScanY(start[0], start[1], end[1], color);
	let startToEnd = [end[0] - start[0], end[1] - start[1]];
	let startToMid = [mid[0] - start[0], mid[1] - start[1]];
	let midToEnd   = [end[0] - mid[0],   end[1] - mid[1]];
	let dx0 = startToEnd[0] / startToEnd[1];
	let dx1 = startToMid[0] / startToMid[1];
	let dx2 = midToEnd[0]   / midToEnd[1];
	let x = start[0], y = start[1], z = x;
	while (y < mid[1]) this.drawScanX(x,y,z,color), x += dx0, y++, z += dx1;
	x = startToEnd[0] + dx0 * startToMid[1], y = mid[1], z = mid[0];
	while (y < end[1]) this.drawScanX(x,y,z,color), x += dx0, y++, z += dx2;
	return this;
};

Jimp.prototype.drawPath = function drawPath(path = new Path(), color = 0x000000FF, AA = false) {
	let start = path.getPoint(0), next;
	let step  = path.smoothing == 'linear' ? 1 : path.step;
	for (let t = 0; t < path.degree || (t == path.degree && path.closed); t += step) {
		next = path.getPos(t);
		this.drawLine(start[0], start[1], next[0], next[1], color, AA);
		start = next;
	}
	return this;
};

// https://stackoverflow.com/questions/25964313/algorithm-to-fill-in-a-closed-2d-curve
Jimp.prototype.fillPath = function fillPath(path = new Path(), color = 0x000000FF) {
	let edges = [], intersects, e;
	let p0 = path.getPoint(0), p1, min = p0[1], max = p0[1], dx, dy;
	let step  = path.smoothing == 'linear' ? 1 : path.step;
	for (let t = 0; t < path.degree || (t < (path.degree + 1) && path.closed); t += step) {
		p1 = path.getPos(t);
		if (p1[1] < min) {
			min = p1[1];
		}
		if (p1[1] > max) {
			max = p1[1];
		}
		dx = p1[0]-p0[0];
		dy = p1[1]-p0[1];
		edges.push([p0,p1,dx,dy]);
		p0 = p1;
	}
	
	// perform scanline rastering
	for (let y = min; y < max; y++) {
		
		// find the edges that the scanline intersects
		for (intersects = [], e = 0; e < edges.length; e++) {
			[p0,p1,dx,dy] = edges[e];
			if ((p0[1] <= y && y < p1[1]) || (p1[1] <= y && y < p0[1])) {
				if (dy == 0) {
					// handle flat line case
					intersects.push(p0[0]);
					intersects.push(p1[0]);
				} else {
					// calculate the intersection with the edge
					intersects.push(p0[0] + (y - p0[1]) * dx / dy);
				}
			}
		}
		
		// sort the x-intersects
		intersects = intersects.sort();
		
		// draw scanlines between pairs of intersects; any odd amount will be ignored
		for (e = 0; e < intersects.length - 1; e += 2) {
			this.drawScanX(intersects[e], y, intersects[e+1], color);
		}
	}
	
	/*
	this.drawPath(path, color);
	let center = [0,0];
	for (let p of path.points) {
		center[0] += p[0];
		center[1] += p[1];
	}
	center[0] /= path.degree;
	center[1] /= path.degree;
	this.bucket(center[0], center[1], color);
	*/
	
	return this;
};

function interp(a0, a1, w) {
	return a0 + (a1 - a0) * w;
}

class Path {
	constructor(dataPoints = [], smoothing = 'linear', closed = false, step = 0.1) {
		this.points    = dataPoints;
		this.smoothing = smoothing;
		this.closed    = closed;
		this.step      = step;
	}
	get degree() {
		return this.points.length;
	}
	get center() {
		let center = [0,0];
		for (let p of this.points) {
			center[0] += p[0];
			center[1] += p[1];
		}
		center[0] /= this.points.length;
		center[1] /= this.points.length;
		return center;
	}
	addPoint(x,y) {
		if (typeof(x) === 'object') {
			if (x.length == 2) {
				[x,y] = x;
			} else {
				({x,y} = x);
			}
		}
		this.points.push([x,y]);
		return this;
	}
	removePoint(x,y) {
		if (typeof(x) === 'object') {
			({x,y} = x);
		}
		if (typeof(y) === 'number') {
			for (let i = 0; i < this.points.length; i++) {
				if (this.points[i][0] == x && this.points[i][1] == y) {
					x = i;
					break;
				}
			}
		}
		return this.points.splice(x,1);
	}
	closePath() {
		this.closed = true;
	}
	getPoint(offset = 0) {
		return this.points[Math.floor(offset) % this.points.length];
	}
	getPos(t = 0) {
		switch (this.smoothing) {
			case 'linear':
				return this.getLinearPos(t);
			case 'bezier':
				return this.getBezierPos(t);
			case 'smooth':
				return this.getSmoothPos(t);
			default:
				return this.getPoint(t);
		}
	}
	getLinearPos(offset = 0, t = 0) {
		let p0 = this.getPoint(offset);
		let p1 = this.getPoint(offset + 1);
		t = (offset + t) % 1;
		return [
			interp(p0[0],p1[0],t),
			interp(p0[1],p1[1],t)
		];
	}
	getBezierPos(t = 0) {
		t = t % 1;
		let points = this.points.slice();
		while (points.length > 1) {
			for (let o = 0; o < points.length - 1; o++) {
				points[o][0] = interp(points[o][0],points[o+1][0],t);
				points[o][1] = interp(points[o][1],points[o+1][1],t);
			}
			points.pop();
		}
		return points[0];
	}
	getSmoothPos(offset = 0, t = 0) {
		let len = this.points.length, p0, p1, d0, d1;
		if (!this._dirs) {
			// calculate initial spline vectors
			let dirs = this._dirs = this.points.map((p0,i) => {
				let p1 = this.getPoint(i+1);
				return [p1[0] - p0[0], p1[1] - p0[1]];
			});
			
			// correctively smooth the directions
			do {
				for (let i = len - 1, j; i > 0; i--) {
					j  = (i+1) % len;
					dirs[i][0] -= dirs[j][0] / 2;
					dirs[i][1] -= dirs[j][1] / 2;
				}
				// TODO: determine a break condition
				break;
			} while (true);
		}
		
		// perform cubic spline interpolation
		p0 = this.getPoint(offset);
		p1 = this.getPoint(offset + 1);
		d0 = this._dirs[Math.floor(offset) % len];
		d1 = this._dirs[Math.floor(offset+1) % len];
		t = (offset + t) % 1;
		return [
			interp(p0[0] + t * d0[0], p1[0] - (1 - t) * d1[0], t),
			interp(p0[1] + t * d0[1], p1[1] - (1 - t) * d1[1], t)
		];
	}
}

class PixelNode {
	constructor(color) {
		this.color = color;
		this.rgba  = Jimp.intToRGBA(color); // RGBA object
		this.left  = null;
		this.right = null;
		this.up    = null;
		this.down  = null;
	}
	get energy() {
		return Math.abs(this.gx) + Math.abs(this.gy);
	}
	// https://en.wikipedia.org/wiki/Image_gradient#Math
	get gx() {
		let g = 0;
		if (this.left instanceof PixelNode) {
			g -= Jimp.colorDiff(this.rgba, this.left.rgba);
		}
		if (this.right instanceof PixelNode) {
			g += Jimp.colorDiff(this.rgba, this.right.rgba);
		}
		return g;
	}
	get gy() {
		let g = 0;
		if (this.up instanceof PixelNode) {
			g -= Jimp.colorDiff(this.rgba, this.up.rgba);
		}
		if(this.down instanceof PixelNode) {
			g += Jimp.colorDiff(this.rgba, this.down.rgba);
		}
		return g;
	}
	pushX(newUpNode = null) {
		let copy = this.copy();
		if (this.right) {
			this.right.left = copy;
		}
		this.right = copy;
		copy.left = this;
		copy.down = null;
		if (newUpNode) {
			copy.up = newUpNode;
		}
		return copy;
	}
	pushY(newLeftNode = null) {
		let copy = this.copy();
		if (this.down) {
			this.down.up = copy;
		}
		this.down = copy;
		copy.up = this;
		copy.right = null;
		if (newLeftNode) {
			copy.left = newLeftNode;
		}
		return copy;
	}
	popX() {
		if (this.left) this.left.right = this.right;
		if (this.right) this.right.left = this.left;
		return this;
	}
	popY() {
		if (this.up) this.up.down = this.down;
		if (this.down) this.down.up = this.up;
		return this;
	}
	copy() {
		let copy = new PixelNode(this.color);
		copy.left = this.left;
		copy.right = this.right;
		copy.up = this.up;
		copy.down = this.down;
		return copy;
	}
}

/**
 * SeamNode - a PixelNode link in a LinkedList
 * The seam itself is referenced by the first node itself
 * @class
 */
class SeamNode {
	constructor(start) {
		this.pixel = start;
		this.next = null;
		this._energy = 0;
	}
	get energy() {
		if (typeof(this._energy) == 'undefined') {
			this._energy = this.pixel.energy;
			if (this.next) {
				this._energy += this.next.energy;
			}
		}
		return this._energy;
	}
	// link the pixel back to the seam
	linkX() {
		this.pixel.up = this;
		this.down = this.pixel;
	}
	// link the pixel back to the seam
	linkY() {
		this.pixel.left = this;
		this.right = this.pixel;
	}
	// Propagate "pushing" a column
	pushX(c) {
		c = this.pixel.pushX(c);
		if (this.next) {
			this.next.pushX(c);
		}
		return c;
	}
	// Propagate "pushing" a row
	pushY(c) {
		c = this.pixel.pushY(c);
		if (this.next) {
			this.next.pushY(c);
		}
		return c;
	}
	// Propagate "popping" a column
	popX() {
		this.pixel.popX();
		if (this.next) {
			this.next.popX();
		}
	}
	// Propagate "popping" a row
	popY() {
		this.pixel.popY();
		if (this.next) {
			this.next.popY();
		}
	}
}

// https://en.wikipedia.org/wiki/Seam_carving
// https://web.archive.org/web/20110707030836/http://vmcl.xjtu.edu.cn/Real-Time%20Content-Aware%20Image%20Resizing.files/real_time_content_aware_image_resizing.pdf
// This algorithm uses an optimized version that can only rescale in one dimension at a time
Jimp.prototype.liquid_rescale = function liquid_rescale(width, height, delta_x = 1, delta_y = 1) {
	width = width|0;
	height = height|0;
	
	let ow = this.bitmap.width;
	let oh = this.bitmap.height;

	// setup a 4-connection pixel node grid
	// this will come in handy as an extremely easy way to insert and delete rows/columns/seams
	// without the need to specify x and y, however it is costly for memory
	console.log('Magik: making pixel array...');
	let pixels = new Array(ow * oh);
	this.scan(0, 0, ow, oh, (x,y,i) => {
		i = y * ow + x;
		pixels[i] = new PixelNode(this.getPixelColor(x,y));
		if (x > 0) {
			pixels[i].left = pixels[i-1];
			pixels[i-1].right = pixels[i];
		}
		if (y > 0) {
			pixels[i].up = pixels[i-ow];
			pixels[i-ow].down = pixels[i];
		}
	});

	console.log('Magik: calculating seams...');

	// calculate seams based on energy
	let seamsX = Array.range(0, ow-1).map(x => {
		let seam = new SeamNode(pixels[x]);
		seam.linkX();

		let node = seam;
		let pixel;
		for (let y = 1; y < oh; y++) {
			pixel = node.pixel;
			pixel = [pixel.down,pixel.down.left,pixel.down.right].filter(_ => _ instanceof PixelNode).sort((p1,p2) => {
				let e1 = pixel.energy + p1.energy;
				let e2 = pixel.energy + p2.energy;
				return e1 > e2 ? 1 : e1 < e2 ? -1 : 0;
			})[0];
			node = node.next = new SeamNode(pixel);
		}
		return seam;
	});
	let seamsY = Array.range(0, oh-1).map(y => {
		let seam = new SeamNode(pixels[y * ow]);
		seam.linkY();

		let node = seam;
		let pixel;
		for (let x = 1; x < ow; x++) {
			pixel = node.pixel;
			pixel = [pixel.right,pixel.right.up,pixel.right.down].filter(_ => _ instanceof PixelNode).sort((p1,p2) => {
				let e1 = pixel.energy + p1.energy;
				let e2 = pixel.energy + p2.energy;
				return e1 > e2 ? 1 : e1 < e2 ? -1 : 0;
			})[0];
			node = node.next = new SeamNode(pixel);
		}
		return seam;
	});

	console.log('Magik: inserting/deleting seams...');
	
	// delete or insert seams where the total energy is lowest
	while (seamsX.length != width) {
		let lowestEnergy = Infinity;
		let lowestEnergySeam = null;
		let lowestEnergyIdx = -1;
		seamsX.forEach((seam,i) => {
			if (seam.energy < lowestEnergy) {
				lowestEnergy = seam.energy;
				lowestEnergySeam = seam;
				lowestEnergyIdx = i;
			}
		});
		if (seamsX.length < width) {
			// if rescaling bigger, insert seams of the lowest energies
			let head = lowestEnergySeam.pushX();
			let seam = new SeamNode(head);
			seam.linkX();
			seamsX.splice(lowestEnergyIdx+1, 0, seam);
		} else {
			// if rescaling smaller, remove the seams of the lowest energies
			lowestEnergySeam.popX();
			seamsX.splice(lowestEnergyIdx, 1);
		}
	}
	while (seamsY.length != height) {
		let lowestEnergy     = Infinity;
		let lowestEnergySeam = null;
		let lowestEnergyIdx  = -1;
		seamsY.forEach((seam,i) => {
			if (seam.energy < lowestEnergy) {
				lowestEnergy = seam.energy;
				lowestEnergySeam = seam;
				lowestEnergyIdx = i;
			}
		});
		if (seamsY.length < height) {
			// if rescaling bigger, insert seams of the lowest energies
			let head = lowestEnergySeam.pushY();
			let seam = new SeamNode(head);
			seam.linkY();
			seamsY.splice(lowestEnergyIdx+1, 0, seam);
		} else {
			// if rescaling smaller, remove the seams of the lowest energies
			lowestEnergySeam.popY();
			seamsY.splice(lowestEnergyIdx, 1);
		}
	}

	console.log('Magik: Rendering output...');

	// output the new image using the seam heads and linear chain of pixels
	let output = new Jimp(width, height), x, y, pixel;
	try {
		for (y = 0; y < height; y++) {
			pixel = seamsY[y].pixel;
			for (x = 0; x < width; x++) {
				output.setPixelColor(pixel.color, x, y);
				pixel = pixel.right;
			}
		}
	} catch (e) {
		console.error(x,y,e);
	}

	return output;
};

Jimp.prototype.magik = function magik() {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	return this.liquid_rescale(0.5 * w, 0.5 * h, 1, 1)
	           .liquid_rescale(1.0 * w, 1.0 * h, 1, 1);
};

module.exports = {Jimp,Path};
