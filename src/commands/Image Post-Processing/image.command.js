const {random,Jimp,Math,Color,Perlin2} = require('../../Utils');
const brailleify = require('./brailleify');

const TEST_IMAGE_TYPES  = ['blank','grid','checkerboard','color','noise','random'];
const TEST_IMAGE_COLORS = [Color.WHITE,Color.RED,Color.GREEN,Color.BLUE,Color.YELLOW,Color.CYAN,Color.MAGENTA];

function processImage(client, channelID, args, filename, process) {
	var _args = args.slice();
	return client.type(channelID)
	.then(() => getImageInChannel(client, channelID, _args))
	.then(Jimp.read)
	.then(image => process.call(client, image, ..._args))
	.then(getBufferAs(filename));
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
function getBufferAs(filename) {
	var mime = /\.png$/i.test(filename) ? Jimp.MIME_PNG : Jimp.MIME_JPEG;
	return (image) => (image.getBufferAsync(mime).then(file => ({file, filename})));
}
function isImage(url) {
	return /^http.+\.(jpg|jpeg|png)$/i.test(url);
}

function resolvePercent(num, scale) {
	if (String(num).endsWith('%')) {
		num = Number(num.match(/\d+/));
		num = Math.minmax(num, 0, 100);
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
function iterate(cx,cy,p,limit) {
	var x = cx, y = cy, i = 0;
	while (i < limit) {
		({real: x, imag: y} = Math.complexPow(x, y, p));
		x += cx;
		y += cy;
		i++;
	}
	return {x, y};
}

module.exports = {
	'image': {
		aliases: ['img', 'picture', 'pic'],
		category: 'Misc',
		title: 'Image Post-Processing',
		info: 'A variety of image-manipulating commands.',
		analytics: false,
		subcommands: {
			'test': {
				aliases: ['testing', 'generate'],
				info: 'Creates a testing image. Specify what preset to use and at what size.',
				parameters: [`[<${TEST_IMAGE_TYPES.join('|')}>]`,'[size]'],
				fn({client, args}) {
					var [type = random(TEST_IMAGE_TYPES), size = 200] = args;
					type = type.toLowerCase();
					size = resolvePercent(size, 1000);
					var WHITE = Color.WHITE.rgba;
					var BLACK = Color.BLACK.rgba;
					var image = new Jimp(size, size, WHITE);
					var spacing = Math.floor(size / 10);
					var algorithm;
					switch (type) {
						case 'blank':
							algorithm = () => WHITE;
							break;
						case 'grid':
							algorithm = (x,y,i) => {
								return ((x && x % spacing == 0) || (y && y % spacing == 0)) ? BLACK : WHITE;
							};
							break;
						case 'checkerboard':
							algorithm = (x,y,i) => {
								return (((Math.floor(x/spacing)+Math.floor(y/spacing)) % 2) == 1) ? BLACK : WHITE;
							};
							break;
						case 'color':
							algorithm = (x,y,i) => {
								var tx = x / size;
								var ty = y / size;
								return Color.hsl(360 * tx, 2 * Math.random(), Math.abs(2 * ty - 1)).rgba;
							};
							break;
						case 'noise':
							var perlin = new Perlin2(spacing);
							var color = random(TEST_IMAGE_COLORS);
							algorithm = (x,y,i) => {
								var n = perlin.noise(x/10, y/10);
								n = (n + 1) / 2;
								return color.scale(n).rgba;
							};
							break;
						case 'random':
							algorithm = () => Color.random().rgba;
							break;
					}
					image.scan(0, 0, size, size, (x,y,i) => {
						image.setPixelColor(algorithm(x,y,i), x, y);
					});
					return getBufferAs('test.jpg')(image);
				}
			},
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
						compression = Math.minmax(compression, 1, 100);
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
					return processImage(client, channelID, args, 'sepia.jpg', function (image) {
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
				aliases: ['saturate', 'sat'],
				info: 'Adjust the saturation of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'saturation.jpg', function (image, value = random(100)) {
						return image.color([{apply: 'saturate', params: [value]}]);
					});
				}
			},
			'brightness': {
				aliases: ['lightness', 'brighten', 'lighten'],
				info: 'Adjust the brightness of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'brightness.jpg', function (image, value = 2*random()-1) {
						value = Math.minmax(value, -1, 1);
						return image.brightness(value);
					});
				}
			},
			'contrast': {
				info: 'Adjust the contrast of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'contrast.jpg', function (image, value = 2*random()-1) {
						value = Math.minmax(value, -1, 1);
						return image.contrast(value);
					});
				}
			},
			'posterize': {
				info: 'Posterize an image to fewer colors.',
				parameters: ['[imageURL]', '[colors]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'posterize.jpg', function (image, value = random(5,25)) {
						value = Math.minmax(value, 1, 255);
						return image.posterize(value);
					});
				}
			},
			'resize': {
				info: 'Resize or refit an image to new dimensions.',
				parameters: ['[imageURL]', '[width]', '[height]', '[fit]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'resize.jpg', function (image, width = 'auto', height = 'auto', fit = false) {
						if (fit) {
							return image.scaleToFit(width, height);
						} else {
							if (width == 'auto') {
								width = Jimp.AUTO;
							} else {
								width = Math.minmax(width, 1, 2000);
							}
							if (height == 'auto') {
								height = Jimp.AUTO;
							} else {
								height = Math.minmax(height, 1, 2000);
							}
							return image.resize(width, height);
						}
					});
				}
			},
			'rescale': {
				info: 'Rescale an image by a factor.',
				parameters: ['[imageURL]', '[scale]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'rescale.jpg', function (image, scale = 0.8) {
						scale = Math.minmax(scale, 0.1, 10);
						return image.scale(scale);
					});
				}
			},
			'rotate': {
				info: 'Rotate an image clockwise.',
				parameters: ['[imageURL]', '[degrees]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'rotate.jpg', function (image, degrees = 90) {
						degrees = Math.modulo(degrees, 360);
						return image.rotate(degrees);
					});
				}
			},
			'blur': {
				info: 'Apply blur to an image.',
				parameters: ['[imageURL]', '[radius]'],
				fn({client, channelID, args}) {
					return processImage(client, channelID, args, 'blur.jpg', function (image, value = random(5,25)) {
						value = Math.minmax(value, 1, 100);
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
						direction = Math.degToRad(Math.modulo(direction,360));
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
						var rad = min * Math.PI / 8;
						var {x:ox,y:oy} = resolvePos(image, xpos, ypos, Math.floor(w / 2), Math.floor(h / 2));
						strength = strength === undefined ? random(2,rad) : resolvePercent(strength, rad);
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
						var scale = 20;
						var {x:ox,y:oy} = resolvePos(image, xpos, ypos, Math.floor(w / 2), Math.floor(h / 2));
						strength = strength === undefined ? random(3,scale) : resolvePercent(strength, scale);
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
							dd = Math.exp(-(dd*dd)/(strength*strength));
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
							theta += strength * Math.PI * Math.exp(-dd/swirlRadius);
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
						power = power === undefined ? (random(-8,8)||2) : resolvePercent(power, 8);
						iterations = iterations === undefined ? 2 : resolvePercent(iterations, 20);
						iterations = Math.minmax(iterations, 1, 20);
						return applyTransform(image, (x,y) => {
							// map the pixel plane to the complex plane
							var dx = scale * (x - ox);
							var dy = scale * (y - oy);
							// run the iterative function
							({x,y} = iterate(dx, dy, power, iterations));
							// map the complex plane back to the pixel plane and wrap
							x = Math.modulo(ox + x / scale, w);
							y = Math.modulo(oy + y / scale, h);
							return {x,y};
						});
					});
				}
			}
		}
	}
};