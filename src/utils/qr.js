const Jimp   = require('jimp');
const jsQR   = require('jsqr');
const QRcode = require('qrcode');

module.exports.QR = {
	read(image) {
		if (typeof(image) === 'string') {
			return Jimp.read(image).then(QR.read);
		} else if (image instanceof Jimp) {
			let bm = image.bitmap;
			return Promise.resolve(jsQR(bm.data, bm.height, bm.width))
			.then(decoded => decoded.data);
		} else {
			return Promise.reject('Unrecognized image or URL: ' + image);
		}
	},
	write(input) {
		return QRcode.toDataURL(input)
		.then(dataURL => Buffer.from(dataURL.substring('data:image/png;base64,'.length), 'base64'))
		.then(Jimp.read);
	}
}