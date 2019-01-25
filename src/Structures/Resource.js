/**
 * @class Resource
 * Defines a data type whose properties can be reproduced or copied from an object.
 * Useful for database records that have multiple optional object fields.
 * Extend this class such that subclasses pass a template as the first argument
 * of super() and their initialization data as the second argument. 
 */
class Resource {
	constructor(template = {}, data = {}) {
		// cache template
		this.makeProp('_template', template);
		Object.assign(this, (function zip(t = {}, d = {}) {
			let o = {};
			for (let k in t) {
				if (typeof(t[k]) === 'function') {
					o[k] = t[k](d[k]);
				} else if (typeof(t[k]) === 'object') {
					if (t[k] == null) {
						o[k] = t[k];
					} else if (Array.isArray(t[k])) {
						o[k] = k in d ? d[k] : [].slice.call(t[k]);
					} else {
						o[k] = zip(t[k], d[k]);
					}
				} else {
					o[k] = k in d ? d[k] : t[k];
				}
			}
			for (let k in d) {
				if (o[k] === undefined || o[k] == null) {
					o[k] = d[k];
				}
			}
			return o;
		})(template, data));
	}
	/**
	 * Create a non-enumerable property.
	 */
	makeProp(prop, value) {
		Object.defineProperty(this, prop, {
			value,
			enumerable: false,
			writable: true,
			configurable: true
		});
	}
	/**
	 * Creates an object which only has key/values different than the template's,
	 * so that when it the resource is instantiated again, it will change the
	 * fewest values necessary.
	 */
	minimize() {
		var minimized = {};
		for (var key in this) {
			if (this[key] != this._template[key]) {
				minimized[key] = this[key];
			}
		}
		return minimized;
	}
}

module.exports = Resource;
