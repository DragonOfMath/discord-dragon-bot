const MapBase = require('./MapBase');

/**
	Record class
	Represents a customizable table record
*/
class Record extends MapBase {
	constructor(data = {}, fields = {}) {
		super(fields);
		for (let k in data) {
			this[k] = data[k];
		}
	}
	get fields() {
		return this.keys;
	}
	getAll(attrs = {}) {
		for (let k in attrs) {
			attrs[k] = this[k] || attrs[k];
		}
		return attrs;
	}
	setAll(attrs = {}) {
		for (let k in attrs) {
			this[k] = attrs[k] || this[k];
		}
		return this;
	}
	tryGet(attr, defaultVal) {
		if (!this.has(attr)) {
			this[attr] = defaultVal;
		}
		return this[attr];
	}
}

module.exports = Record;