const {Generic} = require('./Generic');
const {parameters} = require('./Function');
const {Color,ColorGradient} = require('./Color');
const {Jimp} = require('./jimp');

/**
 * Defines a complex number of the form a + bi and is able to perform arithmetic with these numbers.
 * @class
 * @extends Generic
 * @prop {Number} r - the real component of the complex number
 * @prop {Number} i - the imaginary component of the complex number
 */
class Complex extends Generic {
	r = 0; i = 0;
	
	// aliases for the components
	get a() {
		return this.r;
	}
	set a(a) {
		this.r = a;
	}
	get b() {
		return this.i;
	}
	set b(b) {
		this.i = b;
	}
	real() {
		return new Complex(this.r, 0);
	}
	imaginary() {
		return new Complex(0, this.i);
	}
	magnitude() {
		return Math.hypot(this.r, this.i);
	}
	// Gauss
	norm() {
		return this.r * this.r + this.i * this.i;
	}
	// Cauchy
	arg() {
		return Math.atan2(this.i, this.r);
	}
	// Argand
	direction() {
		let phi = this.arg();
		return new Complex(Math.cos(phi), Math.sin(phi));
	}
	abs() {
		return new Complex(Math.abs(this.r), Math.abs(this.i));
	}
	negate() {
		return new Complex(-this.r, -this.i);
	}
	// a+bi -> a-bi
	conjugate() {
		return new Complex(this.r, -this.i);
	}
	// z -> 1/z
	recip() {
		let n = this.norm();
		return new Complex(this.r/n, -this.i/n);
	}
	set(c) {
		this.r = c.r;
		this.i = c.i;
		return this;
	}
	add(c) {
		if (c instanceof Complex) {
			return new Complex(this.r+c.r,this.i+c.i);
		} else {
			return new Complex(this.r+c,this.i);
		}
	}
	sub(c) {
		if (c instanceof Complex) {
			return new Complex(this.r-c.r,this.i-c.i);
		} else {
			return new Complex(this.r-c,this.i);
		}
	}
	mul(c) {
		if (c instanceof Complex) {
			// (a+bi)*(c+di) = ac + adi + bci - bd = (ac - bd) + (ad + bc)i
			return new Complex((this.r*c.r-this.i*c.i),(this.r*c.i+this.i*c.r));
		} else {
			return new Complex(this.r*c,this.i*c);
		}
	}
	div(c) {
		if (c instanceof Complex) {
			//(a+bi)/(c+di) = ((a+bi)*(c-di))/((c+di)*(c-di)) = ((ac+bd)+(bc-ad)i)/(c^2+d^2)
			let d = c.conjugate();
			return this.mul(d).div(c.mul(d).r);
		} else {
			return new Complex(this.r/c,this.i/c);
		}
	}
	sqr() {
		return new Complex(this.r*this.r-this.i*this.i,2*this.r*this.i);
	}
	pow(e) {
		if (e instanceof Complex) {
			// z^w = e^(ln(z^w)) = e^(w*ln(z))
			return this.log().mul(e).exp();
		} else if (e > 0) {
			return Complex.fromEuler(this.norm() ** (e / 2), this.arg() * e);
		} else {
			return Complex.fromEuler(this.magnitude() ** e, this.arg() * e);
		}
	}
	exp() {
		return Complex.fromEuler(Math.exp(this.r), this.i);
	}
	sqrt(k=0) {
		return Complex.fromEuler(this.norm() ** (1 / 4), (this.arg() + 2 * Math.PI * k) / 2);
	}
	cbrt(k=0) {
		return Complex.fromEuler(this.norm() ** (1 / 6), (this.arg() + 2 * Math.PI * k) / 3);
	}
	root(n,k=0) {
		if (n instanceof Complex) {
			return this.pow(n.recip());
		} else {
			return Complex.fromEuler(this.norm() ** (1 / (2 * n)), (this.arg() + 2 * Math.PI * k) / n);
		}
	}
	log(k=0) {
		// ln z = ln |z| + it
		return new Complex(Math.log(this.norm()) / 2, this.arg() + 2 * Math.PI * k);
	}
	distance(c) {
		return this.sub(c).magnitude();
	}
	sin() {
		return new Complex(Math.sin(this.r) * Math.cosh(this.i), Math.cos(this.r) * Math.sinh(this.i));
	}
	cos() {
		return new Complex(Math.cos(this.r) * Math.cosh(this.i), -Math.sin(this.r) * Math.sinh(this.i));
	}
	tan() {
		return this.sin().div(this.cos());
	}
	cot() {
		return this.cos().div(this.sin());
	}
	sec() {
		return this.cos().recip();
	}
	csc() {
		return this.sin().recip();
	}
	sinh() {
		return this.exp().sub(this.negate().exp()).div(2);
	}
	cosh() {
		return this.exp().add(this.negate().exp()).div(2);
	}
	tanh() {
		let twoExp = this.mul(2).exp();
		return twoExp.sub(1).div(twoExp.add(1));
	}
	coth() {
		let twoExp = this.mul(2).exp();
		return twoExp.add(1).div(twoExp.sub(1));
	}
	sech() {
		return this.cosh().recip();
	}
	csch() {
		return this.sinh().recip();
	}
	equals(c) {
		if (c instanceof Complex) {
			return this.r === c.r && this.i === c.i;
		} else {
			return this.r === c && this.i === 0;
		}
	}
	isNaN() {
		return isNaN(this.r) || isNaN(this.i);
	}
	isFinite() {
		return isFinite(this.r) && isFinite(this.i);
	}
	toNumber() {
		return this.magnitude();
	}
	toString() {
		if (this.i > 0) {
			return `${this.r.toFixed(6)}+${this.i.toFixed(6)}i`;
		} else if (this.i < 0) {
			return `${this.r.toFixed(6)}-${Math.abs(this.i).toFixed(6)}i`;
		} else {
			return this.r.toFixed(6);
		}
	}
	// see ComplexShader for settings
	toColor({hue=0,saturation=1,lightness=0.25,effect='fade',fieldLines=8,gridPattern=false,gridSpacing=1,gridThickness=0.01,gridVisibility=1}={}) {
		if (this.isNaN()) {
			return Color.BLACK;
		}
		if (!this.isFinite()) {
			return Color.WHITE;
		}
		
		// https://en.wikipedia.org/wiki/Domain_coloring
		let t = this.arg(), d = this.magnitude();
		hue += Math.radToDeg(t);
		switch (effect) {
			case 'fade':
				// fade color the farther a point is
				lightness += d / (d + 1);
				break;
			case 'logarithm':
				lightness += Math.modulo(Math.log(1 + d)/Math.LN2, 1) / 2;
				break;
			case 'cycle':
				// cycle lightness based on the logarithmic distance from origin
				lightness += Math.abs(1 - Math.modulo(2 * Math.log(1 + d), 2)) / 2;
				break;
		}
		if (fieldLines > 0) {
			lightness += Math.cos(t * fieldLines / 2) ** 1000;
		}
		if (gridPattern && Math.min(Math.modulo(this.r,gridSpacing),Math.modulo(this.i,gridSpacing)) < gridThickness) {
			lightness -= gridVisibility;
		}
		return Color.hsl(hue,saturation,lightness);
	}
	
