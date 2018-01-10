const MapBase = require('./MapBase');
//const {PrototypeChain} = require('./utils/prototypechain');

/**
	TypeMapBase class
	A type-strict MapBase, used to ensure objects follow a schema
*/
class TypeMapBase extends MapBase {
	constructor(T, data = {}) {
		super();
		if (typeof(T) !== 'function') {
			throw new TypeError(`${JSON.stringify(T)} is not a constructor function`);
		}
		if (T.prototype.constructor == T) {
			this.setProperty('type', T);
		} else {
			throw new TypeError(`${JSON.stringify(T)} is not a valid constructor`);
		}
		if (typeof(data) === 'object') {
			for (let k in data) {
				this.set(k , data[k]);
			}
		} else {
			throw new TypeError(`Expected a data object, instead got a ${typeof(data)}`);
		}
	}
	/**
		Override the MapBase.set() function so that values follow the type
	*/
	set(key, ...value) {
		return super.set(key, this.create(...value));
	}
	/**
		Instantiate an object of the TypeMapBase's type,
		or return the first argument if it is one already
	*/
	create() {
		// TypeMapBases can work now work for derived classes of the type
		//PrototypeChain(arguments[0]).includes(this.type.name)
		if (arguments.length == 1 && arguments[0] instanceof this.type) {
			return arguments[0];
		} else {
			return new this.type(...arguments);
		}
	}
}

module.exports = TypeMapBase;