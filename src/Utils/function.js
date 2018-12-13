function pipe(value, ...functions) {
	for (let f of functions) {
		value = f(value);
	}
	return value;
}
function defer(func, ...args) {
	setTimeout(() => func(...args), 0);
}
function promisify(f, ...args) {
	return new Promise((resolve, reject) => {
		f(...args, (err, response) => {
			if (err) reject(err);
			else resolve(response);
		});
	});
}

module.exports = {pipe,defer,promisify};
