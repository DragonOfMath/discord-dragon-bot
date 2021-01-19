const {Point,Viewport,Partition,Complex,ComplexFunction,ComplexShader} = require('../../../Utils');

/**
 * Defines an iterative fractal set within a viewport.
 * @class
 * @extends Viewport
 * @prop {ComplexFunction} func           - the iterative function that takes a complex number z and returns the new z value.
 * @prop {Object<Complex>} constants      - complex numbers other than the variable z that are used in the function.
 * @prop {Number}          escapeRadius   - the distance from origin at which points either lie within the set or escape to infinity.
 * @prop {Number}          maxIterations  - the maximum iterations of the function that determines whether a point is within the set or not.
 * @prop {Number}          partitionDepth - how much recursion depth is allowed for render partitioning.
 * @prop {Boolean}         continuous     - reduce banding caused by discrete stepping.
 * @prop {Number}          antiAliasing   - sample multiple points per pixel to increase clarity
 * @prop {Array}           _cache         - fractal data, which can be either the depthmap or the histogram
 */
class Fractal extends Viewport {
	width  = 600;
	height = 600;
	offset = Complex;
	zoom   = 150;
	
	func      = z => z;
	constants = {};
	
	escapeRadius   = 2;
	maxIterations  = 64;
	renderMode     = 'dwell'; // values: domain, dwell, boundary, histogram
	partitionDepth = 6;       // for dwell renders, limits the partitioning divisions to avoid stack overflows
	continuous     = true;    // for dwell renders, reduces iteration band aliasing
	antiAliasing   = 1;       // increases accuracy of detail
	
