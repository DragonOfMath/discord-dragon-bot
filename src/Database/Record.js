const Query   = require('./Query');
const MapBase = require('../Structures/MapBase');

/**
 * @class Record
 * @extends Query(MapBase)
 * Represents a customizable table record.
 */
class Record extends Query(MapBase) {
	constructor(data = {}, fields = {}) {
		super(fields);
		Object.assign(this, data);
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
	trySet(attr, defaultVal) {
		if (this.has(attr)) {
			return;
		}
		this[attr] = defaultVal;
	}
}

module.exports = Record;
