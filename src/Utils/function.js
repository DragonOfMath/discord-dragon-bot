/**
 * Retrieves the parameter list of a function.
 * Does not work 100% but is good enough.
 * @param {Function} func
 */
function parameters(func) {
	const WHITESPACE = /\s+/g;
	const COMMENT = /\/\/.*\n/g;
	const MULTI_COMMENT = /\/\*(?:\/\*)*\*\//g;
	const DEFAULTS = /=[^,]+/g;
	return func.toString()
	.replace('function' + (f.name?' '+f.name:'') + '(', '')
	.replace(COMMENT, '')
	.replace(WHITESPACE, '')
	.replace(MULTI_COMMENT, '')
	.split('){', 1)[0]
	.replace(DEFAULTS, '')
	.split(',');
}
/**
 * Overrides a function's context and curries arguments when called.
 */
function bind(func, context = null, ...args) {
	return func.bind(context, ...args);
}
/**
 * Passes a value through each function, returning the final result.
 */
function pipe(value, ...funcs) {
	for (let f of funcs) {
		value = f.call(this, value);
	}
	return value;
}
/**
 * Returns a new function with arguments prepared for the old function.
 */
function curry(func, ...args) {
	return function (...moreArgs) {
		return func.apply(this, [...args, ...moreArgs]);
	};
}
/**
 * Curries a function with arguments at the end of the parameter list.
 */
function curryRight(func, ...args) {
	return function (...moreArgs) {
		return func.apply(this, [...moreArgs, ...args]);
	};
}
/**
 * Calls a function with each argument transformed individually.
 */
function overArgs(func, transformFunc) {
	return function () {
		return func.apply(this, Array.from(arguments, transformFunc));
	};
}
/**
 * Call a function and assume its value is truthful, else throw an error.
 */
function assert(func, ...args) {
	var val;
	if (typeof(func) === 'function') {
		val = func(...args);
	} else {
		val = func;
	}
	if (val) {
		return val;
	} else {
		throw 'Assertion failed';
	}
}
/**
 * Call a function and ignore any errors thrown.
 */
function tryCall(func, ...args) {
	try {
		return func(...args);
	} catch (e) {
		/* error caught and ignored */
	}
}
/**
 * Call a function and return the error thrown if any.
 */
function catchCall(func, ...args) {
	try {
		func(...args);
	} catch (e) {
		return e;
	}
}
/**
 * Invoke the function in the next process tick.
 */
function defer(func, ...args) {
	setTimeout(() => func(...args), 0);
}
/**
 * Call the function with a callback signature as a Promise instead.
 */
function promisify(func, ...args) {
	return new Promise((resolve, reject) => {
		func(...args, (err, response) => {
			if (err) reject(err);
			else resolve(response);
		});
	});
}

let FP = Function.prototype;

FP.wrap = function (wrapper) {
	return wrapper(this);
};
FP.defer = function (context, ...args) {
	defer(bind(this, context), ...args);
};
FP.curry = function () {
	return curry(this, ...arguments);
};
FP.curryRight = function () {
	return curryRight(this, ...arguments);
};
FP.overArgs = function (mapper) {
	return overArgs(this, mapper);
};
FP['try'] = function (context, ...args) {
	return tryCall(bind(this, context), ...args);
};
FP['catch'] = function (context, ...args) {
	return catchCall(bind(this, context), ...args);
};

module.exports = {assert,pipe,defer,promisify,parameters,curry,curryRight,overArgs,tryCall,catchCall};
Object.assign(Function, module.exports);

/*
Object.defineProperty(FP, 'parameters', {
	get() { return parameters(this) }
});
*/
