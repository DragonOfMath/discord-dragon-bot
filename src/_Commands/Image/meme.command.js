const Asset = require('../../Structures/Asset');
const {Markdown:md,Jimp,random,capitalize,Array,Math} = require('../../Utils');
const {isImage,processImage,processImages} = require('./image-utils');

const MemeTemplates  = Asset.require('Templates/index.json');
const MemeWatermarks = Asset.require('Watermarks/index.json');
const MemeTemplateNames  = Object.keys(MemeTemplates);
const MemeWatermarkNames = Object.keys(MemeWatermarks);

function resolveCSV(args, min = 2, max = Infinity) {
	let csv = args.join(' ').split(/,\s*/);
	let items = csv.length > 1 ? csv : args;
	if (min && items.length < min) {
		throw `Need at least ${min} text/image items!`;
	}
	if (max && items.length > max) {
		throw `No more than ${max} text/image items!`;
	}
	return items;
}
function getFont(size = 32, color = 'black') {
	let fontName = `FONT_SANS_${size}_${color.toUpperCase()}`;
	return Jimp.loadFont(Jimp[fontName]);
}
async function getTemplate(templateName) {
	let filename = MemeTemplates[templateName].filename;
	if (filename) {
		if (filename instanceof Array) {
			filename = random(filename);
		}
		return Jimp.read(Asset.getPath('Templates/' + filename));
	} else {
		return;
	}
}
function applyTemplate(templateName, items = {}, filename) {
	const Descriptor = MemeTemplates[templateName];
	if (!Descriptor) {
		throw 'Invalid template: ' + templateName;
	}
	return getTemplate(templateName)
	.then(templateImage => {
		if (!templateImage) {
			templateImage = items.image;
		}
		return Descriptor.placeholders.forEachAsync(placeholder => {
			let item = items[placeholder.id];
			if (isImage(item) && (placeholder.type == 'image' || placeholder.type == 'any')) {
				return (item instanceof Jimp ? Promise.resolve(item) : Jimp.read(item))
				.then(image => {
					if (placeholder.rotation) {
						image.rotate(placeholder.rotation);
					}
					let x = placeholder.x || 0;
					let y = placeholder.y || 0;
					let w = placeholder.width;
					let h = placeholder.height;
					let alignmentX = placeholder.alignmentX || 'left';
					let alignmentY = placeholder.alignmentY || 'top';
					image.scaleToFit(w, h);
					if (alignmentX == 'center') {
						x += w / 2 - image.bitmap.width / 2;
					} else if (alignmentX == 'right') {
						x += w - image.bitmap.width;
					}
					if (alignmentX == 'middle') {
						y += h / 2 - image.bitmap.height / 2;
					} else if (alignmentY == 'bottom') {
						y += h - image.bitmap.height;
					}
					if (placeholder.mask) {
						return templateImage.mask(image, x, y);
					} else if (placeholder.watermark) {
						return image.composite(templateImage, x, y);
					} else {
						return templateImage.composite(image, x, y);
					}
				});
			} else if (placeholder.type == 'text' || placeholder.type == 'any') {
				if (!item && placeholder.default) {
					item = random(placeholder.default);
				}
				let x = placeholder.x;
				let y = placeholder.y;
				let w = placeholder.width;
				let h = placeholder.height;
				if (w == 'auto') {
					w = templateImage.bitmap.width;
				}
				if (h == 'auto') {
					h = templateImage.bitmap.height;
				}
				if (placeholder.padding) {
					x += placeholder.padding;
					y += placeholder.padding;
					w -= 2 * placeholder.padding;
					h -= 2 * placeholder.padding;
				}
				let size = placeholder.size;
				if (size == 'auto') {
					// calculate the optimal font size for this text
					for (size of [64,32,16,14,12,10,8]) {
						if (Math.ceil(item.length * size / w) * size * 1.5 < h * 0.33) {
							break;
						}
					}
				}
				let alignmentX = Jimp['HORIZONTAL_ALIGN_'+(placeholder.alignmentX || 'left').toUpperCase()];
				let alignmentY = Jimp['VERTICAL_ALIGN_'+(placeholder.alignmentY || 'top').toUpperCase()];
				return getFont(size, placeholder.color)
				.then(font => {
					return templateImage.print(font, x, y, {text:item,alignmentX,alignmentY}, w, h);
				});
			}
		})
		.then(() => filename ? templateImage.getBufferAs(filename) : templateImage);
	});
}
function getWatermark(watermarkName) {
	let filename = MemeWatermarks[watermarkName].filename;
	if (filename instanceof Array) {
		filename = random(filename);
	}
	return Jimp.read(Asset.getPath('Watermarks/' + filename));
}
function applyWatermark(watermarkName, image, text = 'BOTTOM TEXT') {
	const Descriptor = MemeWatermarks[watermarkName];
	if (!Descriptor) {
		throw 'Invalid watermark: ' + watermarkName;
	}
	return getWatermark(watermarkName)
	.then(watermark => {
		let iw = image.bitmap.width;
		let ih = image.bitmap.height;
		let ww = watermark.bitmap.width;
		let wh = watermark.bitmap.height;
		let bw = iw;
		let bh = ih;
		if (Descriptor.image.resize) {
			bw = Math.max(iw, ww);
			bh = Math.max(ih, wh);
			image.scaleToFit(Math.max(iw, ww), Math.max(ih, wh));
		}
		if (Descriptor.image.widthChange) {
			bw += ww;
		}
		if (Descriptor.image.heightChange) {
			bh += wh;
		}
		let bgImage = new Jimp(bw, bh, Descriptor.watermark.color || WHITE);
		
		let ix = 0;
		let iy = 0;
		let {alignmentX,alignmentY} = Descriptor.image;
		if (alignmentX == 'center') {
			ix += bw / 2 - iw / 2;
		} else if (alignmentX == 'right') {
			ix += bw - iw;
		} else if (alignmentX == 'random') {
			ix += random(bw - iw);
		}
		if (alignmentY == 'middle') {
			iy += bh / 2 - ih / 2;
		} else if (alignmentY == 'bottom') {
			iy += bh - ih;
		} else if (alignmentY == 'random') {
			iy += random(bh - ih);
		}
		bgImage.composite(image, ix, iy);
		
		let wx = 0;
		let wy = 0;
		if (Descriptor.watermark) {
			({alignmentX,alignmentY} = Descriptor.watermark);
			if (alignmentX == 'center') {
				wx += bw / 2 - ww / 2;
			} else if (alignmentX == 'right') {
				wx += bw - ww;
			} else if (alignmentX == 'random') {
				wx += random(bw - ww);
			}
			if (alignmentY == 'middle') {
				wy += bh / 2 - wh / 2;
			} else if (alignmentY == 'bottom') {
				wy += bh - wh;
			} else if (alignmentY == 'random') {
				wy += random(bh - wh);
			}
		}
		bgImage.composite(watermark, wx, wy);
		
		if (Descriptor.text) {
			if (!text) {
				text = random(Descriptor.text.default);
			}
			({alignmentX,alignmentY} = Descriptor.text);
			let tx = wx + (Descriptor.text.x || 0);
			let ty = wy + (Descriptor.text.y || 0);
			let tw = Descriptor.text.width   || ww;
			let th = Descriptor.text.height  || wh;
			return getFont(Descriptor.text.size, Descriptor.text.color)
			.then(font => bgImage.print(font, tx, ty, {text,alignmentX,alignmentY}, tw, th));
		}
		
		return bgImage;
	});
}

