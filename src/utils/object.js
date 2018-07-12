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

module.exports = {Object};
