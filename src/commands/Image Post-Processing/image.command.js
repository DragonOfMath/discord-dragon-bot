const {random,Jimp} = require('../../Utils');
const brailleify = require('./brailleify');
//const comedy = require('./comedy.json');

function processImage(client, channelID, args, filename, process) {
	var mime = /\.png$/i.test(filename) ? Jimp.MIME_PNG : Jimp.MIME_JPEG;
	var _args = args.slice();
	return client.type(channelID)
	.then(() => getImageInChannel(client, channelID, _args))
	.then(Jimp.read)
	.then(image => process.call(client, image, ..._args))
	.then(image => image.getBufferAsync(mime))
	.then(file  => ({file, filename}));
}
function getImageInChannel(client, channelID, args) {
	var url = args[0];
	if (isImage(url)) {
		args.splice(0,1);
		return Promise.resolve(url);
	} else {
		return client.getMessages({channelID,limit:30}).then(messages => {
			for (var message of messages) {
				if (message.attachments.length && isImage(message.attachments[0].url)) {
					return message.attachments[0].url;
				} else if (message.embeds.length && isImage(message.embeds[0].url)) {
					return message.embeds[0].url;
				} else if (message.embeds.length && message.embeds[0].image) {
					return message.embeds[0].image.url;
				}
			}
			throw 'No image found.';
		});
	}
}
function isImage(url) {
	return /^http.+\.(jpg|jpeg|png)$/.test(url);
}

const PI = Math.PI;
const TAU = 2 * PI;

function radToDeg(r) {
	return r * 180 / PI;
}
function degToRad(d) {
	return d * PI / 180;
}
function resolvePercent(num, scale) {
	if (String(num).endsWith('%')) {
		num = Number(num.match(/\d+/));
		num = Math.max(0, Math.min(num, 100));
		num /= 100;
		num *= scale;
	}
	return num;
}
function resolvePos(image, x, y, defaultX, defaultY) {
	if (typeof(x) !== 'undefined') {
		x = resolvePercent(x, image.bitmap.width);
	} else {
		x = defaultX;
	}
	if (typeof(y) !== 'undefined') {
		y = resolvePercent(y, image.bitmap.height);
	} else {
		y = defaultY;
	}
	return {x,y};
}
function applyTransform(image, F) {
	var w = image.bitmap.width;
	var h = image.bitmap.height;
	var d = Math.hypot(w,h); // diagonal
	var clone = image.clone();
	return clone.scan(0, 0, w, h, (x,y,i) => {
		// transform x and y
		var {x:tx,y:ty} = F(x,y);
		// use the color at the new pixel
		var hex = image.getPixelColor(tx|0, ty|0);
		clone.setPixelColor(hex, x, y);
	});
}
function applyDifferential(image, diff) {
	var w = image.bitmap.width;
	var h = image.bitmap.height;
	var d = Math.hypot(w,h); // diagonal
	var clone = image.clone();
	return clone.scan(0, 0, w, h, (x,y,i) => {
		// get the base pixel components
		var hex = image.getPixelColor(x, y);
		var color = Jimp.intToRGBA(hex), color2;
		
		// get the differential at the x and y
		var {dx,dy} = diff(x,y);
		
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
					hex    = image.getPixelColor(tx|0, ty|0);
					color2 = Jimp.intToRGBA(hex);
					color.r += color2.r;
					color.g += color2.g;
					color.b += color2.b;
					count++;
				}
				tx += dx;
				ty += dy;
			}
			
			color.r /= count;
			color.g /= count;
			color.b /= count;
			
			// set the clone's pixel color to the average of the colors traversed
			hex = Jimp.rgbaToInt(color.r|0, color.g|0, color.b|0, color.a);
			clone.setPixelColor(hex, x, y);
		}
	});
}
function iterate(x,y,p,limit) {
	with (Math) {
		var nx = x, ny = y, i = 0, r, t;
		while (i < limit) {
			// https://en.wikipedia.org/wiki/De_Moivre%27s_formula
			r = nx * nx + ny * ny;
			//if (r > 4) break;
			r = exp(log(r) * p / 2);
			t = atan2(ny,nx);
			nx = r * cos(t * p) + x;
			ny = r * sin(t * p) + y;
			i++;
		}
		return {x: nx, y: ny};
	}
}
function modulo(x,n) {
	return ((x % n) + n) % n;
}

