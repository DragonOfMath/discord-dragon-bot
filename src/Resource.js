/**
	Resource class
	Defines a data type whose properties can be reproduced or copied from an object.
	Useful for database records that have multiple optional object fields.
	
	Extend this class such that subclasses pass a template as the first argument
	of super() and their initialization data as the second argument. 
*/
class Resource {
	constructor(template = {}, data = {}) {
		// cache template
		this.makeProp('_template', template);
		
		/**
			Instantiate the resource by copying the template to itself.
			Ignore functions as those will be used for generating attributes
			from data next.
		*/
		var norm = (function copy(o, c = {}) {
			if (typeof(o) === 'object') for (var k in o) {
				var v = o[k];
				switch (typeof(v)) {
					case 'function':
						c[k] = null;
						break;
					case 'object':
						if (Array.isArray(v)) {
							c[k] = v.slice();
						} else {
							c[k] = copy(v);
						}
						break;
					default:
						c[k] = v;
				}
			}
			return c;
		})(this._template);
		//console.log(norm);
		/**
			Apply the data through the template.
			* Template functions return normalized values
			* Template objects merge with the init data
			* Remaining properties are merged with the normalized object
		*/
		for (var k in norm) {
			if (typeof(this._template[k]) === 'function') {
				norm[k] = this._template[k](data[k], data, this);
			} else if (typeof(v) === 'object') {
				norm[k] = Object.assign(norm[k], data[k]);
			} else if (k in data) {
				norm[k] = data[k];
			}
		}
		for (var k in data) {
			if (typeof(norm[k]) === 'undefined') {
				norm[k] = data[k];
			}
		}
		/**
			Assign the key/values of an object to this instance.
		*/
		Object.assign(this, norm);
	}
	/**
		Create a non-enumerable property.
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
		Creates an object which only has key/values different than the template's,
		so that when it the resource is instantiated again, it will change the
		fewest values necessary.
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
