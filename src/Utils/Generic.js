/**
 * Represents an abstract serializable object with predictable field patterns.
 * Can construct itself based on the number and type of arguments.
 * If a field is a Generic as well, it will construct that field's object as well.
 * @class
 */
class Generic {
	/* Declare fields in subclasses. */
	
	constructor() {
		if (this.type === 'Generic') {
			throw new TypeError('Generic is abstract and should not be instantiated from directly. Use a subclass instead.');
		}
		switch (arguments.length) {
			case 0:
				// empty constructor
				this.clear();
				break;
			case 1:
				// copy constructor
				let o = arguments[0];
				if (typeof o === 'object' && o.type === this.type) {
					for (let key in o) {
						let value = o[key];
						if (typeof value === 'object') {
							if (Generic.isGeneric(value)) {
								value = Generic.from(value);
							} else {
								value = copy(value);
							}
						}
						this[key] = value;
					}
					break;
				}
			default:
				// default constructor
				for (let i = 0, keys = this.fields, key, arg; i < keys.length; i++) {
					key = keys[i];
					value = arguments[i];
					if (value && Generic.isGeneric(value)) {
						value = Generic.from(value);
					}
					this[key] = value ?? copy(this[key]);
				}
				break;
		}
	}
	get type() {
		return this.constructor.name;
	}
	get fields() {
		return Object.keys(this);
	}
	get sizeof() {
		return this.fields.length;
	}
	is(type) {
		if (typeof type === 'function') {
			return (this instanceof type);
		} else if (typeof type === 'string') {
			return (this.type === type) || (this instanceof Generic.CLASSES[type]);
		} else {
			return false;
		}
	}
	equals(o) {
		if (o.type === this.type) {
			for (let key of this.fields) {
				if (o.hasOwnProperty(key)) {
					if (Generic.isGeneric(this[key]) && !this[key].equals(o[key])) {
						return false;
					} else if (this[key] !== o[key]) {
						return false;
					}
				} else {
					return false;
				}
			}
			return true;
		} else {
			return false;
		}
	}
	clear() {
		for (let key of this.fields) {
			switch (typeof(this[key])) {
				case 'number':   this[key] = 0;     break;
				case 'string':   this[key] = '';    break;
				case 'boolean':  this[key] = false; break;
				default:         this[key] = copy(this[key]);
			}
		}
	}
	set(i,x) {
		if (i && this.hasOwnProperty(i)) {
			this[i] = x;
		} else if (i > -1 && i < this.sizeof) {
			this[this.fields[i]] = x;
		}
	}
	get(i) {
		if (i && this.hasOwnProperty(i)) {
			return this[i];
		}
		if (i > -1 && i < this.sizeof) {
			return this[this.fields[i]];
		}
		return this;
	}
	copy(o) {
		if (o.type !== this.type) {
			throw new TypeError(this.type + '.fromJSON(): cannot use data from type ' + o.type);
		}
		for (let key of this.fields) {
			if (Generic.isGeneric(o[key])) {
				this[key] = o[key].clone();
			} else {
				this[key] = o[key];
			}
		}
		return this;
	}
	clone() {
		return new this.constructor(this);
	}
	toNumber() {
		return 0;
	}
	toString() {
		return '[object ' + this.type + ']';
	}
	toBoolean() {
		return true;
	}
	toArray() {
		let a = [];
		//a.push(this.type);
		for (let key of this.fields) {
			a.push(this[key].toArray?.call(this[key]) ?? this[key]);
		}
		return a;
	}
	toObject() {
		return this.toJSON();
	}
	toJSON() {
		let o = {};
		o.type = this.type;
		for (let key of this.fields) {
			o[key] = this[key].toJSON?.call(this[key]) ?? this[key];
		}
		return o;
	}
	static from() {
		if (arguments[0].type) {
			if (arguments[0].type === this.name) {
				return new this(arguments[0]);
			} else {
				return new Generic.CLASSES[arguments[0].type](arguments[0]);
			}
		} else {
			return new this(...arguments);
		}
	}
	static isGeneric(o) {
		return (typeof o === 'object' && o !== null) && ((o instanceof Generic) || (o.type && o.type in Generic.CLASSES));
	}
	static addClass(...Classes) {
		for (let Class of Classes) {
			Generic.CLASSES[Class.name] = Class;
		}
	}
}

function copy(o) {
	if (typeof o === 'function') {
		if (o.prototype.constructor === o) {
			return new o();
		} else {
			return o;
		}
	} else if (typeof o === 'object') {
		if (Array.isArray(o)) {
			return o.slice();
		} else if (typeof o.clone === 'function') {
			return o.clone();
		} else {
			return JSON.parse(JSON.stringify(o));
		}
	} else {
		return o;
	}
}

Generic.CLASSES = {};

module.exports = {Generic};