	/* Static Methods */
	
	static magnitude(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.magnitude();
	}
	static abs(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.abs();
	}
	static norm(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.norm();
	}
	static arg(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.arg();
	}
	static direction(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.direction();
	}
	static negate(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.negate();
	}
	static conjugate(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.conjugate();
	}
	static recip(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.recip();
	}
	static add(a,b) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.add(b);
	}
	static sub(a,b) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.sub(b);
	}
	static mul(a,b) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.mul(b);
	}
	static div(a,b) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.div(b);
	}
	static pow(a,b) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.pow(b);
	}
	static sqr(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.sqr();
	}
	static exp(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		// e^z = lim as n->inf (1+z/n)^n
		return a.exp();
	}
	static sqrt(a,n=1) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.sqrt(n);
	}
	static cbrt(a,n=1) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.cbrt(n);
	}
	static root(a,n=2,k=0) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.root(n,k);
	}
	static log(a,k=1) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.log(k);
	}
	static sin(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.sin();
	}
	static cos(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.cos();
	}
	static tan(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.tan();
	}
	static cot(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.cot();
	}
	static sec(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.sec();
	}
	static csc(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.csc();
	}
	static sinh(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.sinh();
	}
	static cosh(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.cosh();
	}
	static tanh(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.tanh();
	}
	static coth(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.coth();
	}
	static sech(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.sech();
	}
	static csch(a) {
		if (!(a instanceof Complex)) {
			a = new Complex(a);
		}
		return a.csch();
	}
	static cis(t) {
		// https://en.wikipedia.org/wiki/Cis_(mathematics)
		return new Complex(Math.cos(t), Math.sin(t));
	}
	static fromEuler(r,t) {
		// (a+bi) = r*e^(it) = r*(cos(t)+isin(t)) where r = hypot(a,b) and t = atan2(b,a)
		// https://en.wikipedia.org/wiki/Euler%27s_formula
		return new Complex(r * Math.cos(t), r * Math.sin(t));
	}
	static rootOfUnity(n,k) {
		// https://en.wikipedia.org/wiki/Root_of_unity
		k = Math.max(0,Math.min(k,n-1));
		return this.fromEuler(1,(0+2*Math.PI*k)/n);
	}
	static real(r) {
		if (r instanceof Complex) {
			return new Complex(r.r,0);
		} else {
			return new Complex(r,0);
		}
	}
	static imaginary(i) {
		if (i instanceof Complex) {
			return new Complex(0,i.i);
		} else {
			return new Complex(0,i);
		}
	}
	static fromArgs(r,i) {
		return new Complex(r,i);
	}
	static fromNumber(n) {
		return new Complex(n);
	}
	static fromString(n) {
		let c = new Complex();
		let nums = n.match(/-?\s*\d*.?\d*i?/g);
		if (nums) for (let num of nums) {
			num = num.replace(/\s+/g, '');
			if (num.endsWith('i')) {
				num = num.substring(0,num.length-1);
				if (!num || num == '-') num += '1';
				c.i += Number(num);
			} else {
				c.r += Number(num);
			}
		}
		return c;
	}
	static fromArray(a) {
		return new Complex(a[0], a[1]);
	}
	static fromObject(o) {
		return new Complex(o.real ?? o.r ?? o.x, o.imaginary ?? o.imag ?? o.i ?? o.y);
	}
	static parse(x,y) {
		if (typeof x === 'number') {
			if (typeof y === 'number') {
				return this.fromArgs(x,y);
			} else {
				return this.fromNumber(x);
			}
		} else if (typeof x === 'string') {
			return this.fromString(x);
		} else if (typeof x === 'object') {
			if (Array.isArray(x)) {
				return this.fromArray(x);
			} else if (x instanceof Complex) {
				return x;
			} else {
				return this.fromObject(x);
			}
		} else {
			return new Complex();
		}
	}
}

