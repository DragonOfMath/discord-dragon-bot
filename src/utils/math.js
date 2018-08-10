Math.EPSILON = 0.01;
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
Math.summation = function summation(a,b,f) {
	let sum = 0;
	for (let x = a; x <= b; x++) {
		sum += f(x);
	}
	return sum;
};
Math.integration = function integration(a,b,f,dx = Math.EPSILON) {
	let sum = 0;
	for (let x = a; x <=b; x += dx) {
		sum += f(x) * dx;
	}
	return sum;
};
Math.product = function product(a,b,f) {
	let prod = 1;
	for (let x = a; x <= b; x++) {
		prod *= f(x);
	}
	return prod;
};
Math.factorial = function factorial(x) {
	let f = 1;
	if (x) while (f *= x, --x);
	return f;
};
Math.factorize = function factorize(x) {
	let f = [];
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
};
Math.prime = function prime(x) {
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
};
Math.primesUpTo = function primesUpTo(x) {
	for (var n = 3, primes = [2], factor; n <= x; n += 2) {
		if (primes.every(p => n % p)) {
			primes.push(n);
		}
	}
	return primes;
};
Math.gcd = function gcd(a,b) {
	// Euclidean algorithm
	while (a != b) {
		if (a > b)
			a -= b;
		else
			b -= a;
	}
	return a;
};
Math.root = function root(x,n) {
	if (n == 2) {
		return Math.sqrt(x);
	} else if (n == 3) {
		return Math.cbrt(x);
	} else {
		// https://en.wikipedia.org/wiki/Nth_root_algorithm
		let sign = Math.sign(x);
		let odd  = n % 2;
		if (sign < 0 && !odd) return NaN;
		x = Math.abs(x);
		let root = 1;
		let prev = 0;
		while (Math.abs(root-prev) > Math.epsilon) {
			prev = root;
			root += (x / Math.pow(root, n - 1) - root) / n;
		}
		root *= sign;
		return root;
	}
};

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

module.exports = {Math,pascalsTriangle};