	constructor(data) {
		super(data);
		this._cache = null;
		this._func  = null;
	}
	reset() {
		this.func = new ComplexFunction('z','c','z^2+c');
		this.resetView();
		this.resetParams();
		this.setSize(600,600);
	}
	resetView() {
		this.offset = new Complex();
		this.zoom   = 150;
	}
	resetParams() {
		for (let c in this.constants) {
			this.constants[c] = new Complex;
		}
		this.escapeRadius  = 2;
		this.maxIterations = 64;
		this.continuous    = false;
		this.antiAliasing  = 1;
	}
	setSize(w,h) {
		if (w > 0) this.width  = w;
		if (h > 0) this.height = h;
	}
	getComplex(c) {
		return c === 'offset' ? this.offset : c === 'z0' ? this.z0 : this.constants[c];
	}
	setComplex(c,x,y) {
		let C = this.getComplex(c);
		if (!C) {
			throw 'Unknown complex parameter: ' + c;
		}
		if (typeof x === 'string') {
			C.copy(Complex.fromString(x));
		} else {
			if (typeof x === 'number') {
				C.r = x;
			}
			if (typeof y === 'number') {
				C.i = y;
			}
		}
		return this;
	}
	transform(p) {
		p = p.sub(this.center).div(this.zoom);
		return new Complex(p.x,-p.y).add(this.offset);
	}
	untransform(c) {
		c = c.sub(this.offset);
		return new Point(c.r,-c.i).mul(this.zoom).add(this.center);
	}
	curryFunction() {
		// build the iterative function
		let cs = Object.keys(this.constants).sort().map(c => this.constants[c]);
		this._func = z => this.func.iterate([z, ...cs], this);
	}
	render(shader) {
		if (!(shader instanceof ComplexShader)) {
			throw 'Missing ComplexShader.';
		}
		
		this._cache.length = this.area;
		this._cache.fill(0);
		
		const w = this.width, h = this.height;
		let image = new Jimp(w, h, 0xFFFFFFFF);
		
		// makes the function call more stable
		this.curryFunction();
		
		const _this = this;
		const domainColoring = this.renderMode === 'domain';
		const histogram      = this.renderMode === 'histogram';
		const boundary       = this.renderMode === 'boundary';
		
		function sample(rect,s=1e6) {
			while (s--) fragment(rect.randomPoint());
		}
		function scan(rect) {
			rect.scan(fragment);
		}
		function fill(partition,value) {
			partition.scan(p => _this._cache[p.y*w+p.x] = value);
		}
		function divide(partition,depth=0) {
			let val = fragment(partition.center), pass = 1, test = p => pass &= (val === fragment(p));
			partition.topBorder.scan(test);
			partition.rightBorder.scan(test);
			partition.bottomBorder.scan(test);
			partition.leftBorder.scan(test);
			if (pass) {
				fill(partition, val);
			} else if (partition.__depth__ < depth) {
				divide(partition.upperLeft, depth);
				divide(partition.upperRight, depth);
				divide(partition.lowerLeft, depth);
				divide(partition.lowerRight, depth);
			} else {
				scan(partition.toRectangle());
			}
		/*
		//let t = this.renderPixel(p.center), s = 1, z, start, end;
		for(start = p.topLeft, end = p.topRight, z = start.copy(); z.x < end.x; ++z.x)
			s &= (t == this.renderPixel(z));
		for(start = end, end = p.bottomRight; z.y < end.y; ++z.y)
			s &= (t == this.renderPixel(z));
		for(start = end, end = p.bottomLeft; z.x > end.x ; --z.x)
			s &= (t == this.renderPixel(z));
		for(start = end, end = p.topLeft; z.y > end.y; --z.y)
			s &= (t == this.renderPixel(z));
		if (s) {
			for(z.y = p.topY; z.y <= p.bottomY; ++z.y)
				this.cache.fill(t, z.y * this.width + p.leftX, z.y * this.width + p.rightX + 1);
		} else if (part.__depth__ < this.partitionDepth) {
			yield* this.renderByPartition(p.upperLeft);
			yield* this.renderByPartition(p.upperRight);
			yield* this.renderByPartition(p.lowerLeft);
			yield* this.renderByPartition(p.lowerRight);
		} else {
			part.toRectangle.scan(z => this.renderPixel(z));
			for(z.y = p.topY; z.y <= p.bottomY; ++z.y)
				for(z.x = p.leftX; z.x <= p.rightX; ++z.x)
					this.renderPixel(z);
		}
		*/
		}
		function fragment(pixel) {
			if (histogram) {
				let z = _this.transform(pixel);
				let t = _this.trace(z);
				if (t) {
					for (z of t) {
						pixel = _this.untransform(z).round();
						if (_this.containsPoint(pixel)) {
							_this._cache[pixel.y*w+pixel.x]++;
						}
					}
				}
				return;
			}
			let idx = (pixel.y|0) * w + (pixel.x|0);
			if (!_this._cache[idx]) {
				let z, result, color, i = 0;
				if (_this.antiAliasing > 1) {
					color    = new Color;
					let aa   = new Point;
					let step = 1/_this.antiAliasing;
					let samples = _this.antiAliasing ** 2;
					for (aa.y = step/2; aa.y < 1; aa.y += step) {
						for (aa.x = step/2; aa.x < 1; aa.x += step) {
							z = _this.transform(pixel.add(aa));
							result = _this.iterate(z);
							z = getColor(result[0], result[1]);
							i += result[1];
							color.r += z.r;
							color.g += z.g;
							color.b += z.b;
						}
					}
					i /= samples;
					color.r /= samples;
					color.g /= samples;
					color.b /= samples;
				} else {
					z = _this.transform(pixel);
					result = _this.iterate(z);
					i = result[1];
					color = getColor(result[0], i);
				}
				_this._cache[idx] = i;
				image.setPixelColor(color, pixel.x, pixel.y);
			}
			return _this.cache[idx];
		}
		function getColor(z,i) {
			if (domainColoring) {
				return z ? z.toColor(shader.domainColoringSettings) : shader.defaultColor;
			} else if (boundary) {
				return i < _this.maxIterations ? Color.WHITE : Color.BLACK;
			} else {
				return i < _this.maxIterations ? shader.gradient.sample(i) : shader.defaultColor;
			}
		}
		
		switch (this.renderMode) {
			case 'domain':
				scan(this);
				break;
			case 'dwell':
			case 'boundary':
				divide(this.toPartition(), this.partitionDepth);
				break;
			case 'histogram':
				sample(this);
				break;
		}
		
		if (histogram) {
			let maxHits = 0;
			this.scan(p => {
				maxHits = Math.max(maxHits, this._cache[p.y*w+p.x]);
			});
			image.scan(0,0,w,h,(x,y,i) => {
				let hits = this._cache[y*w+x];
				let c = Math.floor(0xFF * hits / maxHits);
				image.bitmap.data[i+0] = c;
				image.bitmap.data[i+1] = c;
				image.bitmap.data[i+2] = c;
			});
		}
		
		return image;
	}
	redraw(shader) {
		if (!(shader instanceof ComplexShader)) {
			throw 'Missing ComplexShader.';
		}
		if (this.renderMode !== 'dwell') {
			throw 'Redrawing only allowed in "dwell" render mode.';
		}
		if (this.cache.length !== this.area) {
			throw 'Re-render required.';
		}
		const w = this.width, h = this.height, image = new Jimp(w, h, 0xFFFFFFFF);
		image.scan(0,0,w,h,(x,y,i) => {
			let d = this._cache[y*w+x];
			try {
				let c = d < this.maxIterations ? shader.gradient.sample(d) : shader.defaultColor;
				jimp.bitmap.data[i+0] = c.r;
				jimp.bitmap.data[i+1] = c.g;
				jimp.bitmap.data[i+2] = c.b;
			} catch (e) {
				console.log(x,y,'->',d);
				throw e;
			}
		});
		
		return image;
	}
	iterate(z) {
		for (var i = 0, g = this._func(z), n; (n = g.next()) && (z = n.value) && !n.done; ++i);
		if (z) {
			if (this.continuous && i < this.maxIterations) {
				// https://en.wikipedia.org/wiki/Mandelbrot_set#Escape_time_algorithm
				i += 1 - (Math.log(z.magnitude() / Math.LN2) / Math.LN2);
				i = Math.max(i,0);
			}
		} else {
			i = this.maxIterations;
		}
		return [z,i];
	}
	trace(z) {
		for (var i = 0, g = this._func(z), n, t = [z]; (n = g.next()) && t.push(z = n.value) && !n.done; ++i);
		return i < this.maxIterations ? t : null; // reject traces which remain within the set
	}
	toString() {
		return `${this.constructor.name}: offset=${this.offset.toString()} zoom=x${this.zoom} iterations=${this.maxIterations} f(z)=${this.func.toSource()} ${Object.keys(this.constants).map(c => c + '=' + this.constants[c].toString()).join(' ')}`;
	}
	toJSON() {
		delete this._cache;
		delete this._func;
		let data = super.toJSON();
		data.offset = data.offset.toArray();
		for (let c in data.constants) {
			data.constants[c] = this.constants[c].toArray();
		}
		return data;
	}
	fromObject(data = {}) {
		super.fromObject(data);
		this.offset = Complex.parse(this.offset);
		for (let c in this.constants) {
			this.constants[c] = Complex.parse(this.constants[c]);
		}
		if (!this.constants.c) {
			this.constants.c = new Complex;
		}
		switch (typeof this.func) {
			case 'object':
				this.func = new ComplexFunction(this.func);
				break;
			case 'string':
				this.func = new ComplexFunction('z',...Object.keys(this.constants),this.func);
				break;
			default:
				this.func = new ComplexFunction('z','c','z^2+c');
				break;
		}
		return this;
	}
}

