Math.TAU = 2 * Math.PI;
Math.radToDeg = function radToDeg(r) {
	return r * 180 / Math.PI;
};
Math.degToRad = function degToRad(d) {
	return d * Math.PI / 180;
};
Math.minmax = function minmax(x,min,max) {
	return Math.max(min, Math.min(x, max));
};
Math.modulo = function modulo(x,n) {
	return ((x % n) + n) % n;
};
// https://en.wikipedia.org/wiki/De_Moivre%27s_formula
Math.complexPow = function complexPow(zReal, zImag, power) {
	var r = Math.exp(Math.log(zReal * zReal + zImag * zImag) * power / 2);
	var t = Math.atan2(zImag, zReal);
	return {
		real: r * Math.cos(t * power),
		imag: r * Math.sin(t * power)
	};
};

module.exports = {Math};
