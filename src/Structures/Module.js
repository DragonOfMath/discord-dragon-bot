const MapBase = require('./MapBase');

/**
 * @class Module
 * @extends MapBase
 * Wrapper class for JS file contents.
 */
class Module extends MapBase {
	constructor(filename, data) {
		super(data);
		this.setProperty('filename', filename);
	}
	require() {
		let data = require(this.filename);
		for (let k in data) {
			this.set(k, data[k]);
		}
	}
}

module.exports = Module;
