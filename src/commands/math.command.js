/**
	Command file for math-related commands.
*/

const {Markdown:md} = require('../Utils');

function summation(a,b,f) {
	let sum = 0;
	for (let x = a; x <= b; x++) {
		sum += f(x);
	}
	return sum;
}
function integration(a,b,f,dx = 0.01) {
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
function factorial(x) {
	let f = 1;
	if (x) while (f *= x, --x);
	return f;
}
function factorize(x) {
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
	for (var n = 3, primes = [2], factor; n <= x; n += 2) {
		if (primes.every(p => n % p)) {
			primes.push(n);
		}
	}
	return primes;
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

module.exports = {
	'math': {
		aliases: ['maths'],
		category: 'Fun',
		title: 'Math:1234:',
		info: 'Mathemathical! Get a factorial, find a prime, calculate a sum, and more.',
		permissions: 'inclusive',
		analytics: false,
		subcommands: {
			'sum': {
				aliases: ['summation'],
				title: 'Math:1234:',
				info: 'Sums the result of f(x) where x is an integer from a to b, and f is your function. For example, `1 5 x*x` would give you 55.',
				parameters: ['from','to','...function-of-x'],
				fn({client, args}) {
					let [from, to, ...funcstr] = args;
					from = Number(from);
					to   = Number(to);
					if (to < from) {
						[to, from] = [from, to];
					}
					funcstr = funcstr.join(' ');
					let step = (from % 1 > 0 || to % 1 > 0) ? 0.01 : 1;
					let sum = integration(from, to, new Function('x',`return ${funcstr}`), step);
					return `The sum of f(x) = ${funcstr} from ${from} to ${to} is **${sum}**.`;
				}
			},
			'prod': {
				aliases: ['product'],
				title: 'Math:1234:',
				info: 'Multiplies the result of f(x) where x is an integer from a to b, and f is your function. For example, `1 5 x` would give you 120.',
				parameters: ['from', 'to', '...function-of-x'],
				fn({client, args}) {
					let [from, to, ...funcstr] = args;
					from = Number(from);
					to   = Number(to);
					if (isNaN(from)) {
						throw '`from` argument must be numeric.';
					}
					if (isNaN(to)) {
						throw '`to` argument must be numeric.';
					}
					if (to < from) {
						[to, from] = [from, to];
					}
					functstr = funcstr.join(' ');
					let prod = product(from, to, new Function('x',`return ${funcstr}`));
					return `The product of f(x) = ${funcstr} from ${from} to ${to} is **${prod}**.`;
				}
			},
			'factorial': {
				title: 'Math:1234: | Factorial',
				info: 'Calculates the factorial of an integer.',
				parameters: ['number'],
				fn({args}) {
					let [n] = args;
					n = Number(n);
					if (isNaN(n)) {
						throw 'Argument must be numeric.';
					}
					if (n < 0) {
						throw 'Number must be greater than or equal to zero.';
					}
					if (n % 1 > 0) {
						throw 'Number must be an integer. I know, you want to see if the gamma function is implemented, well it\'s not.';
					}
					
					let f = factorial(n);
					return `${n}! = **${f}**.`;
				}
			},
			'factor': {
				title: 'Math:1234: | Prime Factorization',
				info: 'Find the prime factors of a number.',
				parameters: ['number'],
				fn({args}) {
					let [a] = args;
					a = Number(a);
					if (isNaN(a)) {
						throw 'Argument must be numeric.';
					}
					a = Math.abs(a);
					if (a < 4) {
						throw 'Pick a higher number please.';
					}
					let factors = factorize(a);
					if (factors.length > 0) {
						return `Factors of ${a}: ${factors.join(' * ')}`;
					} else {
						return `${a} is **prime**.`;
					}
				}
			},
			'isprime':{
				title: 'Math:1234: | Prime Finder',
				info: 'Determine if a given number is prime (limit is 10^8, or 100 million)',
				parameters: ['number'],
				fn({args}) {
					let [a] = args;
					a = Number(a);
					if (isNaN(a)) {
						throw 'Argument must be numeric.';
					}
					a = Math.max(1,Math.min(~~a,1e8));
					if (a == 1) {
						throw 'Pick a higher number please.';
					}
					if (a % 2 == 0) {
						return `${a} is **an even number**.`;
					}
					if (prime(a)) {
						return `${a} is **prime**.`;
					} else {
						return `${a} is **not prime**.`;
					}
				}
			},
			'gcd': {
				aliases: ['greatestdivisor','greatestfactor','greatestmultiple','gcf','gcm'],
				title: 'Math:1234: | Greatest Common Factor',
				info: 'Find the GCD of two numbers.',
				parameters: ['number1','number2'],
				fn({args}) {
					let [a, b] = args;
					a = Number(a);
					b = Number(b);
					if (isNaN(a) || isNaN(b)) {
						throw 'Arguments must be numeric.';
					}
					let g = gcd(a,b);
					return `The GCD of both ${a} and ${b} is **${g}**.`;
				}
			},
			'fraction': {
				aliases: ['decimal2fraction','d2f'],
				title: 'Math:1234: | Dirty Fraction',
				info: 'Convert a floating-point number to its approximated ratio (Experimental, might not work!)',
				parameters: ['[number]'],
				fn({args}) {
					let [real = Math.random()] = args;
					// turn each part of the fraction into whole numbers
					let numerator = real;
					let denominator = 1;
					while (numerator % 1 != 0) {
						numerator *= 10;
						denominator *= 10;
					}
					// ensure floating points don't ruin this
					numerator = Math.round(numerator);
					denominator = Math.round(denominator);
					
					// find the greatest common factor
					let factor = gcd(numerator,denominator);
					
					// divide the parts by their greatest common factor
					numerator   /= factor;
					denominator /= factor;
					
					return `${real} is approximately **${numerator} / ${denominator}**`;
				}
			},
			'pascal': {
				aliases: ['pascaltri','pascaltriangle'],
				title: 'Math:1234: | Pascal\'s Triangle',
				info: 'Calculate a few rows of Pascal\'s Triangle. You can specify the *Nth* row to display.',
				parameters: ['[N]'],
				fn({args}) {
					var triangle = pascalsTriangle(args[0] || 5);
					if (triangle.length > 10) {
						return 'Row ' + (triangle.length-1) + ':\n' + md.codeblock(triangle[triangle.length-1].join(' '));
					} else {
						return md.codeblock(triangle.map(n => n.join(' ')).join('\n'));
					}
				}
			}
		}
	}
};
