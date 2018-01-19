/**
	Resource class
	Defines a data type whose properties can be reproduced or copied from an object.
	Useful for database records that have multiple optional object fields.
	
	Extend this class such that subclasses pass a template as the first argument
	of super() and their initialization data as the second argument. 
*/
class Resource {
	constructor(template = {}, data = {}) {
		this.makeProp('_template', template);
		this.create();
		this.init(data);
	}
	/**
		Assign the key/values of an object to this instance.
	*/
	copy(o = {}) {
		Object.assign(this, o);
	}
	/**
		Instantiate the resource by copying the template to itself.
		Ignore functions as those will be used for generating attributes
		from data.
	*/
	create() {
		var norm = {};
		for (var k in this._template) {
			if (typeof(this._template[k]) === 'function') {
				continue;
			} else {
				norm[k] = this._template[k];
			}
		}
		this.copy(norm);
	}
	/**
		Initialize the resource by applying the data through the template.
	*/
	init(data = {}) {
		var norm = {};
		for (var k in data) {
			if (typeof(this._template[k]) === 'function') {
				norm[k] = this._template[k](data[k], data, this);
			} else {
				norm[k] = data[k];
			}
		}
		this.copy(norm);
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
