const Jimp     = require('jimp');
const {random} = require('./random');
const {Color}  = require('./Color');
const {Array}  = require('./Array');
const {Path,Point,Polygon} = require('./2d');
const {ThreeDee,ThreeDeeUtils} = require('./3d');

const TAU = Math.TAU;
const TRANSPARENT = new Color(0,0,0,0);

function DEBUG({callee,data}) {
	console.log('An unexpected infinite loop occurred in ' + callee.name);
	for (let key in data) {
		console.log('Data "' + key + '": ' + JSON.stringify(data[key]));
	}
	process.exit(1);
}

// https://github.com/oliver-moran/jimp/issues/90
// update 8/4/2018:
// this was implemented in https://github.com/oliver-moran/jimp/blob/ba15d12ba6bf4f395a238ba387ef6e61a80db22c/src/index.js#L672
//Jimp.prototype.getBufferAsync = require('bluebird').promisify(Jimp.prototype.getBuffer);

Jimp.prototype.getBufferAs = async function (filename) {
	var mime = /\.png$/i.test(filename) ? Jimp.MIME_PNG : Jimp.MIME_JPEG;
	file = await this.getBufferAsync(mime);
	return {file, filename};
};

Jimp.prototype.toDataURL = async function (mime = Jimp.MIME_PNG) {
	var buffer = await this.getBufferAsync(mime);
	return `data:image/${mime==Jimp.MIME_PNG?'png':mime==Jimp.MIME_JPEG?'jpeg':'gif'};base64,${buffer.toString('base64')}`;
};

Jimp.readAsDataURL = function (dataURL) {
	var [,type,inBase64,data] = dataURL.match(/^(?:data:)?(image\/(?:png|jpe?g|gif))?;?(base64)?,?(.+)$/);
	if (!type) {
		throw new Error('Invalid image MIME type');
	}
	//console.log(type,inBase64,data.length);
	return Jimp.read(Buffer.from(data, inBase64));
};

Jimp.hashDistance = function hashDistance(h1, h2) {
	let sum = 0;
	for (let i = 0; i < h1.length; i++) {
		if (h1[i] != h2[i]) sum++;
	}
	return sum / h1.length;
};

// This annoys me
Jimp.prototype.rescale = Jimp.prototype.scale;

// Intercept pixel getter/setter to use Color class instead
let _getPixelColor = Jimp.prototype.getPixelColor;
let _setPixelColor = Jimp.prototype.setPixelColor;
Jimp.prototype.getPixelColor = function (x, y, o) {
	var c = _getPixelColor.call(this, x, y);
	if (o) c = new Color(c);
	return c;
};
Jimp.prototype.setPixelColor = function (c, x, y) {
	if (typeof(c) === 'object') {
		if (c instanceof Color) {
			c = c.rgba;
		} else {
			c = Jimp.RgbaToInt(c.r, c.g, c.b, c.a);
		}
	}
	return _setPixelColor.call(this, c, x, y);
};
Jimp.prototype.addPixelColor = function (c, x, y) {
	this.setPixelColor(this.getPixelColor(x,y,true).add(c), x, y);
};
Jimp.prototype.mixPixelColor = function (c, x, y, t = 0.5) {
	this.setPixelColor(this.getPixelColor(x,y,true).interp(c, t), x, y);
};

Jimp.prototype.removeTransparency = function () {
	this.scan(0,0,this.bitmap.width,this.bitmap.height,(x,y,i) => {
		this.bitmap.data[i+3] = 0xFF;
	});
	return this;
};

/*
// Jimp is broken ;-;
Jimp.measureText = function measureText(font, text) {
	let canvas = new Jimp(1000, 128, 0xFFFFFFFF);
	canvas.print(font, 0, 0, String(text), 1000, 128).autocrop();
	return canvas.bitmap.width;
};
*/