// complex constants
Complex.ZERO = new Complex(0,0);
Complex.ONE  = new Complex(1,0);
Complex.I    = new Complex(0,1);
Complex.E    = new Complex(Math.E);
Complex.PI   = new Complex(Math.PI);

// maps operators to their respective Complex function call
const OP_MAP = {'+':'add','-':'sub','*':'mul','/':'div','^':'pow','**':'pow'};
// functions which are both in Math and Complex
const UNIVERSAL_FUNCS = ['abs','sin','cos','tan','cot','sec','csc','sinh','cosh','tanh','coth','sech','csch','log','exp','sqrt','cbrt','root','pow'];
// functions which are in Complex exclusively and return Complex values
const COMPLEX_FUNCS = ['sqr','conjugate','add','sub','mul','div','real','imaginary'];
// functions in Complex which return real values
const COMPLEX_TO_REAL_FUNCS = ['magnitude','arg','norm'];

function wrap(x,w='()') {
	return w[0] + x + w[1];
}
function makeCaller(funcName,args) {
	return funcName + wrap(args.join(','));
}
function makeArrow(args,source,block=false) {
	return wrap(args.join(',')) + ' => ' + block ? wrap('return ' + source,'{}') : source;
}

/**
 * A function which can turn complex arithmetic into runnable javascript.
 * @class
 * @prop {Array<String>}   params   - the parameter list
 * @prop {String}          source   - the source arithmetic expression, ex: z^3-1
 * @prop {String}          compiled - the compiled expression as Complex-compatible code
 * @prop {Function}        fn       - the executable function
 * @prop {ComplexFunction} df       - the derivative of this function, if provided; else, it is numerically calculated
 */
