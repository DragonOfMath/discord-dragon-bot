const {Math} = require('../../../Utils');
const Graph  = require('../../Image/Graph/Graph');

class Term {
	constructor(coefficient = 1, variable = 'x', exponent = 0) {
		this.coefficient = coefficient;
		this.variable    = variable;
		this.exponent    = exponent;
	}
	get sign() {
		return Math.sign(this.coefficient);
	}
	get derivative() {
		if (this.exponent) {
			return new Term(this.coefficient * this.exponent, this.variable, this.exponent - 1);
		} else {
			return new Term(0);
		}
	}
	get antiderivative() {
		if (this.exponent < 0) {
			throw 'Invalid exponent';
		} else {
			return new Term(this.coefficient / (this.exponent + 1), this.variable, this.exponent + 1);
		}
	}
	get conjugate() {
		return new Term(-this.coefficient, this.variable, this.exponent);
	}
	get odd() {
		return Math.abs(this.exponent % 2) == 1;
	}
	get even() {
		return this.exponent % 2 == 0;
	}
	like(term) {
		return this.variable == term.variable && this.exponent == term.exponent;
	}
	add(term) {
		if (this.variable != term.variable) {
			throw new Error(`Mismatching term variables: ${this.toString()} + ${term.toString()}`);
		}
		if (this.exponent != term.exponent) {
			throw new Error(`Mismatching term exponents: ${this.toString()} + ${term.toString()}`);
		}
		this.coefficient += term.coefficient;
		if (this.coefficient == 0) {
			this.exponent = 0;
		}
		return this;
	}
	eval(x) {
		if (this.exponent) {
			return this.coefficient * Math.pow(x, this.exponent);
		} else {
			return this.coefficient;
		}
	}
	toString(plusSign) {
		let str = (plusSign && this.sign >= 0) ? '+' : '';
		str += String(this.coefficient);
		if (this.variable && this.exponent) {
			str += this.variable;
			if (Math.abs(this.exponent) > 1) {
				str += '^' + this.exponent;
			}
		}
		return str;
	}
	static parse(term) {
		let coefficient, variable, exponent;
		if (/^[+-\d]+/.test(term)) {
			coefficient = Number(term.match(/^([+-\d]+)/)[1]);
		}
		if (isNaN(coefficient)) {
			coefficient = term.startsWith('-') ? -1 : 1;
		}
		if (/[a-zA-Z]/.test(term)) {
			variable = term.match(/([a-zA-Z])/)[1];
			if (/\w\^\d+$/.test(term)) {
				exponent = Number(term.match(/(\d+)$/)[1]);
			} else {
				exponent = 1;
			}
		}
		return new Term(coefficient, variable, exponent);
	}
}

function countSignChanges(terms) {
	let signChanges = 0;
	for (let i = 0; i < terms.length - 1; i++) {
		if (terms[i].sign != terms[i+1].sign) signChanges++;
	}
	return signChanges;
}
function ruleOfSigns(polynomial) {
	let roots = {
		positive: [],
		negative: [],
		imaginary: []
	};
	
	// for positive solutions, count the sign changes in the original polynomial terms
	let x = countSignChanges(polynomial.terms);
	do {
		roots.positive.push(x);
		x -= 2;
	} while (x > 0);
	
	// for negative solutions, count the sign changes when the odd degree terms in the polynomial are negated
	x = countSignChanges(polynomial.terms.map(t => t.odd ? t.conjugate : t));
	do {
		roots.negative.push(x);
		x -= 2;
	} while (x > 0);
	
	// the maximum number of imaginary roots has to be whatever is left over
	x = Math.max(0, polynomial.degree - (roots.positive[roots.positive.length-1] + roots.negative[roots.negative.length-1]));
	do {
		roots.imaginary.push(x);
		x -= 2;
	} while (x > 0);
	
	return roots;
}
function generatePQTable(polynomial, descartes) {
	let p = polynomial.terms[polynomial.terms.length-1].coefficient;
	let q = polynomial.terms[0].coefficient;
	
	let table = {p,q,possibilities:[0]};
	
	let pFactors = Math.factorize(p);
	let qFactors = Math.factorize(q);
	
	//console.log('Factors of p:', pFactors);
	//console.log('Factors of q:', qFactors);
	
	for (p of pFactors) {
		for (q of qFactors) {
			let x = Math.abs(p/q);
			if (descartes.positive[0] && !table.possibilities.includes(x)) {
				table.possibilities.push(x);
			}
			if (descartes.negative[0] && !table.possibilities.includes(-x)) {
				table.possibilities.push(-x);
			}
		}
	}
	return table;
}
function isZero(x) {
	return Math.abs(x) < Math.EPSILON;
}
function isEqual(x,y) {
	return isZero(x-y);
}
function syntheticDivision(coeffs, x) {
	for (let i = 1; i < coeffs.length; i++) {
		coeffs[i] += x * coeffs[i-1];
	}
	return coeffs[coeffs.length-1];
}
function newton(polynomial, x = 0, iterations = 10) {
	let derivative = polynomial.derivative, y, dy;
	do {
		y = polynomial.eval(x);
		if (isZero(y)) return x;
		dy = derivative.eval(x);
		x -= y / dy;
		iterations--;
	} while (iterations > 0);
}

