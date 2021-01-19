const PROTECTED = [
	'constructor',
	'prototype',
	'__proto__',
	'name',
	'toString',
	'toLocaleString',
	'valueOf',
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable'
];

/* https://stackoverflow.com/a/30158566 */
function props(obj) {
	var p = [];
	for (; obj != null; obj = Object.getPrototypeOf(obj)) {
		var op = Object.getOwnPropertyNames(obj);
		for (var i=0; i<op.length; i++)
			if (p.indexOf(op[i]) == -1)
				p.push(op[i]);
	}
	return p;
}

/**
	Function that extends a base class with the methods of one or more other classes
	The constructor of the base stays loyal to its parent, however.
*/
function extendClass(Base, ...Classes) {
	for (var C of Classes) {
		console.log(Base,"+",C);
		if (C.prototype.constructor == C) {
			for (var method in C) {
				console.log("Adding",method,"from",C.name,"to",Base.name);
				if (PROTECTED.includes(method)) {
					continue;
				} else {
					Base[method] = C[method];
				}
			}
			for (var method in C.prototype) {
				console.log("Adding",method,"from the prototype of",C.name,"to the prototype of",Base.name);
				if (PROTECTED.includes(method)) {
					continue;
				} else {
					Base.prototype[method] = C.prototype[method];
				}
			}
		} else {
			throw new TypeError(`${Base.name} could not be extended with ${typeof(C)}`);
		}
	}
	return Base;
}

function extend(object, data) {
	for (var key in data) {
		if (data.hasOwnProperty(key)) {
			var prop = Object.getOwnPropertyDescriptor(data, key);
			prop.enumerable = false;
			Object.defineProperty(object, key, prop);
		}
	}
	return object;
}

module.exports = {extendClass, extend};