module.exports = {
	'image': {
		aliases: ['img', 'picture', 'pic'],
		category: 'Misc',
		title: 'Image Post-Processing',
		info: 'A variety of image-manipulating commands.',
		subcommands: {
			'deepfry': {
				aliases: ['needsmorefrying','needsmoredeepfrying'],
				info: 'Deep-fry an image.',
				parameters: ['[imageURL]'],
				fn({client, args, channelID}) {
					return processImage(client, channelID, args, 'deepfry.jpg', function (image) {
						return image.color([{
							apply: 'saturate',
							params: [random(20,100)]
						}])
						.posterize(random(4,15))
						.quality(random(1,20));
					});
				}
			},
			'jpeg': {
				aliases: ['jpg', 'needsmorejpeg','needsmorejpg'],
				info: 'Adds JPEG compression to an image.',
				parameters: ['[imageURL]', '[compression]'],
				fn({client, args, channelID}) {
					return processImage(client, channelID, args, 'needsmorejpeg.jpg', function (image, compression = random(1,20)) {
						return image.posterize(random(20,70)).quality(compression);
					});
				}
			},
			'brailleify': {
				aliases: ['braille'],
				info: 'Turns an image into a Braille text thing.',
				parameters: ['[imageURL]', '[threshold]', '[scale]', '[invert]'],
				fn({client, args, channelID}) {
					var _args = args.slice();
					return getImageInChannel(client, channelID, _args)
					.then(Jimp.read)
					.then(image => {
						image = image.normalize();
						var [threshold, scale, invert] = _args;
						var pixels = image.bitmap.width * image.bitmap.height;
						var maxScale = 1;
						while (Math.ceil(pixels / (8 * Math.pow(maxScale, 2))) > 960) maxScale++;
						while (Math.ceil(image.bitmap.height / (4 * maxScale)) > 40)  maxScale++;
						scale = Math.max(scale, maxScale);
						return brailleify(image.bitmap, {threshold, scale, invert});
					});
				}
			},
			'flip': {
				aliases: ['mirror'],
				info: 'Flips an image horizontally, vertically, or both.',
				parameters: ['[imageURL]', '[<horizontal|vertical|both>]'],
				fn({client, args, channelID}) {
					return processImage(client, channelID, args, 'mirror.jpg', function (image, type = 'horizontal') {
						type = type.toLowerCase();
						return image.mirror(type == 'horizontal' || type == 'both', type == 'vertical' || type == 'both');
					});
				}
			},
			'symmetry': {
				aliases: ['woow','waaw','hooh','haah'],
				info: 'Mirrors an image along a symmetry.',
				parameters: ['[imageURL]', '[<left-right|right-left|top-bottom|bottom-top|top-left|top-right|bottom-left|bottom-right>]'],
				fn({client, args, channelID}) {
					return processImage(client, channelID, args, 'symmetry.jpg', function (image, type = 'left-right') {
						return image.symmetry(type);
					});
				}
			},
			'greyscale': {
				aliases: ['grayscale','grey','gray'],
				info: 'Make the image greyscale.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'greyscale.jpg', function (image) {
						return image.greyscale();
					});
				}
			},
			'invert': {
				info: 'Invert the colors of an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'invert.jpg', function (image) {
						return image.invert();
					});
				}
			},
			'normalize': {
				aliases: ['normal'],
				info: 'Normalize the color ranges of an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'normalize.jpg', function (image) {
						return image.normalize();
					});
				}
			},
			'sharpen': {
				info: 'Sharpens color boundaries in an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'sharpen.jpg', function (image) {
						return image.sharpen();
					});
				}
			},
			'unsharpen': {
				info: 'Applies unsharp masking to an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'unsharpen.jpg', function (image) {
						return image.unsharpen();
					});
				}
			},
			'emboss': {
				info: 'Applies emboss filter to an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'emboss.jpg', function (image) {
						return image.emboss();
					});
				}
			},
			'sepia': {
				info: 'Applies sepia filter to an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'emboss.jpg', function (image) {
						return image.sepia();
					});
				}
			},
			'hue': {
				info: 'Adjust the hue of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'hue.jpg', function (image, value = random(100)) {
						return image.color([{apply: 'hue', params: [value]}]);
					});
				}
			},
			'saturation': {
				info: 'Adjust the saturation of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'saturation.jpg', function (image, value = random(100)) {
						return image.color([{apply: 'saturate', params: [value]}]);
					});
				}
			},
			'brightness': {
				info: 'Adjust the brightness of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'contrast.jpg', function (image, value = 2*random()-1) {
						return image.brightness(value);
					});
				}
			},
			'contrast': {
				info: 'Adjust the contrast of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'contrast.jpg', function (image, value = 2*random()-1) {
						return image.contrast(value);
					});
				}
			},
			'posterize': {
				info: 'Posterize an image to fewer colors.',
				parameters: ['[imageURL]', '[colors]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'posterize.jpg', function (image, value = random(5,25)) {
						return image.posterize(value);
					});
				}
			},
			'resize': {
				info: 'Resize or refit an image to new dimensions.',
				parameters: ['[imageURL]', 'width', 'height', '[fit]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'resize.jpg', function (image, width, height, fit = false) {
						if (fit) {
							return image.scaleToFit(width, height);
						} else {
							return image.resize(width == 'auto' ? Jimp.AUTO : width, height == 'auto' ? Jimp.AUTO : height);
						}
					});
				}
			},
			'rescale': {
				info: 'Rescale an image by a factor.',
				parameters: ['[imageURL]', 'scale'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'rescale.jpg', function (image, scale) {
						return image.scale(scale);
					});
				}
			},
			'rotate': {
				info: 'Rotate an image clockwise.',
				parameters: ['[imageURL]', '[degrees]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'rotate.jpg', function (image, degrees = 90) {
						return image.rotate(degrees);
					});
				}
			},
			'blur': {
				info: 'Apply blur to an image.',
				parameters: ['[imageURL]', '[radius]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'blur.jpg', function (image, value = random(5,25)) {
						return image.blur(value);
					});
				}
			},
			'motionblur': {
				aliases: ['motion'],
				info: 'Apply motion blur to an image.',
				parameters: ['[imageURL]', '[strength]', '[direction]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'motionblur.jpg', function (image, strength, direction = random(360)) {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						direction = degToRad(direction);
						strength = strength === undefined ? random(min) : resolvePercent(strength, min);
						var dx = strength * Math.cos(direction);
						var dy = strength * Math.sin(direction);
						return applyDifferential(image, (x,y) => {
							return {dx,dy};
						});
					});
				}
			},
			'circleblur': {
				aliases: ['circle', 'spin'],
				info: 'Apply rotational blur with the specified strength to an image.',
				parameters: ['[imageURL]', '[strength]', '[xpos]', '[ypos]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'circleblur.jpg', function (image, strength, xpos, ypos) {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						var {x:ox,y:oy} = resolvePos(image, xpos, ypos, Math.floor(w / 2), Math.floor(h / 2));
						strength = strength === undefined ? random(min * PI / 4) : resolvePercent(strength, min * PI / 4);
						return applyDifferential(image, (x,y) => {
							return {
								dx: strength * (oy - y) / h,
								dy: strength * (x - ox) / w
							};
						});
					});
				}
			},
			'radialblur': {
				aliases: ['intensify','intensifies'],
				info: 'Apply radial blur with the specified center and strength to an image. Makes for a neat [intensifies] effect.',
				parameters: ['[imageURL]', '[strength]', '[xpos]', '[ypos]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'radialblur.jpg', function (image, strength, xpos, ypos) {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						var {x:ox,y:oy} = resolvePos(image, xpos, ypos, Math.floor(w / 2), Math.floor(h / 2));
						strength = strength === undefined ? random(min) : resolvePercent(strength, min);
						return applyDifferential(image, (x,y) => {
							return {
								dx: strength * (x - ox) / w,
								dy: strength * (y - oy) / h
							};
						});
					});
				}
			},
			'bulge': {
				aliases: ['fisheye','eyefish','bubble'],
				info: 'Add a bulge at the specified center and strength to an image.',
				parameters: ['[imageURL]', '[strength]', '[xpos]', '[ypos]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'bulge.jpg', function (image, strength, xpos, ypos) {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						var {x:ox,y:oy} = resolvePos(image, xpos, ypos, Math.floor(w / 2), Math.floor(h / 2));
						strength = strength === undefined ? random(min) : resolvePercent(strength, min);
						return applyTransform(image, (x,y) => {
							var dx = ox - x;
							var dy = oy - y;
							var dd = Math.hypot(dx, dy);
							dd = Math.exp(-(dd*dd)/strength);
							dx *= dd;
							dy *= dd;
							x += dx;
							y += dy;
							return {x,y};
						});
					});
				}
			},
			'swirl': {
				aliases: ['twist'],
				info: 'Swirl an image with the specified strength, rotation, and radius.',
				parameters: ['[imageURL]', '[strength]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'swirl.jpg', function (image, strength) {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						var ox = Math.floor(w / 2);
						var oy = Math.floor(h / 2);
						strength = strength === undefined ? (5 * random()) : resolvePercent(strength, 5);
						var swirlRadius = Math.log(2) * min / 5;
						return applyTransform(image, (x,y) => {
							var dx = x - ox;
							var dy = y - oy;
							var dd = Math.hypot(dx, dy);
							var theta = Math.atan2(dy, dx);
							theta += strength * PI * Math.exp(-dd/swirlRadius);
							x = ox + dd * Math.cos(theta);
							y = oy + dd * Math.sin(theta);
							return {x,y};
						});
					});
				}
			},
			'complex': {
				aliases: ['fractal','wtf'],
				info: 'Trace the image through iterations of the complex function `f(z) = z^p + c`.',
				parameters: ['[imageURL]', '[power]', '[iterations]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'complex.jpg', function (image, power, iterations) {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						var scale = 2 / min;
						var ox = Math.floor(w / 2);
						var oy = Math.floor(h / 2);
						power = power === undefined ? (5 * random()) : resolvePercent(power, 5);
						iterations = iterations === undefined ? 3 : resolvePercent(iterations, 20);
						iterations = Math.max(1,Math.min(iterations, 20));
						return applyTransform(image, (x,y) => {
							// map the pixel plane to the complex plane
							var dx = scale * (x - ox);
							var dy = scale * (y - oy);
							// run the iterative function
							var {x:fx,y:fy} = iterate(dx, dy, power, iterations);
							// map the complex plane back to the pixel plane and wrap
							x = modulo(ox + fx / scale, w);
							y = modulo(oy + fy / scale, h);
							return {x,y};
						});
					});
				}
			}
		}
	}
};

