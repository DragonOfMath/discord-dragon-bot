function cast(x) {
	if (x === 'true' || x === 'false' || x == 'NaN' || x == 'null' || x == 'undefined') {
		return eval(x);
	} else if (x == Number(x)) {
		var intX = parseInt(x);
		var floatX = parseFloat(x);
		if (floatX === intX && intX >= Number.MIN_SAFE_INTEGER && intX <= Number.MAX_SAFE_INTEGER) {
			return intX;
		} else if (floatX !== intX && floatX >= Number.MIN_VALUE && floatX <= Number.MAX_VALUE) {
			return floatX;
		}
	}
	return x;
}

module.exports = {cast};
