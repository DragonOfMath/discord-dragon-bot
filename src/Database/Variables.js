/**
 * @class VariableStore
 * Store and retrieve arbitrary data using namespaces.
 * The data is temporary. If one should store them more permanently, use Database.js instead.
 */
class VariableStore {
	constructor() {
		this.globals = {};
	}
	set(namespace, name, value) {
		if (typeof(name) !== 'string') {
			throw new TypeError('Variable name required.');
		}
		if (typeof(value) === 'undefined') {
			throw new TypeError('Variable value required.');
		}
		if (namespace) {
			this[namespace] = this[namespace] || {};
			return this[namespace][name] = value;
		} else {
			return this.globals[name] = value;
		}
	}
	get(namespace, name) {
		if (namespace) {
			this[namespace] = this[namespace] || {};
			return name ? (typeof(this[namespace][name]) !== 'undefined' ? this[namespace][name] : this.globals[name]) : this[namespace];
		} else {
			return name ? this.globals[name] : this.globals;
		}
	}
	delete(namespace, name) {
		if (namespace) {
			this[namespace] = this[namespace] || {};
			return delete this[namespace][name];
		} else {
			return delete this.globals[name];
		}
	}
	clear(namespace) {
		if (namespace) {
			delete this[namespace];
		} else {
			for (let k in this.globals) {
				delete this.globals[k];
			}
		}
	}
}

module.exports = VariableStore;
