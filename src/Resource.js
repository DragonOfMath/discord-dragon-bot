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
		this.instanceFromTemplate();
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
	instanceFromTemplate() {
		var norm = {};
		for (var k in this._template) {
			if (typeof(this._template[k]) === 'function') {
				norm[k] = null;
				continue;
			} else if (typeof(this._template[k]) === 'object') {
				norm[k] = Object.assign({}, this._template[k]);
			} else {
				norm[k] = this._template[k];
			}
		}
		this.copy(norm);
	}
	/**
		Initialize the resource by applying the data through the template.
		* First, the template's properties are applied to guarantee certain
		keys are properly initialized.
		* Second, the data's remaining properties, which the template did
		not have, are applied.
	*/
	init(data = {}) {
		var norm = {};
		for (var k in this._template) {
			if (typeof(this._template[k]) === 'function') {
				norm[k] = this._template[k](data[k], data, this);
			} else if (typeof(data[k]) !== 'undefined') {
				norm[k] = data[k];
			}
		}
		for (var k in data) {
			if (typeof(norm[k]) === 'undefined') {
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