class ComplexFunction {
	source;
	compiled;
	params;
	fn;
	df;
	/**
	 * Can receive an object with the following keys:
	 * @param {Array<String>}   obj.params
	 * @param {String}          obj.source
	 * @param {String}          [obj.compiled]
	 * @param {Function}        [obj.fn]
	 * @param {String|Object|Function} [obj.df]
	 * Or can compile code with the following arguments:
	 * @param {Array<String>} ...params
	 * @param {String}        source
	 */
	constructor() {
		if (typeof arguments[0] === 'object') {
			// singleton or ComplexFunction passed, copy values
			this.params   = arguments[0].params     ?? arguments[0].args ?? ['z'];
			this.source   = arguments[0].source     ?? arguments[0].src;
			this.compiled = arguments[0].compiled   ?? arguments[0].cmp;
			this.fn       = arguments[0].func       ?? arguments[0].fn;
			this.df       = arguments[0].derivative ?? arguments[0].df;
		} else if (typeof arguments[0] === 'function') {
			// only function passed; no source or compiled version given
			this.params   = parameters(arguments[0]);
			this.fn       = arguments[0];
			this.df       = null;
		} else if (arguments.length) {
			// parameter list similar to new Function()
			this.params   = Array.from(arguments);
			this.source   = this.params.pop();
			this.fn       = null;
			this.df       = null;
		} else {
			// identity function
			this.params   = ['z'];
			this.source   = 'z';
			this.compiled = 'z';
			this.fn       = z => z;
			this.df       = {fn: z => Complex.ONE};
		}
		if (!this.compiled && this.source) {
			this.compiled = ComplexFunction.parse(this.source, this.params, true);
		}
		if (!this.fn && this.compiled) {
			this.fn = new Function('Complex', 'return function('+this.params.join(',')+') {return ' + this.compiled + '};')(Complex);
		}
		if (this.fn(...this.params.map(p => new Complex())) instanceof Complex) {
			// the function must be Complex -> Complex
		} else {
			throw new Error('Complex function does not output a Complex number.');
		}
		if (typeof(this.df) === 'string') {
			this.df = { params: this.params, source: this.df };
		}
		if (typeof(this.df) === 'object' && this.df !== null && !(this.df instanceof ComplexFunction)) {
			this.df = new ComplexFunction(this.df);
		}
	}
	get derivative() {
		return this.df?.fn;
	}
	set derivative(fn) {
		if (typeof(fn) === 'string') {
			this.df = new ComplexFunction(...this.params, fn);
		} else if (typeof(fn) === 'function') {
			this.df = new ComplexFunction({params: this.params, fn});
		} else if (typeof(fn) === 'object') {
			if (fn instanceof ComplexFunction) {
				this.df = fn;
			} else {
				this.df = new ComplexFunction(fn);
			}
		}
	}
	/**
	 * Evaluates the complex function with the given parameters.
	 */
	evaluate() {
		return this.fn(...arguments);
	}
	/**
	 * Returns the derivative of this ComplexFunction
	 * @param {Number} [h=1e-7] - a small value for numeric derivation if needed
	 */
	derive(h = 1e-7) {
		let hr = 1/h;
		return this.derivative ?? (this.derivative = (z, ...args) => {
			// numeric derivative
			return this.fn(z.sub(2*h), ...args)
			  .sub(this.fn(z.add(2*h), ...args))
			  .add(this.fn(z.add(  h), ...args)
			  .sub(this.fn(z.sub(  h), ...args)).mul(8))
			  .mul(hr/12);
		});
	}
	/**
	 * Repeat this function up to a number of iterations or until a separate condition is met.
	 * The first argument z will be replaced by the output of the current iteration to be used in the next iteration.
	 * Yields values of z as it gets iterated and returns the final value of z.
	 * @param {Array<Complex>} args            - the argument list of Complex numbers, starting with z
	 * @param {Object} [opts={}]               - options for iterating the function
	 * @param {Number} [opts.maxIterations=20] - the iteration limit
	 * @param {Number} [opts.escapeRadius=2]   - the radius for escaping the function's attraction
	 * @returns The final value of z
	 */
	*iterate(args, opts = {}) {
		var z = args.shift();
		var d = opts.maxIterations ?? opts.i ?? 20;
		var r = opts.escapeRadius  ?? opts.r ?? 2, r=r*r; // square the radius for easier calculations
		for (var i = 0, f = this.fn; i < d && z.norm() < r; ++i) {
			yield z = f(z, ...args);
		}
		return z;
	}
	/**
	 * Adapatation of https://github.com/scijs/newton-raphson-method/blob/master/index.js
	 * Generates a root of the function by repeating the Newton-Raphson method, or returns null if
	 * a root cannot be converged upon due to cyclic behavior or a first derivative of zero at z.
	 * Yields the values of z as the method iterates so that outside functions may use it.
	 * @param {Array<Complex>} args - the function's arguments, where the first one is z
	 * @param {Object} [opts={}] - options for finding a root
	 * @param {Number} [opts.epsilon] - a double-precision float for small values
	 * @param {Number} [opts.maxIterations] - the integer limit of iterations before stopping
	 * @param {Number} [opts.tolerance] - the tolerance threshold for convergence, smaller is more precise but may take more iterations
	 * @param {Number} [opts.multiplicity] - the multiplier for f(z)/f'(z) which may speed up convergence or cause chaotic chasing.
	 * @param {Boolean} [opts.verbose] - log details about the result of this method, when it converged or why it didn't
	 * @returns the root if found as a Complex object, or null if no convergence
	 */
	*newton(args, opts = {}) {
		var z = args.shift();
		var eps = opts.epsilon ?? opts.eps ?? ops.e ?? 2.220446e-16;
		var max = opts.maxIterations ?? opts.max ?? opts.i ?? 20;
		var tol = opts.tolerance ?? opts.tol ?? opts.t ?? 1e-7;
		var m   = opts.multiplicity ?? opts.m ?? 1; // may be complex too
		var verbose = opts.verbose ?? false;
		for (var i = 0, f = this.fn, df = this.derivative, fz, dz, prev = z; i < max; i++) {
			fz = f(z,...args);
			dz = df(z,...args);
			if (dz.magnitude() <= eps * fz.magnitude()) {
				if (verbose) {
					console.log('NR: convergence failed due to near-zero first derivative.');
				}
				return null;
			}
			// get next iteration of z
			yield z = z.sub(z0.div(z1).mul(m));
			// check with previous value
			if (z.sub(prev).magnitude() <= tol * z.magnitude()) {
				if (verbose) {
					console.log('NR: converged to ' + z + ' after ' + i + ' iterations.');
				}
				return z;
			}
			prev = z;
		}
		if (verbose) {
			console.log('NR: max iterations reached without convergence');
		}
		return null;
	}
	/**
	 * Serializes this function to JSON so that it may be reconstructed back to a function.
	 */
	toJSON() {
		let data = {};
		data.params   = this.params.slice();
		data.source   = this.source;
		data.compiled = this.compiled;
		if (this.derivative && this.derivative instanceof ComplexFunction) {
			data.derivative = this.derivative.toJSON();
		}
		return data;
	}
	/**
	 * Creates a ComplexFunction with the same parameters and the given source.
	 * @param {String} source
	 */
	recompile(source) {
		return new ComplexFunction(...this.params, source);
	}
	static from(data) {
		if (typeof data === 'function') {
			if (data instanceof ComplexFunction) {
				// this use case is no longer possible because ComplexFunction does not inherit from Function
				return new ComplexFunction(data.toJSON());
			} else {
				return new ComplexFunction(data);
			}
		}
		if (typeof data === 'object' && data.params && data.source) {
			if (data.compiled) {
				return new ComplexFunction(data);
			} else {
				return new ComplexFunction(...data.params, data.source);
			}
		} else {
			throw 'Cannot instantiate ComplexFunction without parameters and source';
		}
	}
	/**
	 * Parses a Complex arithmetic expression and compiles to runnable code string, which takes Complex numbers as input and returns a Complex.
	 * @param {String} expr - the expression to parse.
	 * @param {Array<String>} [vars] - the variables used in the arithmetic.
	 * @param {Boolean} [stringOnly=false] - return only the compiled code as a string; if false, returns an arrow function that can run the code.
	 */
	static parse(expr,vars=['z','c'],stringOnly=false) {
		const {Tokenizer,Token} = require('./parsing');
		let tokens = new Tokenizer().parse(expr).postfix().map(token => {
			token.complex = false;
			return token;
		});
		
		function makeOp(op,...args) {
			if (args.some(a => a.complex)) {
				return makeComplexOp(op,...args);
			} else {
				return makeMathOp(op,...args);
			}
		}
		function makeComplexOp(op,...args) {
			//console.log('Complex',op,...args);
			if (op in OP_MAP) {
				op = OP_MAP[op];
			}
			if (args[0].complex) {
				return args[0].value+'.'+op+wrap(args.slice(1).map(a => a.value).join(','));
			} else {
				return 'Complex.'+op+wrap(args.map(a => a.value).join(','));
			}
		}
		function makeMathOp(op,...args) {
			//console.log('Math',op,...args);
			if (op in OP_MAP) {
				return wrap(args.map(a => a.value).join(op));
			} else {
				return 'Math.'+op+wrap(args.map(a => a.value).join(','));
			}
		}
		
		let t, token, args, result;
		while (tokens.length > 1) {
			t = 1;
			while (t < tokens.length && tokens[t].args === 0) t++;
			if (t == tokens.length) break; //throw 'Missing operator or function';
			
			token  = tokens[t];
			t     -= token.args;
			args   = tokens.splice(t,token.args);
			result = new Token(token.value, 'expression');
			
			if (args.length) {
				// process arguments to validate variables and convert expressions to complex
				// TODO: consider combining real and imaginary terms into a complex number when in the form a+bi
				for (let arg of args) {
					if (arg.type === 'variable') {
						if (arg.value.toUpperCase() in Math) {
							arg.value = 'Math.'+arg.value.toUpperCase();
							arg.complex = false;
						} else if (vars.includes(arg.value)) {
							arg.complex = true;
						} else {
							throw 'Unknown variable: ' + arg.toString() + '. Only ' + vars.join(', ') + ' and Math constants are allowed.';
						}
					} else if (arg.type === 'expression') {
						if (!arg.complex && arg.value.endsWith('i')) {
							let c = Complex.fromString(arg.value);
							arg.complex = true;
							arg.value = `Complex.imaginary(${c.i})`;
						}
					} /*else if (arg.type === 'number') {
						if (!arg.complex) {
							arg.complex = true;
							arg.value = `Complex.real(${arg.value})`;
						}
					}*/
				}
			}
			// if one or more arguments is complex, then the
			// result of this operation might also be complex
			// exceptions include the .arg(), .magnitude(), and .norm() functions
			result.complex = args.some(a => a.complex);
			if (token.type === 'operator') {
				// aliases
				if (token.value == '^') {
					token.value = '**';
				}
				switch (token.value) {
					case '-':
						if (args.length == 1) {
							// unary '-' (negation; treat as negative number instead)
							if (result.complex) {
								result.value = makeComplexOp('negate',args[0]);
							} else {
								result.value = String(-args[0].value);
							}
							break;
						}
					case '+':
						if (args.length == 1) {
							// unary '+' (redundant signage; no explicit operation needed)
							result.value = args[0].value;
							break;
						}
					case '*':
					case '/':
					case '**':
						if (OP_MAP[token.value] == 'pow' && args[0].value == 'Math.E') {
							// if the expression contains e^..., use exp() instead
							result.value = makeOp('exp',args[1]);
						} else if (OP_MAP[token.value] == 'pow' && args[0].complex && args[1].value == 2) {
							// optimize z.pow(2) into z.sqr()
							result.value = makeComplexOp('sqr',...args);
						} else {
							result.value = makeOp(token.value,...args);
						}
						break;
					default:
						throw 'Unknown operator: ' + token.toString();
				}
			} else if (token.type == 'function') {
				// aliases
				if (token.value == 'ln') {
					token.value = 'log';
				} else if (token.value == 'nroot' || token.value == 'nthrt' || token.value == 'nthroot') {
					token.value = 'root';
				} else if (token.value == 're') {
					token.value = 'real';
				} else if (token.value == 'im') {
					token.value = 'imaginary';
				}
				if (UNIVERSAL_FUNCS.includes(token.value)) {
					// self-arg functions that have equivalent real number functions
					if (args[0].type === 'number' && !(args[0] && args[0].complex)) {
						// square root and logarithm for negative real numbers have complex solutions
						if ((token.value === 'sqrt' || token.value === 'log') && args[0].value < 0) {
							// sqrt(-1) = i
							// e^ln(-1) = -1 = e^(i*pi)
							// ln(-1) = i*pi+(2*k*pi)
							// don't handle log(0) as that's undefined in the complex plane as well
							result.complex = true;
							result.value = makeComplexOp(token.value,...args);
						} else {
							// other functions have real solutions, so evaluate them instead
							result.type = 'number';
							result.value = Math[token.value](...args.map(a => a.value));
						}
					} else {
						result.value = makeOp(token.value,...args);
					}
				} else if (COMPLEX_FUNCS.includes(token.value)) {
					// self-arg functions for complex numbers only
					if (result.complex) {
						result.value = makeComplexOp(token.value,...args);
					} else {
						throw token.toString() + ' does not accept non-complex arguments';
					}
				} else if (COMPLEX_TO_REAL_FUNCS.includes(token.value)) {
					result.complex = false;
					result.value = makeComplexOp(token.value,...args);
				} else {
					throw 'Unknown function: ' + token.toString();
				}
			}
			// insert the result back into where the operator was
			//console.log(token, args, result);
			tokens[t] = result;
		}
		let func = tokens.pop().value;
		console.log('Result:',expr,'->',func);
		
		return stringOnly ? func : eval(makeArrow(vars,func));
	}
	static eval(fn,z) {
		return this.parse(fn,['z'])(z);
	}
	static derive(fn,v='z',stringOnly=false) {
		// TODO: maybe this is a bit too complicated as of now...
		// factored -> polynomial form or polynomial -> factored form?
	}
}

