const gifwrap = require('gifwrap');
const FilePromise = require('../../Structures/FilePromise');
const {Jimp,GIF,Gif,GifError} = require('../../Utils');

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
	if (images[0].toLowerCase().replace(/\?.+/,'').endsWith('.gif')) {
		image = await GIF.read(images[0]);
	} else {
		image = await Jimp.read(images[0]);
	}
	
	try {
		let result = await callback(image, ...args);
		return getImageBufferObject(result, filename);
	} catch (e) {
		if (e instanceof GifError) {
			e = e.message;
		}
		throw e;
	}
}
async function processImages(client, args, channelID, limit = 2, callback, filename) {
	let images = await getImageArgs(client, args, channelID);
	if (!images.length) throw 'No images found.';
	
	if (channelID) client.type(channelID);
	
	images = await Promise.all(images.slice(0,limit).map(Jimp.read));
	
	let result = await callback(images, ...args);
	return getImageBufferObject(result, filename);
}
function getImageBufferObject(image, filename) {
	if (image instanceof Jimp) {
		return image.getBufferAs(filename);
	} else if (image instanceof Gif) {
		return {file: image.buffer, filename };
	} else if (image instanceof Buffer) {
		return { file: image, filename };
	} else {
		return image;
	}
}

module.exports = {
	isImage,
	getImageArgs,
	processImage,
	processImages
};
