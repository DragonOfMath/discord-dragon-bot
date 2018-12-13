const {Jimp,GIF,GifFrame} = require('../../Utils');
const {processImage} = require('./image-utils');

module.exports = {
	'gif': {
		category: 'Image',
		info: 'GIF image module.',
		permissions: 'inclusive',
		analytics: false,
		subcommands: {
			'spin': {
				aliases: ['roll'],
				info: 'Spin an image! Optionally set how many frames to spin and at what rate (in frames per second).',
				parameters: ['[imageURL]','[frames]','[speed]','[<cw|ccw>]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, frames = 20, speed = 30, dir = 'cw') => {
						if (!(image instanceof Jimp)) {
							throw 'Image must be a PNG or JPEG!';
						}
						image = image.circleCrop();
						dir = dir == 'cw' ? 360 : -360;
						let delay = Math.floor(100 / speed);
						let gif = new GIF();
						for (let f = 0, frame; f < frames; f++) {
							frame = image.clone().rotate(dir * (f / frames), false);
							frame = new GifFrame(frame.bitmap, {delayCentisecs: delay});
							gif.frames.push(frame);
						}
						gif.quantize('dekker');
						return gif.toBuffer();
					}, 'spin.gif');
				}
			},
			'shake': {
				aliases: ['intensify'],
				info: 'Shake an image! Optionally, set how violent the shaking is (in percentage of image size).',
				parameters: ['[imageURL]','[intensity]'],
				enabled: false,
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, intensity = 0.2) => {
						if (!(image instanceof Jimp)) {
							throw 'Image must be a PNG or JPEG!';
						}
						intensity   = Math.max(0.01, Math.min(intensity, 0.8));
						
						let owidth  = image.bitmap.width;
						let oheight = image.bitmap.height;
						let gwidth  = Math.floor(owidth * (1 + intensity));
						let gheight = Math.floor(oheight * (1 + intensity));
						
						let gif = new GIF();
						let frame = new GifFrame(image, {delayCentisecs: 3});
						frame.reframe(0, 0, gwidth, gheight);
						gif.frames.push(frame);
						for (let i = 0; i < 5; i++) {
							let shakeFrame = new GifFrame(frame);
							let xOffset = Math.floor(gwidth  * (Math.random() - 0.5));
							let yOffset = Math.floor(gheight * (Math.random() - 0.5));
							shakeFrame.xOffset = xOffset;
							shakeFrame.yOffset = yOffset;
							gif.frames.push(shakeFrame);
						}
						gif.quantize('dekker');
						return gif.toBuffer();
					}, 'shake.gif');
				}
			},
			'reverse': {
				aliases: ['backwards'],
				info: 'Reverse a GIF',
				parameters: ['[gifURL]'],
				enabled: false,
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (gif) => {
						if (!(gif instanceof Gif)) {
							throw 'Image must be a GIF!';
						}
						
						gif.renderAllFrames();
						gif.frames.reverse();
						gif.optimizeFrames();
						
						return gif.toBuffer();
					}, 'reverse.gif');
				}
			},
			'trigger': {
				aliases: ['triggered'],
				info: 'Make an image into the triggered gif meme.',
				parameters: ['[imageURL]'],
				enabled: false,
				fn({client, channelID, args}) {
					
					throw 'Work in progress.';
				}
			},
			'corrupt': {
				aliases: ['broken'],
				info: 'Corrupt a GIF',
				parameters: ['[gifURL]'],
				enabled: false,
				fn({client, channelID, args}) {
					throw 'Work in progress.';
				}
			},
			'magik': {
				aliases: ['gmagik'],
				info: 'Apply the magik filter to a GIF.',
				parameters: ['[gifURL]'],
				enabled: false,
				fn({client, channelID, args}) {
					throw 'Work in progress.';
				}
			}
		}
	}
};
