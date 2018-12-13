const fs = require('fs');

/**
 * @class Track
 * @prop url - the location of the audio source
 * @prop name - the label name to display when playing
 * Represents an item in an audio stream playlist.
 * Currently only capable of local audio files.
 * TODO: Support for YouTube/Soundcloud/attached .mp3 files
 */
class Track {
	constructor(url, name) {
		this.url  = url;
		this.name = name || url.split('/').pop();
	}
	get duration() {
		return '--:--'; // TODO: calculate the song duration
	}
	toString() {
		return this.name.replace(/\.(mp3|wav|ogg)$/,'');
	}
	read() {
		return fs.createReadStream(this.url);
	}
}

module.exports = Track;
