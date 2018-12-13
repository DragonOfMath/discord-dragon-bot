/**
 * @class Query (Mixin)
 * @param {Class} Class - the class to extend
 * Mixin for basic queryable methods.
 */
module.exports = (Class) => class Query extends Class {
    /**
	 * Get the values following the key trails.
	 * Defaults to null if the target value cannot be reached.
	 * @param {String|Number|Array<String>} keys
	 * @return Object with the given key/value pairs
	 */
	GET(...keys) {
		let obj = {}, _keys;
		for (let key of keys) {
			if (typeof(key) === 'string') {
				_keys = key.split('.');
			} else {
				_keys = key;
			}
			if (key instanceof Array) {
				obj[key] = _keys.reduce((o,k) => ((o && k in o) ? o[k] : null), this);
			} else {
				obj[key] = this[key];
			}
		}
		return obj;
	}
	/**
	 * Assign values at the given key trails.
	 * Creates empty objects when it encounters an undefined destination.
	 * @param {Object} obj
	 */
	SET(obj) {
		let keys, last, o;
		for (let key in obj) {
			keys = key.split('.');
			last = keys.pop();
			o = this;
			for (let k of keys) {
				o = o[k] = k in o ? o[k] : {};
			}
			o[last] = obj[key];
		}
	}
	/**
	 * Deletes values at the end of the key trails.
	 * Breaks early if the target value cannot be reached.
	 * @param  {...String} keys 
	 */
	DELETE(...obj) {
		let keys, last, o;

		for (let key in obj) {
			keys = key.split('.');
			last = keys.pop();
			o = this;

			for (let k of keys) {
				o = o[k];
				if (o === undefined) break;
			}
			if (typeof(o) === 'object') {
				delete o[last];
			}
		}
	}
	/**
	 * Append data to each property.
	 * @param {Object} obj
	 */
	EXPAND(obj) {
		let keys = Object.keys(obj);
		for (let id in this) {
			this.SET(keys.reduce((k,o) => {o[id+'.'+k]=obj[k];return o}, {}));
		}
	}
	/**
	 * Remove data from each property.
	 * @param {Object|...String} keys
	 * If the first argument is an object, then each key/value pair will apply SHRINK to the respective properties.
	 */
	SHRINK(...keys) {
		if (typeof(keys[0]) === 'object') {
			for (let prop in keys[0]) {
				this[prop].SHRINK(...keys[0][prop]);
			}
		} else {
			for (let id in this) {
				this.DELETE(...keys.map(k => id + '.' + k));
			}
		}
	}
};
