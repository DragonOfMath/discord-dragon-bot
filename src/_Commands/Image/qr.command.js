const {QR} = require('../../Utils');
const {processImage} = require('./image-utils');

module.exports = {
	'qr': {
		category: 'Image',
		title: 'QR Code',
		info: 'https://en.wikipedia.org/wiki/QR_code',
		permissions: 'inclusive',
		analytics: false,
		subcommands: {
			'decode': {
				aliases: ['read','decrypt','unhack'],
				title: 'QR Reader',
				info: 'Read a QR code from the input image.',
				parameters: ['[imageURL]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, QR.read);
				}
			},
			'encode': {
				aliases: ['write','encrypt','hack'],
				title: 'QR Writer',
				info: 'Write input text to a QR image file. (Note: emojis will not be preserved)',
				parameters: ['...text'],
				fn({client, channelID, arg}) {
					return QR.write(arg).then(image => image.getBufferAs('qr.png'));
				}
			}
		}
	}
};
