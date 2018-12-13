function isInt(x) {
	return (x|0) === x && String(x).indexOf('.') == -1;
}
function isIterable(x) {
	return x instanceof Array || typeof(x) === 'string';
}

function random() {
	switch (arguments.length) {
		case 0:
			return Math.random();
		case 1:
			if (typeof(arguments[0]) === 'boolean') {
				return Math.random() < 0.5;
			}
			if (typeof(arguments[0]) === 'number') {
				var x = arguments[0] * Math.random();
				if (isInt(arguments[0])) {
					x = Math.floor(x);
				}
				return x;
			}
			if (isIterable(arguments[0])) {
				return arguments[0][random(arguments[0].length)];
			}
			if (typeof(arguments[0]) === 'object') {
				return arguments[0][random(Object.keys(arguments[0]))];
			}
		case 2:
			if (typeof(arguments[0]) === 'number' && typeof(arguments[1]) === 'number') {
				var x = arguments[0] + (arguments[1] - arguments[0]) * Math.random();
				if (isInt(arguments[0]) && isInt(arguments[1])) {
					x = Math.floor(x);
				}
				return x;
			}
		default:
			return arguments[random(arguments.length)];
	}
}

module.exports = {random,isInt,isIterable};