module.exports = {
	'meme': {
		aliases: ['caption','maymay','dankmeme'],
		category: 'Image',
		title: 'Meme Generator',
		info: 'Make a meme with some caption at the top. When using the `-macro` flag, provide top text and bottom text using quote marks.',
		parameters: ['[imageURL|memeID]','[...text]'],
		flags: ['macro'],
		fn({client, channelID, args, flags}) {
			return processImage(client, args, channelID, (image, ...text) => {
				if (flags.has('macro')) {
					let [toptext, ...bottomtext] = text;
					bottomtext = bottomtext.join(' ');
					return applyTemplate('macro', {image,toptext,bottomtext});
				} else {
					text = text.join(' ');
					return applyTemplate('blank', {image,text});
				}
			}, 'meme.jpg');
		},
		permissions: 'inclusive',
		subcommands: {
			'deepfry': {
				aliases: ['needsmorefrying','needsmoredeepfrying'],
				info: 'Deep-fry an image.',
				parameters: ['[imageURL]'],
				fn({client, args, channelID}) {
					return processImage(client, args, channelID, (image) => image.deepfry(), 'deepfry.jpg');
				}
			},
			'jpeg': {
				aliases: ['jpg', 'needsmorejpeg','needsmorejpg'],
				info: 'Adds JPEG compression to an image.',
				parameters: ['[imageURL]', '[compression]'],
				fn({client, args, channelID}) {
					return processImage(client, args, channelID, function (image, compression = random(1,20)) {
						compression = Math.minmax(compression, 1, 100);
						return image.posterize(random(20,70)).quality(compression);
					}, 'needsmorejpeg.jpg');
				}
			},
			'mojo': {
				aliases: ['watchmojo','top10'],
				info: 'Create a Top 10 meme from the Watchmojo template. Format: image, title.',
				parameters: ['[imageURL]', '[title]'],
				fn({client, args, channelID}) {
					return processImage(client, args, channelID, (image, ...title) => {
						title = title.map(capitalize).join(' ');
						return applyTemplate('watchmojo', {main: image, title});
					}, 'watchmojo.jpg');
				}
			},
			'brain': {
				aliases: ['expandingbrain','brains'],
				info: 'Create an expanding brain meme with 3 to 6 texts/images. Format: things ordered from worst to best.',
				parameters: ['...items'],
				fn({client, args, channelID}) {
					let items = resolveCSV(args,3,6);
					client.type(channelID);
					return applyTemplate('brains'+items.length, items, 'brains.jpg');
				}
			},
			'drake': {
				info: 'Create a Drake choice meme with 2 texts/images. Format: disliked thing, liked thing.',
				parameters: ['...items'],
				fn({client, args, channelID}) {
					let items = resolveCSV(args,2,2);
					client.type(channelID);
					return applyTemplate('drake', items, 'drake.jpg');
				}
			},
			'thanos': {
				info: 'Create a Thanos meme with 2 texts/images. Format: object, subject.',
				parameters: ['...items'],
				fn({client, args, channelID}) {
					let items = resolveCSV(args,2,2);
					client.type(channelID);
					return applyTemplate('thanos', items, 'thanos.jpg');
				}
			},
			'shaq': {
				aliases: ['isleep','realshit'],
				info: 'Create a sleeping Shaq meme with 2 to 3 texts/images. Format: ignored thing, woke thing, [super woke thing].',
				parameters: ['...items'],
				fn({client, args, channelID}) {
					let items = resolveCSV(args,2,3);
					client.type(channelID);
					return applyTemplate('isleep'+items.length, items, 'shaq.jpg');
				}
			},
			'ohfuck': {
				aliases: ['mindblown'],
				info: 'Create an "oh fuck" meme with text.',
				parameters: ['text'],
				fn({client, arg, channelID}) {
					client.type(channelID);
					return applyTemplate('ohfuck', [arg], 'ohfuck.jpg');
				}
			},
			'fact': {
				alises: ['facts','fax'],
				info: 'Create a fact meme with text.',	
				parameters: ['text'],
				fn({client, arg, channelID}) {
					client.type(channelID);
					return applyTemplate('fact', [arg], 'fact.jpg');
				}
			},
			'byemom': {
				aliases: ['google'],
				info: 'Google something bad while mom is away.',
				parameters: ['text'],
				fn({client, arg, channelID}) {
					client.type(channelID);
					return applyTemplate('byemom', [arg], 'byemom.jpg');
				}
			},
			'www': {
				aliases: ['whowouldwin'],
				info: 'Display the ultimate showdown between two things (text or images).',
				parameters: ['thingleft','thingright'],
				fn({client, args, channelID}) {
					let items = resolveCSV(args,2,2);
					client.type(channelID);
					return applyTemplate('whowouldwin', items, 'whowouldwin.jpg');
				}
			},
			'note': {
				aliases: ['notepass','passingnote'],
				info: 'Pass a note in class.',
				parameters: ['[noteitem]'],
				fn({client, arg, channelID}) {
					client.type(channelID);
					return applyTemplate('note', [arg], 'note.jpg');
				}
			},
			'smile': {
				aliases: ['damnsmile','damnedsmile','thatdamnsmile','thatdamnedsmile'],
				info: '"So you see, that\'s where the trouble began... That smile. That damned smile."',
				parameters: ['imageURL'],
				fn({client, args, channelID}) {
					return processImage(client, args, channelID, (image) => {
						return applyTemplate('smile', {image});
					}, 'smile.jpg');
				}
			},
			'watermark': {
				aliases: MemeWatermarkNames,
				info: 'Add one of these watermarks to an image (and optional text for some): ' + MemeWatermarkNames.map(md.code).join(', ') + '. (Tip: you can use a command alias or a parameter to specify the watermark you want)',
				parameters: ['[imageURL]', '[watermark]', '[text]'],
				fn({client, channelID, cmds, args}) {
					let cmd = cmds[cmds.length-1];
					return processImage(client, args, channelID, (image, watermark, ...text) => {
						if (MemeWatermarkNames.includes(cmd)) {
							if (watermark) text.unshift(watermark);
							watermark = cmd;
						}
						if (!watermark) {
							throw 'Please specify a watermark: ' + MemeWatermarkNames.map(md.code).join(', ');
						}
						return applyWatermark(watermark, image, text.join(' '));
					}, cmd+'.jpg');
				}
			}
		}
	}
};
