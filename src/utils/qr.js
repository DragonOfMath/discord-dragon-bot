const jimp   = require('jimp');
const jsQR   = require('jsqr');
const QRcode = require('qrcode');

module.exports.QR = {
	read(image) {
		if (typeof(image) === 'string') {
			return Jimp.read(image).then(QR.read);
		} else if (image instanceof Jimp) {
			let bm = image.bitmap;
			return Promise.resolve(jsQR(bm.data, bm.height, bm.width));
		} else {
			return Promise.reject('Unrecognized image or URL: ' + image);
		}
	},
	write(input) {
		return QRcode.toDataURL(input).then(Jimp.read);
	}
}