class Polynomial {
	constructor(terms = [], order = 0) {
		this.terms = terms;
		this.order = order;
	}
	get fn() {
		if (this.order < 0) {
			return `${"∫".repeat(Math.abs(this.order))} f(${this.variable}) d${this.variable}^${Math.abs(this.order)}`;
		} else {
			return `f${"'".repeat(this.order)}(${this.variable})`;
		}
	}
	get variable() {
		return this.terms[0].variable;
	}
	get degree() {
		return Math.max(...this.terms.map(t => t.exponent));
	}
	get derivative() {
		return new Polynomial(this.terms.map(t => t.derivative).filter(t => t.coefficient != 0), this.order + 1);
	}
	get antiderivative() {
		var poly = new Polynomial(this.terms.map(t => t.antiderivative), this.order + 1);
		poly.constant = 0; // + C
		return poly;
	}
	get constant() {
		try {
			return this.find(t => t.exponent == 0).coefficient;
		} catch (e) {
			return 0;
		}
	}
	set constant(x) {
		try {
			return this.find(t => t.exponent == 0).coefficient = x;
		} catch (e) {
			this.terms.push(new Term(x,this.variable,0));
		}
	}
	eval(x) {
		return this.terms.reduce((sum,term) => sum += term.eval(x), 0);
	}
	sortTerms() {
		this.terms = this.terms.sort((t1,t2) => (t1.exponent < t2.exponent ? 1 : t1.exponent > t2.exponent ? -1 : 0));
	}
	combineLikeTerms() {
		for (let i = 0; i < this.terms.length - 1;) {
			if (this.terms[i].like(this.terms[i+1])) {
				this.terms[i].add(this.terms[i+1]);
				this.terms.splice(i+1, 1);
			} else {
				i++;
			}
		}
	}
	removeZeroTerms() {
		for (let i = 0; i < this.terms.length;) {
			if (this.terms[i].coefficient == 0) {
				this.terms.splice(i, 1);
			} else {
				i++;
			}
		}
	}
	simplify() {
		this.sortTerms();
		this.combineLikeTerms();
		this.removeZeroTerms();
	}
	expand() {
		let degree = this.degree;
		for (let i = 0; degree > -1; i++, degree--) {
			if (this.terms[i]) {
				if (this.terms[i].exponent != degree) {
					this.terms.splice(i, 0, new Term(0, this.variable, degree));
				}
			} else {
				this.terms.push(new Term(0, this.variable, degree));
			}
		}
	}
	solve() {
		//console.log('Original:', this.terms);
		
		// sort terms in descending degree, combine like terms, and remove zero coefficients
		this.simplify();
		
		//console.log('Simplified:', this.terms);
		
		// ensure all integer degrees between the highest and lowest are accounted for
		this.expand();
		
		//console.log('Expanded:', this.terms);
		
		// use Descartes' rule of signs to estimate how many positive, negative, and imaginary solutions there are
		let roots = ruleOfSigns(this);
		//console.log('Descartes\' Rule of Signs:', roots);
		
		// generate a list of possible solutions
		let table = generatePQTable(this, roots);
		//console.log('P/Q Table:', table);
		
		let solutions = [];
		function addRoot(x) {
			if (!solutions.some(v => isEqual(v,x))) solutions.push(x);
		}
		
		let coeffs = this.terms.map(t => t.coefficient);
		//console.log('Coefficients:',coeffs);
		let temp, root, zero;
		while (table.possibilities.length && coeffs.length > 3) {
			temp = coeffs.slice();
			root = table.possibilities[0];
			zero = syntheticDivision(temp, root);
			if (isZero(zero)) {
				coeffs = temp.slice(0, temp.length - 1);
				//console.log('New Coefficients:',coeffs);
				addRoot(root);
			} else {
				// not a valid root, so discard it
				table.possibilities.shift();
				
				// however, try newton's method to evaluate the root iteratively
				root = newton(this, root);
				//console.log('Newton root:', root);
				
				if (typeof(root) == 'number') {
					zero = this.eval(root);
					if (isZero(zero)) {
						addRoot(root);
					}
				}
			}
		}
		
		if (solutions.length == this.degree-2 && coeffs.length == 3) {
			let [a,b,c] = coeffs;
			if (b*b < 4*a*c) {
				addRoot(`(${-b}+i√${4*a*c-b*b})/${2*a}`);
				addRoot(`(${-b}-i√${4*a*c-b*b})/${2*a}`);
			} else {
				addRoot((-b+Math.sqrt(b*b-4*a*c))/(2*a));
				addRoot((-b-Math.sqrt(b*b-4*a*c))/(2*a));
			}
		} else if (solutions.length == this.degree-1 && coeffs.length == 2) {
			let [a,b] = coeffs;
			addRoot(-b/a);
		}
		
		return solutions;
	}
	graph(from=-10,to=10,step=0.1) {
		let data = [];
		for (let x = from; x <= to; x += step) {
			data.push([x,this.eval(x)]);
		}
		return Graph.createLineGraph(data,{title:this.toString(),xaxis:this.variable,yaxis:this.fn,intervalY:1,origin:true,grid:true});
	}
	toString() {
		return this.fn + ' = ' + this.terms.map((t,i) => t.toString(!!i)).join('');
	}
	static parse(polynomial) {
		let tokens = [], token = '';
		for (let i = 0, letter; i < polynomial.length; i++) {
			letter = polynomial[i];
			if (letter == '+' || letter == '-') {
				if (token) tokens.push(token);
				token = letter;
			} else if (letter != ' ') {
				token += letter;
			}
		}
		if (token) tokens.push(token);
		
		let poly = new Polynomial();
		for (token of tokens) {
			let term = Term.parse(token);
			if (term) poly.terms.push(term);
		}
		return poly;
	}
}

Polynomial.Term = Term;

module.exports = Polynomial;