const todo = {
	'transform': {
		info: 'Put an image through a transformation function.',
		parameters: ['[imageURL]', '...function'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'transform.jpg', function (image, ...fn) {
				fn = new Function('x','y','with (Math) {return ' + fn.join(' ') + '}');
				return applyTransform(image, fn);
			});
		}
	},
	'differential': {
		info: 'Blur an image with a differential function.',
		parameters: ['[imageURL]', '...function'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'differential.jpg', function (image, ...fn) {
				fn = new Function('x','y','with (Math) {return ' + fn.join(' ') + '}');
				return applyDifferential(image, fn);
			});
		}
	},
	'ifunny': {
		aliases: ['ifunnyco'],
		info: 'Add the ifunny.co watermark to an image.',
		parameters: ['[imageURL]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'ifunny.jpg', function (image) {
				
			});
		}
	},
	'9gag': {
		aliases: ['9g'],
		info: 'Add the 9gag watermark to an image.',
		parameters: ['[imageURL]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, '9gag.jpg', function (image) {
				
			});
		}
	},
	'funwaa': {
		aliases: ['gumwaa'],
		info: 'Add the Funwaa:tm: watermark to an image.',
		parameters: ['[imageURL]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'funwaa.jpg', function (image) {
				
			});
		}
	},
	'owned': {
		aliases: ['smartphowned'],
		info: 'Add the smartphOWNED.com:tm: watermark to an image.',
		parameters: ['[imageURL]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'owned.jpg', function (image) {
				
			});
		}
	},
	'coolbro': {
		aliases: ['thisissosad','sarcasticbro'],
		info: 'Add the Cool Bro:tm: comedy punchline killer. Choose an expression and add an optional caption too!',
		parameters: ['[imageURL]', '[<thisissosad|owned>]', '[caption]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'coolbro.jpg', function (image, expression, caption) {
				
			});
		}
	},
	'weedbro': {
		aliases: ['weeddude'],
		info: 'Add the Weed Bro:tm: comedy punchline killer. Choose an expression and add an optional caption too!',
		parameters: ['[imageURL]', '[<head|body|bigeyes>]', '[caption]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'weedbro.jpg', function (image, expression, caption) {
				
			});
		}
	},
	'wtfguy': {
		aliases: ['wtfguyofficial'],
		info: 'Add the WTFGuyOfficial:tm: comedy punchline killer. Choose an expression and add an optional caption too!',
		parameters: ['[imageURL]', '[<megusta|lol|alone>]', '[caption]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'wtfguy.jpg', function (image, expression, caption) {
				
			});
		}
	},
	'memeface': {
		aliases: ['trollface','okayface','lolface'],
		info: 'Add a meme face to the image.',
		parameters: ['[imageURL]', '[caption]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'memeface.jpg', function (image, caption) {
				
			});
		}
	},
	'whodidthis': {
		aliases: ['wdt'],
		info: 'Add annoying emojis to an image. Choose top, bottom, or both, and add an optional caption to really ruin the humor!',
		parameters: ['[imageURL]', '[<top|bottom|both>]', '[caption]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'whodidthis.jpg', function (image, expression, caption) {
				
			});
		}
	}
};
