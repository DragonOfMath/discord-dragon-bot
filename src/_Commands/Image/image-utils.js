const gifwrap = require('gifwrap');
const FilePromise = require('../../Structures/FilePromise');
const {Jimp,Gif,GifUtil} = require('../../Utils');

function isImage(img) {
	try {
		return img instanceof Jimp || /png|jpe?g|gif/i.test(img.split('.').pop().split('?')[0]);
	} catch (e) { return false; }
}
async function getImageArgs(client, args, channelID) {
	let images = [];
	while (isImage(args[0])) {
		images.push(args.shift());
	}
	if (channelID) {
		let messages = await client.getMessages({channelID,limit:30});
		for (let message of messages) {
			if (message.attachments.length && isImage(message.attachments[0].url)) {
				images.push(message.attachments[0].url);
			} else if (message.embeds.length && isImage(message.embeds[0].url)) {
				images.push(message.embeds[0].url);
			} else if (message.embeds.length && message.embeds[0].image) {
				images.push(message.embeds[0].image.url);
			}
		}
	}
	return images;
}
async function processImage(client, args, channelID, callback, filename) {
	let images = await getImageArgs(client, args, channelID);
	if (!images.length) throw 'No images found.';
	
	if (channelID) client.type(channelID);
	
	let image;
	if (images[0].endsWith('.gif')) {
		image = await FilePromise.read(images[0], 'binary');
		image = await GifUtil.read(image);
	} else {
		image = await Jimp.read(images[0]);
	}
	
	let result = await callback(image, ...args);
	if (result instanceof Jimp) {
		return result.getBufferAs(filename);
	} else if (result instanceof Gif) {
		return {file: result.buffer, filename };
	} else if (result instanceof Buffer) {
		return { file: result, filename };
	} else {
		return result;
	}
}
async function processImages(client, args, channelID, limit = 2, callback, filename) {
	let images = await getImageArgs(client, args, channelID);
	if (!images.length) throw 'No images found.';
	
	if (channelID) client.type(channelID);
	
	images = await Promise.all(images.slice(0,limit).map(Jimp.read));
	let result = await callback(images, ...args);
	if (result instanceof Jimp) {
		return result.getBufferAs(filename);
	} else if (result instanceof Buffer) {
		return { file: buffer, filename };
	} else {
		return result;
	}
}

module.exports = {isImage,getImageArgs,processImage,processImages};
