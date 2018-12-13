class Media {
	constructor(url, width, height) {
		this.url    = url;
		this.width  = width;
		this.height = height;
	}
	get size() {
		return `${this.width}x${this.height}`;
	}
}

module.exports = Media;
