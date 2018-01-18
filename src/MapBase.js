/**
	MapBase class
	Defines a datatype which maps enumerable values to the object using unique keys
	Functions as both an Object and an Array
	Other properties are not enumerable, but may still be read and written
	Is the base for collection-type classes such as Commands, Database, Table, etc.
*/
class MapBase {
	constructor(data = {}) {
		if (typeof(data) === 'object') {
			for (let k in data) {
				this.set(k, data[k]);
			}
		} else {
			throw new TypeError(`Expected a data object, instead got a ${typeof(data)}`);
		}
	}
	get keys() {
		return Object.keys(this);
	}
	get values() {
		return Object.values(this);
	}
	get items() {
		return this.keys.map(k => this[k]);
	}
	get length() {
		return this.keys.length;
	}
	has(key) {
		return this.keys.includes(key);
	}
	includes(value) {
		return this.items.includes(value);
	}
	set(key, value) {
		if (this.constructor.prototype.hasOwnProperty(key)) {
			throw new Error(`${this.constructor.name}.${key} cannot be overridden.`);
		}
		if (typeof(value) === 'undefined') {
			throw new TypeError(`value is undefined`);
		}
		this[key] = value;
		return this;
	}
	get(key) {
		if (this.has(key)) {
			return this[key];
		} else {
			return null;
		}
	}
	delete(key) {
		if (this.has(key)) {
			delete this[key];
		}
		return this;
	}
	clear() {
		for (let k of this.keys) {
			delete this[k];
		}
		return this;
	}
	indexOf(key) {
		return this.keys.indexOf(key)
	}
	lastIndexOf(key) {
		return this.keys.lastIndexOf(key)
	}
	entries() {
		let keys = this.keys;
		let values = this.items;
		let entries = [];
		for (let i in keys) {
			entries.push([keys[i], values[i]]);
		}
		return entries;
	}
	map(fn) {
		if (typeof(fn) !== 'function') {
			throw new TypeError(`${arguments.callee.name} requires a function.`);
		}
		return this.keys.map(k => fn(k, this[k], this));
	}
	forEach(fn) {
		if (typeof(fn) !== 'function') {
			throw new TypeError(`${arguments.callee.name} requires a function.`);
		}
		return this.keys.forEach(k => fn(k, this[k], this));
	}
	filter(fn) {
		if (typeof(fn) !== 'function') {
			throw new TypeError(`${arguments.callee.name} requires a function.`);
		}
		return this.keys.filter(k => fn(k, this[k], this));
	}
	some(fn) {
		if (typeof(fn) !== 'function') {
			throw new TypeError(`${arguments.callee.name} requires a function.`);
		}
		return this.keys.some(k => fn(k, this[k], this));
	}
	every(fn) {
		if (typeof(fn) !== 'function') {
			throw new TypeError(`${arguments.callee.name} requires a function.`);
		}
		return this.keys.every(k => fn(k, this[k], this));
	}
	find(fn) {
		if (typeof(fn) !== 'function') {
			throw new TypeError(`${arguments.callee.name} requires a function.`);
		}
		return this.keys.find(k => fn(k, this[k], this));
	}
	findIndex(fn) {
		if (typeof(fn) !== 'function') {
			throw new TypeError(`${arguments.callee.name} requires a function.`);
		}
		return this.keys.findIndex(k => fn(k, this[k], this));
	}
	reduce(fn, x) {
		if (typeof(fn) !== 'function') {
			throw new TypeError(`${arguments.callee.name} requires a function.`);
		}
		return this.keys.reduce((a, k) => fn(a, k, this[k], this), x);
	}
	matches(key, value) {
		return this.has(key) && (this[key] == value);
	}
	serialize() {
		return JSON.stringify(this);
	}
	setProperty(key, value) {
		if (typeof(key) !== 'string') {
			throw new TypeError('key must be a string');
		}
		if (typeof(value) === 'undefined') {
			throw new TypeError('value is undefined');
		}
		Object.defineProperty(this, key, {
			value,
			writable: true,
			enumerable: false
		});
		return this;
	}
	setProperties(props = {}) {
		if (typeof(props) !== 'object') {
			throw new TypeError('props must be an object');
		}
		for (let k in props) {
			props[k] = {
				value: props[k],
				writable: true,
				enumerable: false
			};
		}
		Object.defineProperties(this, props);
	}
	join(delimiter = ',') {
		return this.keys.join(delimiter);
	}
	toString(delimiter = ', ') {
		return this.keys.join(delimiter);
	}
}

module.exports = MapBase;