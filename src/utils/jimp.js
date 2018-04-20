const Jimp    = require('jimp');
const Promise = require('bluebird');

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

module.exports = {Jimp};
