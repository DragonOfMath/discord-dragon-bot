const {Markdown:md,Format:fmt,Math,dirtyFraction,pascalsTriangle} = require('../../../Utils');
const Calculator = require('./Calculator');
const Polynomial = require('./Polynomial');

const MATH_TITLE = 'Math:1234:';

module.exports = {
	'math': {
		aliases: ['maths','calculate','calculator','calc'],
		category: 'Misc',
		title: MATH_TITLE,
		info: 'Mathemathical! A handy pocket calculator for Discord!',
		parameters: ['[expression]'],
		permissions: 'inclusive',
		fn({client,context,arg}) {
			let calc = new Calculator(context, arg);
			calc.startGame(client);
		},
		subcommands: {
			'sum': {
				aliases: ['summation'],
				title: MATH_TITLE + ' | Summation',
				info: 'Sums the result of f(x) where x is an integer from a to b, and f is your function. For example, `1 5 x*x` would give you 55.',
				parameters: ['from','to','...function-of-x'],
				fn({client, args}) {
					let [from, to, ...funcstr] = args;
					from = Number(from);
					to   = Number(to);
					if (isNaN(from) || isNaN(to)) {
						throw 'Arguments `from` and `to` must be numeric.';
					}
					if (to < from) {
						[to, from] = [from, to];
					}
					funcstr = funcstr.join(' ');
					let step = (from % 1 > 0 || to % 1 > 0) ? 0.01 : 1;
					let sum = Math.integration(from, to, new Function('x',`return ${funcstr}`), step);
					return `The sum of f(x) = ${funcstr} from ${from} to ${to} is **${sum}**.`;
				}
			},
			'prod': {
				aliases: ['product'],
				title: MATH_TITLE + ' | Product',
				info: 'Multiplies the result of f(x) where x is an integer from a to b, and f is your function. For example, `1 5 x` would give you 120.',
				parameters: ['from', 'to', '...function-of-x'],
				fn({client, args}) {
					let [from, to, ...funcstr] = args;
					from = Number(from);
					to   = Number(to);
					if (isNaN(from) || isNaN(to)) {
						throw 'Arguments `from` and `to` must be numeric.';
					}
					if (to < from) {
						[to, from] = [from, to];
					}
					functstr = funcstr.join(' ');
					let prod = Math.product(from, to, new Function('x',`return ${funcstr}`));
					return `The product of f(x) = ${funcstr} from ${from} to ${to} is **${prod}**.`;
				}
			},
			'factorial': {
				title: MATH_TITLE + ' | Factorial',
				info: 'Calculates the factorial of an integer.',
				parameters: ['number'],
				fn({args}) {
					let [n] = args.map(Number);
					if (isNaN(n)) {
						throw 'Argument must be numeric.';
					}
					if (n < 0) {
						throw 'Number must be greater than or equal to zero.';
					}
					if (n % 1 > 0) {
						throw 'Number must be an integer. I know, you want to see if the gamma function is implemented, well it\'s not.';
					}
					
					let f = Math.factorial(n);
					return `${n}! = **${f}**.`;
				}
			},
			'factor': {
				title: MATH_TITLE + ' | Prime Factorization',
				info: 'Find the prime factors of a number.',
				parameters: ['number'],
				fn({args}) {
					let [a] = args.map(Number);
					if (isNaN(a)) {
						throw 'Argument must be numeric.';
					}
					a = Math.abs(a);
					if (a < 4) {
						throw 'Pick a higher number please.';
					}
					let factors = Math.factorize(a);
					if (factors.length > 0) {
						return `Factors of ${a}: ${factors.join(' * ')}`;
					} else {
						return `${a} is **prime**.`;
					}
				}
			},
			'isprime':{
				title: MATH_TITLE + ' | Prime Finder',
				info: 'Determine if a given number is prime (limit is 10^8, or 100 million)',
				parameters: ['number'],
				fn({args}) {
					let [a] = args.map(Number);
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
					if (Math.prime(a)) {
						return `${a} is **prime**.`;
					} else {
						return `${a} is **not prime**.`;
					}
				}
			},
			'gcd': {
				aliases: ['greatestdivisor','greatestfactor','greatestmultiple','gcf','gcm'],
				title: MATH_TITLE + ' | Greatest Common Factor',
				info: 'Find the GCD of two numbers.',
				parameters: ['number1','number2'],
				fn({args}) {
					let [a, b] = args.map(Number);
					if (isNaN(a) || isNaN(b)) {
						throw 'Arguments must be numeric.';
					}
					let g = Math.gcd(a,b);
					return `The GCD of both ${a} and ${b} is ${md.bold(g)}.`;
				}
			},
			'pow': {
				aliases: ['power','powerof','^','exp','exponent','exponentiation'],
				title: MATH_TITLE + ' | Exponentiation',
				info: 'Calculate a base number raised to an exponent. Default is the square n = 2.',
				parameters: ['base','[exponent]'],
				fn({args}) {
					let [base,exp=2] = args.map(Number);
					if (isNaN(base) || isNaN(exp)) {
						throw 'Arguments must be numeric.';
					}
					let pow = Math.pow(base,exp);
					return `${base}^${exp} = ${md.bold(pow)}.`;
				}
			},
			'root': {
				aliases: ['sqrt','cbrt','nthroot','nroot'],
				title: MATH_TITLE + ' | Root',
				info: 'Calculate the nth root of a number. Default is the square root n = 2.',
				parameters: ['base','[n]'],
				fn({args}) {
					let [base,n=2] = args.map(Number);
					if (isNaN(base) || isNaN(n)) {
						throw 'Arguments must be numeric.';
					}
					let root = Math.root(base,n);
					return `The ${fmt.ordinal(n)} root of ${base} is ${md.bold(root)}.`;
				}
			},
			'fraction': {
				aliases: ['decimal2fraction','d2f'],
				title: MATH_TITLE + ' | Dirty Fraction',
				info: 'Convert a floating-point number to its approximated ratio (Experimental, might not work!)',
				parameters: ['[number]'],
				fn({args}) {
					let [real = Math.random()] = args;
					let {numerator,denominator} = dirtyFraction(real);
					return `${real} ≈ ${md.bold(String(numerator) + ' / ' + String(denominator))}`;
				}
			},
			'pascal': {
				aliases: ['pascaltri','pascaltriangle'],
				title: MATH_TITLE + ' | Pascal\'s Triangle',
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
			},
			'combination': {
				aliases: ['combinations', 'nchoosek'],
				title: MATH_TITLE + ' | Combination',
				info: 'Calculate the k-combinations of n items.',
				parameters: ['n', '[k]'],
				fn({args}) {
					let [n,k=1] = args.map(Number);
					return `[${n}]C[${k}] = ${md.bold(Math.combination(n,k))}`;
				}
			},
			'permutation': {
				aliases: ['permutations'],
				title: MATH_TITLE + ' | Permutation',
				info: 'Calculate the k-permutations of n items.',
				parameters: ['n','[k]'],
				fn({args}) {
					let [n,k=1] = args.map(Number);
					return `[${n}]P[${k}] = ${md.bold(Math.permutation(n,k))}`;
				}
			},
			'constant': {
				aliases: ['const'],
				title: MATH_TITLE + ' | Get Constant',
				info: 'Get a known mathematical constant.',
				parameters: ['name'],
				fn({arg}) {
					const value = Math[arg] || Math[arg.toUpperCase()];
					if (typeof(value) === 'number') {
						return `${arg} = ${value}`;
					} else {
						return 'Not a constant or not yet defined in my code.';
					}
				}
			}
		}
	},
	'pi': {
		aliases: ['π','𝜋','𝛑'],
		title: 'Pi Progress',
		info: 'Check how many digits of pi are calculated since the bot was started. Every 5 seconds, a new digit is added.',
		permissions: 'inclusive',
		fn({client}) {
			let pi = client.sessions.get('pi');
			return `Currently up to ${md.bold(pi.data.digits.length)} digits of 𝜋.`;
		},
		subcommands: {
			'digits': {
				aliases: ['get'],
				title: 'Pi Digits',
				info: 'Get a range of digits of pi. Default of 100 digits from the starting digit. Maximum of 1000 digits.',
				parameters: ['[start]','[end]'],
				fn({client,args}) {
					let pi = client.sessions.get('pi');
					let [start=0,end=100] = args;
					start = Math.max(0, Math.min(start, pi.data.digits.length));
					end = Math.max(start, Math.min(end, pi.data.digits.length, start + 1000));
					
					// output digits in lines of 100
					let output = '';
					for (let idx = start; idx < end; idx += 100) {
						output += pi.data.digits.slice(idx, idx + 100).map(String).join('') + '\n';
					}
					
					return `Digits ${start+1}-${end} of 𝜋:\n${md.codeblock(output)}`;
				}
			}
		}
	},
	'poly': {
		aliases: ['polynomial','solvepoly','solvepolynomial','roots'],
		title: MATH_TITLE + ' | Solve Polynomial',
		info: 'Attempts to solve for the roots of a polynomial. in `a_0x^n + a_1x^(n-1) + ... a_n = 0` form.',
		parameters: ['...polynomial'],
		flags: ['derive','integrate','graph'],
		permissions: 'inclusive',
		fn({client,channelID,arg,flags}) {
			
			let polynomial = Polynomial.parse(arg);
			let solutions  = polynomial.solve();
			let derivative = polynomial.derivative;
			let extrema    = derivative.solve();
			let derivative2 = derivative.derivative;
			let inflections = derivative2.solve();
			let integral = polynomial.antiderivative;
			let extrema2 = integral.solve();
			//console.log(polynomial.toString(),'->',derivative.toString(),'->',derivative2.toString());
			
			let embed = {
				title: polynomial.toString(),
				fields: []
			};
			embed.fields.push({
				name: `Solutions (${polynomial.fn} = 0)`,
				value: solutions.map(x => `${polynomial.variable} = ${x}`).join('\n') || 'None/Cannot Solve',
				inline: true
			});
			
			if (flags.has('derive')) {
				embed.fields.push({
					name: `Extrema (${derivative.fn} = 0)`,
					value: extrema.map(x => `${polynomial.fn} = ${polynomial.eval(x)} @ ${derivative.variable} = ${x}`).join('\n') || 'None/Cannot Solve',
					inline: true
				});
				embed.fields.push({
					name: `Inflections (${derivative2.fn} = 0)`,
					value: inflections.map(x => `${polynomial.fn} = ${polynomial.eval(x)} @ ${derivative2.variable} = ${x}`).join('\n') || 'None/Cannot Solve',
					inline: true
				});
			}
			if (flags.has('integrate')) {
				embed.fields.push({
					name: `Zero Sums (${integral.fn} = 0)`, // is there a better term for this?
					value: extrema2.map(x => `${polynomial.fn} = ${polynomial.eval(x)} @ ${integral.variable} = ${x}`).join('\n') || 'None/Cannot Solve',
					inline: true
				});
			}
			if (flags.has('graph')) {
				let interestingXs = [0,...solutions, ...extrema, ...inflections, ...extrema2].filter(isFinite);
				let minX = Math.min(...interestingXs) - 1;
				let maxX = Math.max(...interestingXs) + 1;
				client.type(channelID);
				return polynomial.graph(minX,maxX).image.getBufferAs('polynomial.png')
				.then(output => {
					output.embed = embed;
					return output;
				});
			} else {
				return embed;
			}
		}
	}
};
