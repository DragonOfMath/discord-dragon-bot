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
			}
		}
	}
};

const todo = {
	'motionblur': {
		info: 'Apply motion blur to an image.',
		parameters: ['[imageURL]', '[direction]', '[strength]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'motionblur.jpg', function (image, direction = random(360), strength = random(10)) {
				
			});
		}
	},
	'circleblur': {
		info: 'Apply rotational blur with the specified strength to an image.',
		parameters: ['[imageURL]', '[strength]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'circleblur.jpg', function (image, strength = random(10)) {
				
			});
		}
	},
	'radialblur': {
		info: 'Apply radial blur with the specified center and strength to an image.',
		parameters: ['[imageURL]', '[xpos]', '[ypos]', '[strength]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'radialblur.jpg', function (image, xpos, ypos, strength = random(10)) {
				
			});
		}
	},
	'bulge': {
		info: 'Add a bulge at the specified center and strength to an image.',
		parameters: ['[imageURL]', '[xpos]', '[ypos]', '[strength]'],
		fn({client, channelID, args}) {
			return processImage(client, channelID, args, 'bulge.jpg', function (image, xpos, ypos, strength = random(10)) {
				
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
