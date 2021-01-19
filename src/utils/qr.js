const {Jimp} = require('./jimp');
const jsQR   = require('jsqr');
const QRcode = require('qrcode');

async function read(data, width, height) {
	if (typeof data === 'string') {
		try {
			data = await Jimp.read(data);
		} catch (e) {
			data = await Jimp.readAsDataURL(data);
		}
	}
	if (typeof data === 'object') {
		width  = width  ?? data.bitmap?.width  ?? data.width;
		height = height ?? data.bitmap?.height ?? data.height;
		data   = data.bitmap ?? data;
	}
	let decoded = jsQR(data, width, height);
	if (decoded) {
		return decoded.data;
	} else {
		throw 'Invalid QR code.';
	}
}

async function write(data) {
	return Jimp.readAsDataURL(QRcode.toDataURL(data));
}

module.exports.QR = {read,write};
