Math.EPSILON = Math['ɛ'] = Math['ϵ'] = Math['ɛ'] = 0.01;
Math['π'] = Math['𝜋'] = Math['𝛑'] = Math.PI;
Math.TAU = Math['τ'] = 2 * Math.PI;
Math.GOLDEN_RATIO = Math.PHI = Math['φ'] = (1 + Math.sqrt(5)) / 2;
Math.INFINITY = Math['∞'] = Infinity;

/**
 * Safely evaluate an expression using known Math properties and methods.
 * Cannot use variables.
 * @param {String} expression
 */
const JS_RESERVED = ['function','return','if','else','for','while','do','switch','case','break','continue'];
Math.evaluate = Math.eval = function evaluate(expression) {
	expression = expression.replace(/[a-zA-Z]+/g, str => {
		if (str.toUpperCase() in Math) {
			return str.toUpperCase();
		} else if (str.toLowerCase() in Math) {
			return str.toLowerCase();
		} else if (JS_RESERVED.includes(str)) {
			return str;
		} else {
			throw new SyntaxError('Invalid Math property/method or keyword: ' + str);
		}
	});
	return eval(`with (Math) {${expression}}`);
};

function radToDeg(r) {
	return r * 180 / Math.PI;
}
function degToRad(d) {
	return d * Math.PI / 180;
}
function minmax(x,min,max) {
	return Math.max(min, Math.min(x, max));
}
function average(data) {
	return data.reduce((sum,a) => sum += a, 0) / data.length;
}
function standardDeviation(data) {
	if (data.length > 1) {
		let avg = Math.average(...data);
		let sumOfSquares = data.reduce((sum,x) => sum += Math.pow(avg - x, 2), 0);
		return Math.sqrt(sumOfSquares / (data.length-1));
	} else {
		return NaN;
	}
}
function modulo(x,n) {
	return ((x % n) + n) % n;
}
function step(x) {
	return x > 0 ? 1 : 0;
}
function factorial(x) {
	let f = 1;
	if (x) while (f *= x, --x);
	return f;
}
function factorize(x) {
	x = Math.abs(x);
	let f = [1];
	let p = 2;
	while (x > 1) {
		if (x % p == 0) {
			f.push(p);
			x /= p;
		} else {
			p++;
		}
	}
	return f;
}
function prime(x) {
	if (x % 2 == 0) {
		return false;
	}
	var root = Math.ceil(Math.sqrt(x));
	for (var n = 3; n < root; n += 2) {
		if (x % n == 0) {
			return false;
		}
	}
	return true;
}
function primesUpTo(x) {
	for (var n = 3, primes = [2]; n <= x; n += 2) {
		if (primes.every(p => n % p)) {
			primes.push(n);
		}
	}
	return primes;
}
// https://en.wikipedia.org/wiki/De_Moivre%27s_formula
function complexPow(zReal, zImag, power) {
	var r = Math.exp(Math.log(zReal * zReal + zImag * zImag) * power / 2);
	var t = Math.atan2(zImag, zReal);
	return {
		real: r * Math.cos(t * power),
		imag: r * Math.sin(t * power)
	};
}
function summation(a,b,f) {
	let sum = 0;
	for (let x = a; x <= b; x++) {
		sum += f(x);
	}
	return sum;
}
function integration(a,b,f,dx = Math.EPSILON) {
	let sum = 0;
	for (let x = a; x <=b; x += dx) {
		sum += f(x) * dx;
	}
	return sum;
}
function product(a,b,f) {
	let prod = 1;
	for (let x = a; x <= b; x++) {
		prod *= f(x);
	}
	return prod;
}
function gcd(a,b) {
	// Euclidean algorithm
	while (a != b) {
		if (a > b)
			a -= b;
		else
			b -= a;
	}
	return a;
}
function root(x,n) {
	if (n == 2) {
		return Math.sqrt(x);
	} else if (n == 3) {
		return Math.cbrt(x);
	} else {
		// https://en.wikipedia.org/wiki/Nth_root_algorithm
		let sign = Math.sign(x);
		if (sign < 0 && n % 2 == 0) return NaN;
		x = Math.abs(x);
		let root = 1;
		let prev = 0;
		while (Math.abs(root-prev) > Math.EPSILON) {
			prev = root;
			root += (x / Math.pow(root, n - 1) - root) / n;
		}
		root *= sign;
		return root;
	}
}
/**
 * Calculates the binomial coefficient C = n! / k!(n - k)!
 * @param {Number} n
 * @param {Number} k
 */
function combination(n, k = 1) {
	if (k > n) {
		return 0;
	}
	let numerator   = 1;
	let denominator = 1;
	for (let i = 0; i < k; i++) {
		numerator   *= n - i;
		denominator *= i + 1;
	}
	return Math.floor(numerator / denominator);
}
/**
 * Calculates P = n! / (n - k)!
 * @param {Number} n
 * @param {Number} k
 */
function permutation(n, k = 1) {
	if (k > n) {
		return 0;
	}
	let p = 1;
	for (let i = 0; i < k; i++) {
		p *= n - i;
	}
	return p;
}
function manhattan(x0, y0, x1, y1) {
	return Math.abs(x0 - x1) + Math.abs(y0 - y1);
}
function interp(a0, a1, w) {
	return a0 + (a1 - a0) * w;
}
function quantize(x,q) {
	return Math.floor(x / q) * q;
}
function pascalsTriangle(N) {
	var rows = [[1]];
	for (var n = 0, k, lastRow, row; n < N; ++n) {
		lastRow = rows[n];
		for (k = 0, row = []; k < lastRow.length + 1; ++k) {
			row.push((lastRow[k-1]|0) + (lastRow[k]|0));
		}
		rows.push(row);
	}
	return rows;
}
// find N and D such that X = N/D
function dirtyFraction(x) {
	let numerator = x;
	let denominator = 1;
	
	// turn each part of the fraction into whole numbers
	while (numerator % 1 != 0) {
		numerator   *= 10;
		denominator *= 10;
	}
	
	// ensure floating points don't ruin this
	numerator = Math.round(numerator);
	denominator = Math.round(denominator);
	
	// find the greatest common factor
	let factor = Math.gcd(numerator,denominator);
	
	// divide the parts by their greatest common factor
	numerator   /= factor;
	denominator /= factor;
	
	return {numerator,denominator};
}


module.exports = {
	radToDeg,
	degToRad,
	minmax,
	average,
	standardDeviation,
	modulo,
	step,
	complexPow,
	summation,
	integration,
	product,
	factorial,
	factorize,
	prime,
	primesUpTo,
	gcd,
	root,
	combination,
	combo: combination,
	coefficient: combination,
	permutation,
	manhattan,
	interp,
	quantize,
	pascalsTriangle,
	dirtyFraction
};

module.exports.Math = Object.assign(Math, module.exports);