// Monkeypatch for alignment bug
let _print = Jimp.prototype.print;
/*
Jimp.prototype.print = function print(font, x, y, text, width, height) {
	let alignmentX = Jimp.HORIZONTAL_ALIGN_CENTER;
	let alignmentY = Jimp.HORIZONTAL_ALIGN_MIDDLE;
	if (typeof(text) === 'object') {
		({text,alignmentX,alignmentY} = text);
	}
	let textWidth  = Jimp.measureText(font, text);
	let textHeight = Jimp.measureTextHeight(font, text, width);
	
	if (isFinite(width) && width > 0) {
		switch (alignmentX) {
			case Jimp.HORIZONTAL_ALIGN_RIGHT:
				x += width - textWidth;
				break;
			case Jimp.HORIZONTAL_ALIGN_CENTER:
				x += (width - textWidth) / 2;
				break;
			case Jimp.HORIZONTAL_ALIGN_LEFT:
			default:
				break;
		}
	}
	if (isFinite(height) && height > 0) {
		switch (alignmentY) {
			case Jimp.VERTICAL_ALIGN_BOTTOM:
				y += height - textHeight;
				break;
			case Jimp.VERTICAL_ALIGN_MIDDLE:
				y += (height - textHeight) / 2;
			case Jimp.VERTICAL_ALIGN_TOP:
			default:
				break;
		}
	}
	
	return _print.call(this, font, x|0, y|0, text, width, height);
};
*/

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
	.quantize(random(4,15))
	.quality(random(1,20));
};

