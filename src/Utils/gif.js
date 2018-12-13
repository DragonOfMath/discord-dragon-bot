const {Gif,GifFrame,GifUtil,GifCodec,BitmapImage} = require('gifwrap');
const fs = require('fs');
const path = require('path');
const {Jimp} = require('./jimp');
const {fetch} = require('./fetch');

function copyPixel(f0,i0,f1,i1) {
	f1.bitmap.data.copy(f0.bitmap.data, i0, i1, i1+4);
}
function comparePixels(f0,i0,f1,i1) {
	let equal = true;
	for (let i = 0; i < 4; i++) {
		equal &= f0.bitmap.data[i0+i] == f1.bitmap.data[i1+i];
		if (!equal) break;
	}
	return equal;
}

BitmapImage.prototype.getPixelOffset = GifFrame.prototype.getPixelOffset = function getPixelOffset(x,y) {
	if (x < 0 || x >= this.bitmap.width || y < 0 || y >= this.bitmap.height) {
		return -1;
	}
	return 4 * (y * this.bitmap.width + x);
};

class GIF {
	constructor(...args) {
		this.frames = [];
		this.loop   = 0;
		this.colorScope = 1;
		if (args.length == 1) {
			if (typeof(args[0]) === 'object') {
				this.frames = args[0].frames || [];
				this.loop   = args[0].loop || 0;
				this.colorScope = args[0].colorScope || this.colorScope;
			}
		} if (args.length == 2) {
			if (args[0] instanceof Array) {
				this.frames = args[0];
			}
			if (typeof(args[1]) === 'object') {
				this.loop   = args[1].loop || 0;
				this.colorScope = args[1].colorScope || this.colorScope;
			}
		}
	}
	get width() {
		return this.frames[0].bitmap.width;
	}
	get height() {
		return this.frames[0].bitmap.height;
	}
	quantize(method = 'dekker', ...args) {
		switch (method.toLowerCase()) {
			case 'dekker':
				GifUtil.quantizeDekker(this.frames, ...args);
				break;
			case 'sorokin':
				GifUtil.quantizeSorokin(this.frames, ...args);
				break;
			case 'wu':
				GifUtil.quantizeWu(this.frames, ...args);
				break;
		}
		return this;
	}
	/**
	 * Slows down a gif and emphasizes the individual frames.
	 */
	debug() {
		let width  = this.frames[0].bitmap.width;
		let height = this.frames[0].bitmap.height;
		for (let f = 0, frame, canvas; f < this.frames.length; f++) {
			frame = this.frames[f]; // get frame
			
			//console.log(frame);
			
			// create new canvas with black background
			canvas = new GifFrame(width, height, 0x000000FF, frame);
			canvas.delayCentisecs = 100;
			
			// copy pixels to canvas
			frame.scanAllCoords((x,y,i) => {
				let ci = canvas.getPixelOffset(frame.xOffset + x, frame.yOffset + y);
				copyPixel(canvas,ci,frame,i);
			});
			
			this.frames[f] = canvas; // set frame
		}
		return this;
	}
	/**
	 * Replace the GIF frames with the rendered image at each frame
	 */
	renderAllFrames() {
		let canvas = new GifFrame(this.frames[0]);
		for (let f = 1, frame; f < this.frames.length; f++) {
			frame = this.frames[f];
			
			// apply opaque pixels in frame to canvas
			frame.scanAllCoords((x,y,fi) => {
				if (frame.bitmap.data[fi+3]) {
					// update canvas
					let ci = canvas.getPixelOffset(frame.xOffset + x, frame.yOffset + y);
					copyPixel(canvas,ci,frame,fi);
				}
			});
			
			// copy canvas to frame
			this.frames[f] = new GifFrame(canvas);
		}
		return this;
	}
	optimizeFrames() {
		let optimalFrames = [];
		optimalFrames.push(this.frames[0]);
		for (let f = 1, prev, frame, oFrame, width, height, xMin, xMax, yMin, yMax; f < this.frames.length; f++) {
			prev   = this.frames[f-1];
			frame  = this.frames[f];
			
			width  = frame.bitmap.width;
			height = frame.bitmap.height;
			oFrame = new GifFrame(width, height, 0, frame);
			
			// find the optimal dimensions
			xMin = width;
			xMax = 0;
			yMin = height;
			yMax = 0;
			
			// copy diff pixels to optimal frame
			frame.scanAllCoords((x,y,fi) => {
				let px = prev.xOffset - frame.xOffset + x;
				let py = prev.yOffset - frame.yOffset + y;
				let pi = prev.getPixelOffset(px, py);
				
				if (pi < 0) {
					// current pixel must be opaque
					if (!frame.bitmap.data[fi+3]) return;
				} else {
					// unchanged pixels are ignored
					if (comparePixels(frame,fi,prev,pi)) return;
				}
				
				// when a pixel is copied, update the optimal boundary
				copyPixel(oFrame,fi,frame,fi);
				xMin = Math.min(xMin, x);
				xMax = Math.max(xMax, x);
				yMin = Math.min(yMin, y);
				yMax = Math.max(yMax, y);
			});
			
			// crop the frame to its optimal dimensions
			width  = xMax - xMin;
			height = yMax - yMin;
			//oFrame.xOffset += xMin;
			//oFrame.yOffset += yMin;
			oFrame = oFrame.reframe(xMin, yMin, width, height);
			
			optimalFrames.push(oFrame);
		}
		
		this.frames = optimalFrames;
		return this;
	}
	async getBuffer() {
		let codec = new GifCodec();
		let buffer = await codec.encodeGif(this.frames, this);
		return buffer;
	}
	async write(dest) {
		let buffer = await this.getBuffer();
		return fs.writeFileSync(dest, buffer);
	}
	static async read(src) {
		if (typeof(src) === 'string') {
			if (/^https?:\/\//.test(src)) {
				src = await fetch(src, {encoding: 'binary'});
			} else if (path.extname(src) == '.gif') {
				src = fs.readFileSync(src, 'binary');
			}
			if (typeof(src) === 'string') {
				src = Buffer.from(src, 'binary');
			}
		}
		if (src instanceof Buffer) {
			let gif = await GifUtil.read(src);
			return new GIF(gif);
		}
	}
}

module.exports = {GIF,Gif,GifFrame,GifUtil,GifCodec};
