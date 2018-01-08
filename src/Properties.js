const MapBase = require('./MapBase.js');

class Properties extends MapBase {
	constructor(data = {}, parent) {
		super(data);
		this.setProperty('parent', parent);
	}
	get props() {
		return this.keys;
	}
	inherit(properties) {
		if (!(properties instanceof Properties)) {
			properties = new Properties(properties);
		}
		for (let k in properties) {
			this.set(k, properties[k]);
		}
	}
	toString() {
		return this.props.map(x => `${x}=${this[x]}`).join(', ') || 'No properties set';
	}
}

module.exports = Properties;
