const BigNum = require('bignumber.js');

/**
 * Streams digits of pi ad infinitum.
 *
 * Haskell program from http://www.cs.ox.ac.uk/people/jeremy.gibbons/publications/spigot.pdf
 * > pi = g(1,0,1,1,3,3) where
 * >   g(q,r,t,k,n,l) = if 4*q+r-t<n*t
 * >     then n : g(10*q,10*(r-n*t),t,k,div(10*(3*q+r))t-10*n,l)
 * >     else g(q*k,(2*q+r)*l,t*l,k+1,div(q*(7*k+2)+r*l)(t*l),l+2)
 *
 * Requires arbitrary precision arithmetic to compensate for unbounded memory.
 * Without which, within a few iterations the maximum floating-point precision is reached and incorrect digits are yielded.
 */
function* pi() {
	let q = new BigNum(1), r = new BigNum(0), t = new BigNum(1), k = 1, n = 3, l = 3;
	while (true) {
		//console.log(q,r,t,k,n,l);
		if (q.times(4).plus(r).minus(t).isLessThan(t.times(n))) {
			yield n; // the digit
			[q,r,n] = [
				q.times(10),
				r.minus(t.times(n)).times(10),
				q.times(3).plus(r).times(10).idiv(t).minus(n * 10).toNumber(),
			];
		} else {
			[q,r,t,k,n,l] = [
				q.times(k),
				q.times(2).plus(r).times(l),
				t.times(l),
				k + 1,
				q.times(7 * k + 2).plus(r.times(l)).idiv(t.times(l)).toNumber(),
				l + 2
			];
		}
	}
}

module.exports = pi;

/**
 * Incrementally yields digits with finite pre-allocated memory.
 * Limited to a desired number of digits.
 * Derived from http://www.cs.ox.ac.uk/people/jeremy.gibbons/publications/spigot.pdf
 * @param {Number} [digits=2000] - the desired number of digits of pi
 * @param {Number} [perIteration=4] - the number of digits to yield each iteration (max 10)
 */ 
function* spigotPi(digits = 2000, perIteration = 4) {
	perIteration = Math.max(1, Math.min(perIteration, 10));
	
	const n = Math.pow(10, perIteration);
	let boundary = 14 * Math.floor(digits / perIteration);
	let t = Array(boundary).fill(n / 5);
	let sum = 0, remainder = 0;
	do {
		let i = boundary, g = 2 * boundary - 1;
		do {
			sum *= i;
			sum += t[i] * n;
			t[i] = sum % g;
			sum /= g;
			g -= 2;
		} while (--i);
		yield String(remainder+sum/n).padStart(perIteration,'0');
		remainder = sum % n;
		sum = remainder;
		boundary -= 14;
	} while (boundary > 0);
}