Jimp.prototype.pixelate = function (pixels = 32) {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	if (pixels <= Math.min(w,h)) {
		return this.resize(pixels, Jimp.AUTO).resize(w, h, Jimp.RESIZE_NEAREST_NEIGHBOR);
	} else {
		return this.resize(pixels, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
	}
};

Jimp.prototype.glitchify = function glitchify(glitchAmount = 10) {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	let gx, gy, gw, gh, ox, oy;
	while (glitchAmount-- > 0) {
		gx = random(0, w);
		gy = random(0, h);
		gw = random(10, w);
		gh = random(10, h);
		ox = random(-4, 4);
		oy = random(-4, 4);
		this.blip(this,gx+ox,gy+oy,gw,gh,gx,gy);
	}
	return this;
};

Jimp.prototype.aberrate = function aberrate(ax = 10, ay = 0) {
	return this.map((color,x,y) => {
		color.r = this.getPixelColor(x-ax,y-ay,true).r;
		color.b = this.getPixelColor(x+ax,y+ay,true).b;
		return color;
	});
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
	let x0 = x | 0,
		y0 = y | 0,
		x1 = x0 + 1,
		y1 = y0 + 1;
	if (x0 < x || y0 < y) {
		let colors = [
			this.getPixelColor(x0, y0, true),
			this.getPixelColor(x1, y0, true),
			this.getPixelColor(x0, y1, true),
			this.getPixelColor(x1, y1, true)
		];
		// linear anti-aliasing
		return  colors[0].interp(colors[1], x - x0)
		.interp(colors[2].interp(colors[3], x - x0), y - y0);
	} else {
		return this.getPixelColor(x0, y0);
	}
};

Jimp.prototype.fill = function fill(color, ox = 0, oy = 0, width = this.bitmap.width, height = this.bitmap.height) {
	return this.scan(ox, oy, width, height, (x, y) => {
		this.setPixelColor(color, x, y);
	});
};

Jimp.prototype.bucket = function bucket(newColor, ox = 0, oy = 0, tolerance = 0.001) {
	let jimp = this;
	
	let color1 = jimp.getPixelColor(ox, oy, true);
	
	b(ox, oy);
	return this;
	
	function b(x, y) {
		if (x < 0 || x >= jimp.bitmap.width || y < 0 || y > jimp.bitmap.height) return;
		
		let color2 = jimp.getPixelColor(x, y, true);
		if (color2.equals(newColor)) return;
		
		if (Jimp.colorDiff(color1,color2) > tolerance) return;
		
		jimp.setPixelColor(newColor, x, y);
		b(x+1,y),b(x-1,y),b(x,y+1),b(x,y-1);
	}
};

Jimp.prototype.map = function map(M) {
	let clone = this.clone();
	this.scan(0, 0, this.bitmap.width, this.bitmap.height, (x,y,i)	=> {
		clone.setPixelColor(M(this.getPixelColor(x, y, true), x, y, i, this), x, y);
	});
	return clone;
};

Jimp.prototype.transform = function transform(T) {
	let w = this.bitmap.width, h = this.bitmap.height;
	return this.map((color,x,y,i,img) => {
		// transform x and y
		({x,y} = T(x,y,i,color));
		if (x < 0 || x > w || y < 0 || y > h) {
			return TRANSPARENT;
		} else {
			return this.getAAPixelColor(x,y);
		}
	});
};

Jimp.prototype.differentialBlur = function differentialBlur(D) {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	let d = Math.hypot(w,h); // diagonal
	return this.map((color,x,y) => {
		// get the differential at the x and y
		let {dx,dy} = D(x,y);
		
		// find its scalar value
		let dist = Math.hypot(dx, dy);
		if (isFinite(dist)) {
			// normalize the stepping values
			dx /= dist;
			dy /= dist;
			
			// calculate the starting point and the line length
			let count = 1, step = 0, max = Math.min(dist, d);
			
			// start at one end of the slope line
			let tx = x - dx * max / 2;
			let ty = y - dy * max / 2;
			
			for (let color2; step < max; ++step) {
				if (tx < 0 || tx > w || ty < 0 || ty > h) {
					// skip out of bounds
				} else {
					color2 = this.getPixelColor(tx|0, ty|0, true);
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
		}
		return color;
	});
};

Jimp.prototype.directionalBlur = function directionalBlur(dx, dy) {
	return this.differentialBlur(() => ({dx,dy}));
};

Jimp.prototype.circularBlur = function circularBlur(strengthX = 100, strengthY = 100, ox, oy) {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	ox = ox === undefined ? w / 2 : ox;
	oy = oy === undefined ? h / 2 : oy;
	return this.differentialBlur((x,y) => ({
		dx: strengthX * (oy - y) / h,
		dy: strengthY * (x - ox) / w
	}));
};

Jimp.prototype.radialBlur = function radialBlur(strength = 100, ox, oy) {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	ox = ox === undefined ? w / 2 : ox;
	oy = oy === undefined ? h / 2 : oy;
	return this.differentialBlur((x,y) => ({
			dx: strength * (x - ox) / w,
			dy: strength * (y - oy) / h
	}));
};

Jimp.prototype.explode = Jimp.prototype.fisheye = function fisheye(strength = 100, ox, oy) {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	ox = ox === undefined ? w / 2 : ox;
	oy = oy === undefined ? h / 2 : oy;
	return this.transform((x,y) => {
		let dx = ox - x;
		let dy = oy - y;
		let dd = Math.hypot(dx, dy);
		dd = Math.exp(-(dd*dd)/(strength*strength));
		dx *= dd;
		dy *= dd;
		x += dx;
		y += dy;
		return {x,y};
	});
};

Jimp.prototype.implode = function implode(strength = 100, ox, oy) {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	ox = ox === undefined ? w / 2 : ox;
	oy = oy === undefined ? h / 2 : oy;
	return this.transform((x,y) => {
		let dx = ox - x;
		let dy = oy - y;
		let dd = Math.hypot(dx, dy);
		dd = Math.exp(-(dd*dd)/(strength*strength));
		dx *= dd;
		dy *= dd;
		x -= dx;
		y -= dy;
		return {x,y};
	});
};

Jimp.prototype.swirl = function swirl(strength, radius, ox, oy) {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	ox = ox === undefined ? w / 2 : ox;
	oy = oy === undefined ? h / 2 : oy;
	radius = radius === undefined ? Math.log(2) * Math.min(w,h) / 5 : radius;
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

Jimp.prototype.tilt = function tilt(angle = Math.PI/6) {
	let w = this.bitmap.width;
	let h = this.bitmap.height;
	let ox = w / 2;
	let oy = h / 2;
	return this.transform((x,y) => {
		var dx = x - ox;
		var dy = y - oy;
		var z = h / (h - dy * Math.sin(angle));
		x = ox + dx * z;
		y = oy + dy * Math.cos(angle) * z;
		return {x,y};
	});
};

Jimp.prototype.posterize = function posterize(palette) {
	palette = palette.map(c => c instanceof Color ? c : new Color(c));
	return this.map(color => {
		let nearestColor = palette[0], nearestDistance = 5, dist;
		for (let nodeColor of palette) {
			dist = color.manhattan(nodeColor);
			if (dist < nearestDistance) {
				nearestDistance = dist;
				nearestColor = nodeColor;
			}
		}
		//console.log('Distance from ' + color.toString() + ' to ' + nearestColor.toString() + ': ' + nearestDistance);
		return nearestColor;
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
	color = new Color(color);
	
	if (y0 == y1) {
		return this.drawScanX(x0, y0, x1, color);
	}
	if (x0 == x1) {
		return this.drawScanY(x0, y0, y1, color);
	}
	
	let jimp = this;
	function plot(x,y) {
		jimp.setPixelColor(color, x, y);
	}
	function blend(x,y,t) {
		jimp.mixPixelColor(color, x, y, t);
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
// draws pixels from a texture (current affine)
Jimp.prototype.textureScanX = function (xyuv0,xyuv1,texture,perspective=false) {
	if (xyuv0[1] < 0 || xyuv0[1] > this.bitmap.height-1) return this;
	if (xyuv0[0] > xyuv1[0]) [xyuv0,xyuv1] = [xyuv1,xyuv0];
	if (xyuv1[0] < 0 || xyuv0[0] > this.bitmap.width-1) return this;
	let width = texture.bitmap.width, height = texture.bitmap.height;
	let dx = (xyuv1[0] - xyuv0[0]);
	let du = (xyuv1[2] - xyuv0[2]) / dx;
	let dv = (xyuv1[3] - xyuv0[3]) / dx;
	let dw = (xyuv1[4] - xyuv0[4]) / dx;
	let [x,y,u,v,w] = xyuv0, xend = Math.min(xyuv1[0]|0,this.bitmap.width-1);
	if (x < 0) {
		u += du * -x;
		v += dv * -x;
		w += dw * -x;
		x = 0;
	} else {
		x = x | 0;
	}
	if (!perspective) {
		w  = 1;
		dw = 0;
	}
	while (x <= xend) {
		this.setPixelColor(texture.getAAPixelColor(width * u/w, height * v/w),x,y);
		x += 1; u += du; v += dv; w += dw;
	}
	return this;
};
Jimp.prototype.textureScanY = function (xyuv0,xyuv1,texture) {
	if (xyuv0[0] < 0 || xyuv0[0] > this.bitmap.width-1) return this;
	if (xyuv0[1] > xyuv1[1]) [xyuv0,xyuv1] = [xyuv1,xyuv0];
	if (xyuv1[1] < 0 || xyuv0[1] > this.bitmap.height-1) return this;
	let width = texture.bitmap.width, height = texture.bitmap.height;
	let dy = (xyuv1[1] - xyuv0[1]);
	let du = (xyuv1[2] - xyuv0[2]) / dy;
	let dv = (xyuv1[3] - xyuv0[3]) / dy;
	let dw = (xyuv1[4] - xyuv0[4]) / dy;
	let [x,y,u,v,w] = xyuv0, yend = Math.min(xyuv1[1]|0,this.bitmap.height-1);
	if (y < 0) {
		u += du * -y;
		v += dv * -y;
		w += dw * -y;
		y = 0;
	} else {
		y = y | 0;
	}
	if (!perspective) {
		w = 1;
		dw = 0;
	}
	while (y <= yend) {
		this.setPixelColor(texture.getAAPixelColor(width*u/w,height*v/w),x,y);
		y += 1; u += du; v += dv; w += dw;
	}
	return this;
};

// https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
// Need to find Wu algorithm to provide correct anti-aliasing
Jimp.prototype.drawCircle = function drawCircle(x0, y0, radius, color = 0x000000FF, AA = false) {
	x0=x0|0;y0=y0|0;radius=radius|0;
	color = new Color(color);
	
	let jimp = this;
	function plot(x,y) {
		jimp.setPixelColor(color, x, y);
	}
	function blend(x,y,t) {
		jimp.mixPixelColor(color, x, y, t);
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

Jimp.prototype.fillCircle = Jimp.prototype.circleFill = function fillCircle(color, x0 = 0, y0 = 0, radius = 100) {
	x0=x0|0;y0=y0|0;radius=radius|0;
	
	let bx = radius, by = 0, d = 0, err;
	do {
		this.drawScanX(x0 - bx, y0 + by, x0 + bx, color);
		this.drawScanX(x0 - bx, y0 - by, x0 + bx, color);
		this.drawScanX(x0 - by, y0 + bx, x0 + by, color);
		this.drawScanX(x0 - by, y0 - bx, x0 + by, color);
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
	let [start, mid, end] = [[x0,y0],[x1,y1],[x2,y2]].sort((p0,p1) => p0[1] > p1[1] ? 1 : p0[1] < p1[1] ? -1 : p0[0] > p1[0] ? 1 : 0);
	if (start[1] == mid[1] && start[1] == end[1]) return this.drawScanX(start[0], start[1], end[0], color);
	if (start[0] == mid[0] && start[0] == end[0]) return this.drawScanY(start[0], start[1], end[1], color);
	let startToEnd = ThreeDeeUtils.sub(end,start);
	let startToMid = ThreeDeeUtils.sub(mid,start);
	let midToEnd   = ThreeDeeUtils.sub(end,mid);
	let dx0 = startToEnd[0] / startToEnd[1];
	let dx1 = startToMid[0] / startToMid[1];
	let dx2 = midToEnd[0]   / midToEnd[1];
	let xstart = start[0], y = start[1], xend = xstart, xmid = xstart + dx0 * startToMid[1];
	while (y < mid[1]) {
		this.drawScanX(xstart,y++,xend,color);
		xstart += dx0;
		xend   += dx1;
	}
	xstart = xmid;
	xend   = mid[0];
	while (y < end[1]) {
		this.drawScanX(xstart,y++,xend,color);
		xstart += dx0;
		xend   += dx2;
	}
	return this;
};

/**
 * Render textured triangles onto this bitmap using another bitmap as a texture.
 * @param {Object|Array} geometry  - descriptor of geometric object which can be a list of tris containing vertex and UV data or an object with the following keys:
 * @param {Array} [geometry.verts] - a list of vert coordinates
 * @param {Array} [geometry.uvs]   - a list of UV texture coordinates
 * @param {Array} [geometry.tris]  - a list of tris by their vertex indices in the verts array.
 * @param {Jimp}  texture          - the Jimp bitmap to use for texturing
 */
Jimp.prototype.renderTris = function renderTris(geometry, texture) {
	if (typeof(geometry) === 'object' && !(geometry instanceof Array)) {
		geometry = geometry.tris.map(tri => [
			tri[0].map(i => geometry.verts[i]),
			tri[1].map(i => geometry.uvs[i])
		]);
	}
	for (let tri of geometry) {
		let [verts,uvs] = tri;
		let [vert0,vert1,vert2] = verts;
		if (uvs) {
			let [uv0,uv1,uv2] = uvs;
			if (uv0.length === 3) {
				this.textureTriangle(vert0[0],vert0[1],vert1[0],vert1[1],vert2[0],vert2[1],texture,uv0[0],uv0[1],uv1[0],uv1[1],uv2[0],uv2[1],true,uv0[2],uv1[2],uv2[2]);
			} else {
				this.textureTriangle(vert0[0],vert0[1],vert1[0],vert1[1],vert2[0],vert2[1],texture,uv0[0],uv0[1],uv1[0],uv1[1],uv2[0],uv2[1]);
			}
			
		} else {
			this.fillTriangle(vert0[0],vert0[1],vert1[0],vert1[1],vert2[0],vert2[1]);
		}
	}
	return this;
};

// Draw a textured triangle on this bitmap using another bitmap.
Jimp.prototype.textureTriangle = function textureTriangle(x0,y0,x1,y1,x2,y2,texture,u0,v0,u1,v1,u2,v2,perspective=false,w0=1,w1=1,w2=1) {
	/* this is broke ;-;
	switch (arguments.length) {
		case 2:
			[[[[x0,y0],[x1,y1],[x2,y2]], [[u0,v0],[u1,v1],[u2,v2]]], texture] = arguments;
			break;
		case 3:
			[[[x0,y0],[x1,y1],[x2,y2]], [[u0,v0],[u1,v1],[u2,v2]], texture] = arguments;
			break;
		case 4:
			[[[x0,y0],[u0,v0]], [[x1,y1],[u0,v0]], [[x2,y2],[u2,v2]], texture] = arguments;
			break;
		case 7:
			[[x0,y0], [x1,y1], [x2,y2], texture, [u0,v0], [u1,v1], [u2,v2]] = arguments;
			break;
	}
	*/
	x0=x0|0;y0=y0|0;x1=x1|0;y1=y1|0;x2=x2|0;y2=y2|0;
	let [start, mid, end] = [[x0,y0,u0,v0,w0],[x1,y1,u1,v1,w1],[x2,y2,u2,v2,w2]].sort((p0,p1) => 
		p0[1] > p1[1] ? 1 : p0[1] < p1[1] ? -1 : 
		p0[0] > p1[0] ? 1 : p0[0] < p1[0] ? -1 : 0);
	if (start[1] == mid[1] && start[1] == end[1]) return this.textureScanX(start, end, texture, perspective);
	if (start[0] == mid[0] && start[0] == end[0]) return this.textureScanY(start, end, texture, perspective);
	let startToEnd = ThreeDeeUtils.sub(end,start);
	let startToMid = ThreeDeeUtils.sub(mid,start);
	let midToEnd   = ThreeDeeUtils.sub(end,mid);
	let d0   = ThreeDeeUtils.scale(startToEnd, 1/startToEnd[1]); d0[1]=1;
	let d1   = ThreeDeeUtils.scale(startToMid, 1/startToMid[1]); d1[1]=1;
	let d2   = ThreeDeeUtils.scale(midToEnd,   1/midToEnd[1]);   d2[1]=1;
	let mid2 = ThreeDeeUtils.add(start, ThreeDeeUtils.scale(d0,startToMid[1]));
	let tmp  = start.slice();
	while (start[1] < mid[1]) {
		this.textureScanX(start, tmp, texture, perspective);
		start = ThreeDeeUtils.add(start, d0);
		tmp   = ThreeDeeUtils.add(tmp, d1);
	}
	start = mid2;
	tmp   = mid;
	while (start[1] < end[1]) {
		this.textureScanX(start, tmp, texture, perspective);
		start = ThreeDeeUtils.add(start, d0);
		tmp   = ThreeDeeUtils.add(tmp, d2);
	}
	return this;
};

Jimp.prototype.drawPolygon = Jimp.prototype.drawPoly = function drawPolygon(x0, y0, radius, sides = 3, color = 0x000000FF, AA = false) {
	let path = new Polygon(x0, y0, sides, radius).toPath();
	this.drawPath(new Path(path, 'linear', true, 1), color, AA);
};

Jimp.prototype.fillPolygon = Jimp.prototype.fillPoly = function fillPolygon(x0, y0, radius, sides = 3, color = 0x000000FF) {
	let path = new Polygon(x0, y0, sides, radius).toPath();
	this.fillPath(new Path(path, 'linear', true, 1), color);
};

Jimp.prototype.drawPath = function drawPath(path = new Path(), color = 0x000000FF, AA = false) {
	let start = path.points[0], next;
	let step  = path.smoothing == 'linear' ? 1 : path.step;
	for (let t = 0; t < path.degree || (t == path.degree && path.closed); t += step) {
		next = path.getPos(t);
		this.drawLine(start.x, start.y, next.x, next.y, color, AA);
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
		if (p1.y < min) {
			min = p1.y;
		}
		if (p1.y > max) {
			max = p1.y;
		}
		dx = p1.x-p0.x;
		dy = p1.y-p0.y;
		edges.push([p0,p1,dx,dy]);
		p0 = p1;
	}
	
	// perform scanline rastering
	for (let y = min; y < max; y++) {
		
		// find the edges that the scanline intersects
		for (intersects = [], e = 0; e < edges.length; e++) {
			[p0,p1,dx,dy] = edges[e];
			if ((p0[1] <= y && y < p1.y) || (p1.y <= y && y < p0.y)) {
				if (dy == 0) {
					// handle flat line case
					intersects.push(p0.x);
					intersects.push(p1.x);
				} else {
					// calculate the intersection with the edge
					intersects.push(p0.x + (y - p0.y) * dx / dy);
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
	let center = path.center;
	this.bucket(center.x, center.y, color);
	*/
	
	return this;
};

class PixelNode {
	constructor(color) {
		this.color = color;
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
			g -= Jimp.colorDiff(this.color, this.left.color);
		}
		if (this.right instanceof PixelNode) {
			g += Jimp.colorDiff(this.color, this.right.color);
		}
		return g;
	}
	get gy() {
		let g = 0;
		if (this.up instanceof PixelNode) {
			g -= Jimp.colorDiff(this.color, this.up.color);
		}
		if(this.down instanceof PixelNode) {
			g += Jimp.colorDiff(this.color, this.down.color);
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

module.exports = {Jimp};