/**
 * Renders a complex function graph to a Jimp image.
 * @prop {ComplexFunction} func - the complex function to graph
 * @prop {Object<Complex>} constants - additional constants to apply to the function
 */
class ComplexGraph {
	constructor(func, constants={}, opts = {}) {
		this.func      = func ?? new ComplexFunction('z','z');
		this.constants = constants   ?? {};
		this.width     = opts.width  ?? 600;
		this.height    = opts.height ?? 600;
		this.derive    = opts.derive ?? false;
	}
	/**
	 * @param {ComplexShader} shader
	 */
	render(shader) {
		let f = this.func, cs = Object.keys(this.constants).map(k => this.constants[k]);
		let	w = this.width, h = this.height, wh = w/2, hh = h/2;
		let image = new Jimp(w, h, 0xFFFFFFFF), z, c;
		image.scan(0, 0, w, h, (x, y) => {
			z = new Complex(10 * (x - wh) / w, 10 * (hh - y) / h);
			z = (this.derive ? f.derivative : f.evaluate).call(f, z, ...cs);
			c = z.toColor(shader.domainColoringSettings);
			image.setPixelColor(c, x, y);
		});
		return image;
	}
}

const DEFAULT_COLORS = [
	Color.RED,
	Color.YELLOW,
	Color.GREEN,
	Color.CYAN,
	Color.BLUE,
	Color.MAGENTA
];
const DEFAULT_SETTINGS = {
	hue: 0,
	saturation: 1,
	lightness: 0.25,
	effect: 'fade',
	fieldLines: 0,
	gridPattern: false,
	gridSpacing: 1,
	gridThickness: 0.01,
	gridVisibility: 1
};

