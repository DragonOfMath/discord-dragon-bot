const {Markdown:md,Jimp,random,Color,Math,Perlin2} = require('../../Utils');
const {isImage,processImage} = require('./image-utils');
const brailleify = require('./brailleify');

const TEST_IMAGES = ['blank','grid','checkerboard','color','noise','random']
const TEST_COLORS = [Color.WHITE,Color.RED,Color.GREEN,Color.BLUE,Color.YELLOW,Color.CYAN,Color.MAGENTA];
const WHITE = Color.WHITE.rgba;
const BLACK = Color.BLACK.rgba;

function resolvePercent(num, scale = 1, min = 0, max = 100) {
	if (String(num).endsWith('%')) {
		num = Number(num.match(/\d+/));
		num = Math.minmax(num, min, max);
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
		category: 'Image',
		title: 'Image Post-Processing',
		info: 'A variety of image-manipulating commands.',
		permissions: 'inclusive',
		analytics: false,
		subcommands: {
			'hash': {
				aliases: ['phash','perceptualhash'],
				title: 'Image | Perceptual Hash',
				info: 'Get the perceptual hash of an image. Optionally, specify the base you wish to output in, default is 16.',
				parameters: ['[imageURL]','[base]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, base=16) => image.hash(base));
				}
			},
			'test': {
				aliases: ['testing', 'generate'],
				info: 'Creates a testing image. Specify what preset to use and at what size.',
				parameters: [`[<${TEST_IMAGES.join('|')}>]`,'[size]'],
				fn({client, args}) {
					let [type = random(TEST_IMAGES), size = 200] = args;
					type = type.toLowerCase();
					size = resolvePercent(size, 1000);
					
					let image = new Jimp(size, size, WHITE);
					let spacing = Math.floor(size / 10);
					let algorithm;
					switch (type) {
						case 'blank':
							algorithm = () => WHITE;
							break;
						case 'grid':
							algorithm = (x,y) => {
								return ((x && x % spacing == 0) || (y && y % spacing == 0)) ? BLACK : WHITE;
							};
							break;
						case 'checkerboard':
							algorithm = (x,y) => {
								return (((Math.floor(x/spacing)+Math.floor(y/spacing)) % 2) == 1) ? BLACK : WHITE;
							};
							break;
						case 'color':
							let saturation = 2 * Math.random();
							algorithm = (x,y) => {
								let tx = x / size;
								let ty = y / size;
								return Color.hsl(360 * tx, saturation, Math.abs(2 * ty - 1)).rgba;
							};
							break;
						case 'noise':
							let perlin = new Perlin2(spacing);
							let color = random(TEST_COLORS);
							algorithm = (x,y) => {
								let n = perlin.noise(x/20, y/20);
								n = (n + 1) / 2;
								return color.scale(n).rgba;
							};
							break;
						case 'random':
							algorithm = () => Color.random().rgba;
							break;
					}
					image.scan(0, 0, size, size, (x,y,i) => {
						image.setPixelColor(algorithm(x,y), x, y);
					});
					return image.getBufferAs('test.png');
				}
			},
			'brailleify': {
				aliases: ['braille'],
				info: 'Turns an image into a Braille text thing.',
				parameters: ['[imageURL]', '[threshold]', '[scale]', '[invert]'],
				fn({client, args, channelID}) {
					return processImage(client, args, channelID, (image, threshold, scale, invert) => {
						let pixels = image.bitmap.width * image.bitmap.height;
						let maxScale = 1;
						while (Math.ceil(pixels / (8 * Math.pow(maxScale, 2))) > 960) maxScale++;
						while (Math.ceil(image.bitmap.height / (4 * maxScale)) > 40)  maxScale++;
						scale = Math.max(scale, maxScale);
						return brailleify(image.normalize().bitmap, {threshold, scale, invert});
					});
				}
			},
			'flip': {
				aliases: ['mirror'],
				info: 'Flips an image horizontally, vertically, or both.',
				parameters: ['[imageURL]', '[<horizontal|vertical|both>]'],
				fn({client, args, channelID}) {
					return processImage(client, args, channelID, (image, type='horizontal') => {
						type = type.toLowerCase();
						return image.mirror(type == 'horizontal' || type == 'both', type == 'vertical' || type == 'both');
					}, 'mirror.png');
				}
			},
			'symmetry': {
				aliases: ['woow','waaw','hooh','haah'],
				info: 'Mirrors an image along a symmetry.',
				parameters: ['[imageURL]', '[<left-right|right-left|top-bottom|bottom-top|top-left|top-right|bottom-left|bottom-right>]'],
				fn({client, args, channelID}) {
					return processImage(client, args, channelID, (image, type='left-right') => image.symmetry(type), 'symmetry.png');
				}
			},
			'greyscale': {
				aliases: ['grayscale','grey','gray'],
				info: 'Make the image greyscale.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image) => image.greyscale(), 'greyscale.png');
				}
			},
			'invert': {
				info: 'Invert the colors of an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image) => image.invert(), 'invert.png');
				}
			},
			'normalize': {
				aliases: ['normal'],
				info: 'Normalize the color ranges of an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image) => image.normalize(), 'normalize.png');
				}
			},
			'sharpen': {
				info: 'Sharpens color boundaries in an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image) => image.sharpen(), 'sharpen.png');
				}
			},
			'unsharpen': {
				info: 'Applies unsharp masking to an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image) => image.unsharpen(), 'unsharpen.png');
				}
			},
			'emboss': {
				info: 'Applies emboss filter to an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image) => image.emboss(), 'emboss.png');
				}
			},
			'gradient': {
				info: 'Calculates the image gradient.',
				parameters: ['[imageURL]', '[dir]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, dir = 'y') => {
						switch (dir.toLowerCase()) {
							case 'x':
							case 'horizontal':
								return image.gradientX();
							case 'y':
							case 'vertical':
								return image.gradientY();
						}
					}, 'gradient.png');
				}
			},
			'sepia': {
				info: 'Applies sepia filter to an image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image) => image.sepia(), 'sepia.png');
				}
			},
			'hue': {
				info: 'Adjust the hue of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, value = random(100)) => {
						return image.color([{apply: 'hue', params: [value]}]);
					}, 'hue.png');
				}
			},
			'saturation': {
				aliases: ['saturate', 'sat'],
				info: 'Adjust the saturation of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, value = random(100)) => {
						return image.color([{apply: 'saturate', params: [value]}]);
					}, 'saturation.png');
				}
			},
			'brightness': {
				aliases: ['lightness', 'brighten', 'lighten'],
				info: 'Adjust the brightness of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, value = 2*random()-1) => {
						value = Math.minmax(value, -1, 1);
						return image.brightness(value);
					}, 'brightness.png');
				}
			},
			'contrast': {
				info: 'Adjust the contrast of an image.',
				parameters: ['[imageURL]', '[value]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, value = 2*random()-1) => {
						value = Math.minmax(value, -1, 1);
						return image.contrast(value);
					}, 'contrast.png');
				}
			},
			'posterize': {
				info: 'Posterize an image to fewer colors.',
				parameters: ['[imageURL]', '[colors]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, value = random(5,25)) => {
						value = Math.minmax(value, 1, 255);
						return image.posterize(value);
					}, 'posterize.png');
				}
			},
			'pixelate': {
				aliases: ['8bit','pixelize','pixel'],
				info: 'Pixelate an image. Default is 32x32 pixels.',
				parameters: ['[imageURL]', '[pixels]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, pixels=32) => image.pixelate(pixels), 'pixelate.png');
				}
			},
			'crop': {
				info: 'Crop an image. Tolerance is a percentage of pixel difference.',
				parameters: ['[imageURL]', '[tolerance]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, tolerance=0.002) => image.autocrop(resolvePercent(tolerance, 100), false), 'crop.png');
				}
			},
			'resize': {
				info: 'Resize or refit an image to new dimensions.',
				parameters: ['[imageURL]', '[width]', '[height]', '[fit]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, width='auto', height='auto', fit=false) => {
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
					}, 'resize.png');
				}
			},
			'rescale': {
				aliases: ['scale'],
				info: 'Rescale an image by a factor.',
				parameters: ['[imageURL]', '[scale]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, scale=0.8) => {
						scale = Math.minmax(scale, 0.1, 10);
						return image.scale(scale);
					}, 'rescale.png');
				}
			},
			'rotate': {
				info: 'Rotate an image clockwise.',
				parameters: ['[imageURL]', '[degrees]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, degrees=90) => {
						degrees = Math.modulo(degrees, 360);
						return image.rotate(degrees);
					}, 'rotate.png');
				}
			},
			'blur': {
				info: 'Apply blur to an image.',
				parameters: ['[imageURL]', '[radius]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, value=random(5,25)) => {
						value = Math.minmax(value, 1, 100);
						return image.blur(value);
					}, 'blur.png');
				}
			},
			'motionblur': {
				aliases: ['motion'],
				info: 'Apply motion blur to an image.',
				parameters: ['[imageURL]', '[strength]', '[direction]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, strength, direction=random(360)) => {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						direction = Math.degToRad(Math.modulo(direction,360));
						strength = strength === undefined ? random(min) : resolvePercent(strength, min);
						var dx = strength * Math.cos(direction);
						var dy = strength * Math.sin(direction);
						return image.differentialBlur(() => ({dx,dy}));
					}, 'motionblur.png');
				}
			},
			'circleblur': {
				aliases: ['circle', 'spin'],
				info: 'Apply rotational blur with the specified strength to an image.',
				parameters: ['[imageURL]', '[strength]', '[xpos]', '[ypos]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, strength, xpos, ypos) => {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						var rad = min * Math.PI / 8;
						var {x:ox,y:oy} = resolvePos(image, xpos, ypos, Math.floor(w / 2), Math.floor(h / 2));
						strength = strength === undefined ? random(2,rad) : resolvePercent(strength, rad);
						return image.differentialBlur((x,y) => ({
							dx: strength * (oy - y) / h,
							dy: strength * (x - ox) / w
						}));
					}, 'circleblur.png');
				}
			},
			'radialblur': {
				aliases: ['intensify','intensifies'],
				info: 'Apply radial blur with the specified center and strength to an image. Makes for a neat [intensifies] effect.',
				parameters: ['[imageURL]', '[strength]', '[xpos]', '[ypos]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, strength, xpos, ypos) => {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						var scale = 20;
						var {x:ox,y:oy} = resolvePos(image, xpos, ypos, Math.floor(w / 2), Math.floor(h / 2));
						strength = strength === undefined ? random(3,scale) : resolvePercent(strength, scale);
						return image.differentialBlur((x,y) => ({
								dx: strength * (x - ox) / w,
								dy: strength * (y - oy) / h
						}));
					}, 'radialblur.png');
				}
			},
			'bulge': {
				aliases: ['fisheye','eyefish','bubble','explode'],
				info: 'Add a bulge at the specified center and strength to an image.',
				parameters: ['[imageURL]', '[strength]', '[xpos]', '[ypos]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, strength, xpos, ypos) => {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						var {x:ox,y:oy} = resolvePos(image, xpos, ypos, Math.floor(w / 2), Math.floor(h / 2));
						strength = strength === undefined ? random(min) : resolvePercent(strength, min);
						return image.transform((x,y) => {
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
					}, 'bulge.png');
				}
			},
			'gravity': {
				aliases: ['implode','potionseller','inversefisheye'],
				info: 'Implode the image at the specified center and strength.',
				parameters: ['[imageURL]', '[strength]', '[xpos]', '[ypos]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, strength, xpos, ypos) => {
						var w = image.bitmap.width;
						var h = image.bitmap.height;
						var min = Math.min(w,h);
						var max = Math.max(w,h);
						var {x:ox,y:oy} = resolvePos(image, xpos, ypos, Math.floor(w / 2), Math.floor(h / 2));
						strength = strength === undefined ? random(min) : resolvePercent(strength, min);
						return image.transform((x,y) => {
							var dx = ox - x;
							var dy = oy - y;
							var dd = Math.hypot(dx, dy);
							dd = Math.exp(-(dd*dd)/(strength*strength));
							dx *= dd;
							dy *= dd;
							x -= dx;
							y -= dy;
							return {x,y};
						});
					}, 'gravity.png');
				}
			},
			'swirl': {
				aliases: ['twist'],
				info: 'Swirl an image with the specified strength, rotation, and radius.',
				parameters: ['[imageURL]', '[strength]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, strength=5*random()) => image.swirl(resolvePercent(strength, 5)), 'swirl.png');
				}
			},
			'warp': {
				aliases: ['distort'],
				info: 'Warp the image with random vectors.',
				parameters: ['[imageURL]','[strength]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, strength) => {
						let w = image.bitmap.width;
						let h = image.bitmap.height;
						let max = Math.max(w,h);
						let warpSize = 5;
						strength = strength === undefined ? random(max / (2 * warpSize), max / warpSize) : strength;
						let spacing = Math.floor(image.bitmap.width/warpSize);
						let perlinX = new Perlin2(warpSize);
						let perlinY = new Perlin2(warpSize);
						return image.transform((x,y) => {
							return {
								x: x + (strength * perlinX.noise(x/spacing, y/spacing)),
								y: y + (strength * perlinY.noise(x/spacing, y/spacing))
							};
						});
					}, 'warp.png');
				}
			},
			'complex': {
				aliases: ['fractal','wtf'],
				info: 'Trace the image through iterations of the complex function `f(z) = z^p + c`.',
				parameters: ['[imageURL]', '[power]', '[iterations]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, power, iterations) => {
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
						return image.transform((x,y) => {
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
					}, 'complex.png');
				}
			},
			'transform': {
				info: 'Put an image through a custom transformation function. Current supported variables are x, y, idx, and color, plus any members of Math. (return keyword is provided)',
				parameters: ['[imageURL]', '...function'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, ...fn) => {
						fn = new Function('x','y','idx','color', 'with (Math) {return ' + fn.join(' ') + '}');
						return image.transform(fn);
					}, 'transform.png');
				}
			},
			'stereogram': {
				aliases: ['magiceye','autostereogram'],
				info: 'Generate an autostereogram using an image as a depth field. Normally generates for cross-eyed viewing, but you can specify if you want it to generate for wall-eyed viewing.',
				parameters: ['[imageURL]', '[strength]', '[walleyed]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, strength, walleyed) => {
						var w   = image.bitmap.width,
							h   = image.bitmap.height,
							p   = 5 + 2 * ~~Math.log2(w/h), // partitions
							pw  = Math.max(~~(w / p), 50),  // partition width
							mid = ~~(w / 2);
						if (w < 100 || w/h < 1) throw 'Image must be at least 100 pixels width and more wide than tall.';
						strength = strength === undefined ? 8 : Math.max(1,strength)
						;
						// set the image to greyscale to simulate a depth map
						image = image.greyscale().normalize();
						
						// create a random dot pattern, but also make characteristic "blotches"
						var pattern = new Jimp(pw, h)
						.map(() => Color.random())
						.blur(random(5,15))
						.normalize()
						.emboss()
						.contrast(random(0.1,0.5));
						
						// generate the stereogram by shifting regions in the pattern by the corresponding depth map values
						return image.map((color,x,y,i,img) => {
							var depth = (color.r / 255);
							var shift = ~~(((mid - x) / pw) * depth * strength);
							if (walleyed) shift *= -1;
							return pattern.getPixelColor(Math.modulo(x + shift, pw), y);
						});
					}, 'stereogram.png');
				}
			},
			'droste': {
				aliases: ['recursion'],
				info: 'Apply the Droste effect, which is a recursion of the image itself.',
				parameters: ['[imageURL]', '[xpos]', '[ypos]', '[scalefactor]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, xpos, ypos, scale) => {
						var w = image.bitmap.width,
							h = image.bitmap.height,
							ox = Math.floor(w / 2),
							oy = Math.floor(h / 2);

						({x:xpos,y:ypos} = resolvePos(image, xpos, ypos, ox/2, oy/2));
						scale = scale === undefined ? 0.5 : resolvePercent(scale);
						return image.recursion(xpos, ypos, scale);
					}, 'recursion.png');
				}
			},
			'magik': {
				aliases: ['magick','magic'],
				info: 'Apply seam-carving to an image.',
				parameters: ['[imageURL]'],
				enabled: false,
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image) => image.magik(), 'magik.png');
				}
			}
		}
	}
};
