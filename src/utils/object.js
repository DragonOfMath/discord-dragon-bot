/**
 * Combines a base object with a source object, copying keys and running functions.
 * @param {Object} [z] - the base object
 * @param {Object} src - the source object
 * @returns the combined Object
 */
Object.zip = function (z = {}, src) {
	if (Array.isArray(src) && !Array.isArray(z)) z = [];
	for (const key in src) {
		if (typeof(src[key]) === 'function') {
			z[key] = src[key](z[key], z, src);
		} else if (typeof(src[key]) === 'object') {
			z[key] = Object.zip(z[key], src[key]);
		} else {
			z[key] = key in z ? z[key] : src[key];
		}
	}
	return z;
};
/**
 * Maps the key/values of an object.
 * @param {Object} o - the object
 * @param {Function} cb - the map function
 * @returns Array of mapped values
 */
Object.map = function (o, cb) {
	return Object.keys(o).map((k,i) => cb.call(o,o[k],k,i));
};
/**
 * Assigns the keys to themselves so that every value is co-linked with each other.
 * @param {Object} map - the object containing two or more objects
 * @returns the Object passed to it, but now with every key co-linked
 */
Object.colink = function (map) {
	let keys = Object.keys(map);
	for (let k1 = 0; k1 < keys.length - 1; k1++) {
		for (let k2 = k1 + 1; k2 < keys.length; k2++) {
			map[keys[k1]][keys[k2]] = map[keys[k2]];
			map[keys[k2]][keys[k1]] = map[keys[k1]];
		}
	}
	return map;
};
/**
 * Determines which keys are added, deleted, changed, on unchanged between two objects.
 * @param {Object} newObj - the newer object
 * @param {Object} oldObj - the older object
 * @return {Object} The difference as an object with four keys for each of the change states.
 */
Object.diff = function (newObj, oldObj) {
	let diff = {
		added: {},
		deleted: {},
		changed: {},
		unchanged: {}
	};
	for (let key in newObj) {
		if (!oldObj[key]) {
			diff.added[key] = newObj[key];
		} else if (JSON.stringify(newObj[key]) == JSON.stringify(oldObj[key])) {
			diff.unchanged[key] = newObj[key];
		} else {
			diff.changed[key] = newObj[key];
		}
	}
	for (let key in oldObj) {
		if (!newObj[key]) {
			diff.deleted[key] = oldObj[key];
		}
	}
	return diff;
};

function PrototypeChain(obj = null) {
	var chain = [];
	while (obj != null) {
		switch (typeof(obj)) {
			case 'function':
				chain.push(obj.name);
				break;
			case 'object':
				chain.push(obj.constructor.name);
				break;
			default:
				chain.push(typeof(obj));
		}
		obj = Object.getPrototypeOf(obj);
	}
	chain.push('null');
	return chain;
}

module.exports = {
	Object,
	PrototypeChain
};
