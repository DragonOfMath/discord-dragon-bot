const {Jimp,Color} = require('../../../Utils');

const PLACE_NAME = 'place.png';
const PLACE_DIR = __dirname +  '/' + PLACE_NAME;
const PLACE_SIZE = 256;
const PLACE_DISPLAY_SIZE = 1024;

class Place {
	constructor(image) {
		this.image = image;
	}
	save() {
		this.image.write(PLACE_DIR);
		return this;
	}
	set(color, x, y) {
		color = Color.resolve(color);
		x = Math.max(0, Math.min(x, this.image.bitmap.width));
		y = Math.max(0, Math.min(y, this.image.bitmap.height));
		this.image.setPixelColor(color, x, y);
	}
	get() {
		return this.image.resize(PLACE_DISPLAY_SIZE, PLACE_DISPLAY_SIZE).getBufferAsync(Jimp.MIME_PNG)
		.then(buffer => {
			return {filename: PLACE_NAME, file: buffer};
		});
	}
	reset(size = PLACE_SIZE) {
		this.image.fill(0xFFFFFFFF);
		return this;
	}
	static load() {
		return Jimp.read(PLACE_DIR)
		.catch(() => new Jimp(PLACE_SIZE, PLACE_SIZE))
		.then(image => new Place(image));
	}
}

// cooldown between pixel changes
Place.COOLDOWN = 30000;
Place.SIZE = PLACE_SIZE;

module.exports = Place;