/**
 * The Mandelbrot set is a fractal consisting of every z^2+c.
 * It has a starting value z0 and assigns the constant c to be the position on screen (in the complex plane) prior to iteration.
 * By default, z0 = 0, which on the first iteration means z = c. Interesting variations may appear for other z0 values.
 */
class Mandelbrot extends Fractal {
	z0 = Complex;
	
	constructor(data = {}) {
		data.func = data.func ?? 'z^2+c';
		super(data);
	}
	iterate(z) {
		this.constants.c.set(z);
		return super.iterate(this.z0);
	}
	trace(z) {
		this.constants.c.set(z);
		return super.trace(this.z0);
	}
	toString() {
		return `${this.constructor.name}: offset=${this.offset.toString()} zoom=x${this.zoom} z0=${this.z0.toString()} iterations=${this.maxIterations} f(z)=${this.func.source} ${Object.keys(this.constants).map(c => c + '=' + this.constants[c].toString()).join(', ')}`;
	}
}

class Newton extends Fractal {
	m = 1;
	
	constructor(data = {}) {
		if (!data.func) {
			data.func = new ComplexFunction({
				params: ['z','c'],
				source: 'z^3-1',
				derivative: '3*z^2'
			});
		}
		super(data);
		this.m = data.multiplicity ?? data.m ?? 1;
	}
	curryFunction() {
		let cs = Object.keys(this.constants).sort().map(c => this.constants[c]);
		return this._func = z => this.func.newton([z,...cs],this);
	}
	toJSON() {
		let data = super.toJSON();
		data.m = this.m instanceof Complex ? this.m.toArray() : this.m;
		return data;
	}
	fromJSON(data = {}) {
		super.fromJSON(data);
		this.m = Complex.parse(data.multiplicity ?? data.m ?? 1);
		return this;
	}
}

//Generic.addClass(Fractal, Mandelbrot, Newton);

module.exports = {Fractal,Mandelbrot,Newton};