/**
 * Settings for colorizing Complex numbers.
 */
class ComplexShader {
	constructor(data = {}) {
		data.colors = data.colors?.map(c => new Color(c)) ?? DEFAULT_COLORS.slice();
		this.gradient = new ColorGradient(data.colors, data.scale);
		this.defaultColor = data.defaultColor ?? Color.BLACK;
		this.domainColoringSettings = data.domainColoringSettings ?? Object.assign({}, DEFAULT_SETTINGS);
	}
	get colors() {
		return this.gradient.colors;
	}
	get scale() {
		return this.gradient.scale;
	}
	reset() {
		this.gradient.colors = DEFAULT_COLORS.slice();
		this.gradient.scale  = 4;
		this.defaultColor = Color.BLACK;
		Object.assign(this.domainColoringSettings, DEFAULT_SETTINGS);
		return this;
	}
	makeGradientPreview(width=1000,height=50) {
		let image = new Jimp(width, height, 0xFFFFFFFF),
			dx = width / this.colors.length,
			dy = height / 2,
			x;
		for (x=0;x<this.colors.length;x++) {
			image.fill(this.colors[x].rgba, x * dx, 0, dx, dy);
		}
		for (x=0;x<width;++x) {
			image.drawScanY(x, dy, height, this.gradient.get(x/dx).rgba);
		}
		return image;
	}
	fromJSON(data) {
		this.gradient.fromJSON(data);
		this.defaultColor = new Color(data.defaultColor);
		Object.assign(this.domainColoringSettings, data.domainColoringSettings ?? {});
		return this;
	}
	toJSON() {
		let data = this.gradient.toJSON();
		data.defaultColor = this.defaultColor.toJSON();
		data.domainColoringSettings = Object.assign({}, this.domainColoringSettings);
		return data;
	}
	async toEmbed() {
		let image = await this.makeGradientPreview().getBufferAsync(Jimp.MIME_PNG);
		let embed = {
			title: 'ComplexShader Settings',
			color: this.defaultColor.rgb,
			image: image,
			fields: []
		};
		for (let key in this.domainColoringSettings) {
			embed.fields.push({
				name: key,
				value: String(this.domainColoringSettings[key]),
				inline: true
			});
		}
		return embed;
	}
}

module.exports = {Complex, ComplexFunction, ComplexGraph, ComplexShader};
