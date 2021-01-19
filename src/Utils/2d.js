const {Generic} = require('./Generic');
const {interp}  = require('./Math');

const PI  = Math.PI;
const TAU = Math.TAU;

/**
 * A generic 2D point capable of operations with other points.
 * @class
 * @extends Generic
 * @prop {Number} x
 * @prop {Number} y
 */
class Point extends Generic {
	x = 0; y = 0;
	
	get magnitude() {
		return Math.hypot(this.x, this.y);
	}
	get direction() {
		return Math.atan2(this.y, this.x);
	}
	add(v) {
		return new Point(this.x + v.x, this.y + v.y);
	}
	sub(v) {
		return new Point(this.x - v.x, this.y - v.y);
	}
	mul(v) {
		if (v instanceof Point) {
			return new Point(this.x * v.x, this.y * v.y);
		} else {
			return this.scale(v);
		}
	}
	div(v) {
		if (v instanceof Point) {
			return new Point(this.x / v.x, this.y / v.y);
		} else {
			return this.scale(1 / v);
		}
	}
	normal() {
		let n = this.magnitude();
		return new Point(this.x / n, this.y / n);
	}
	negative() {
		return new Point(-this.x, -this.y);
	}
	abs() {
		return new Point(Math.abs(this.x), Math.abs(this.y));
	}
	round() {
		return new Point(Math.floor(this.x), Math.floor(this.y));
	}
	transpose() {
		return new Point(this.y, this.x);
	}
	distance(p) {
		return this.subtract(p).magnitude();
	}
	scale(c) {
		return new Point(this.x * c, this.y * c);
	}
	dot(v) {
		return this.x * v.x + this.y * v.y;
	}
	angle(v) {
		return Math.acos(this.dot(v) / (this.magnitude() * v.magnitude()));
	}
	project(v) {
		return v.scale(this.dot(v) / Math.pow(v.magnitude(), 2));
	}
	interp(p,t) {
		return new Point(interp(this.x, p.x, t), interp(this.y, p.y, t));
	}
	min(p) {
		return new Point(Math.min(this.x, p.x), Math.min(this.y, p.y));
	}
	max(p) {
		return new Point(Math.max(this.x, p.x), Math.max(this.y, p.y));
	}
	isParallel(v) {
		return this.abs().isEqual(v.abs());
	}
	isEqual(v) {
		return this.x == v.x && this.y == v.y;
	}
	isZero() {
		return !this.x && !this.y;
	}
	isNormal() {
		return Math.abs(1 - this.magnitude()) < 1e-10;
	}
	isPerpendicular(v) {
		return this.dot(v) == 0;
	}
	fromPolarCoords(r,theta) {
		this.x = r * Math.cos(theta);
		this.y = r * Math.sin(theta);
		return this;
	}
	toNumber() {
		return this.magnitude();
	}
	toString() {
		return '(' + this.x + ',' + this.y + ')';
	}
	toArea() {
		return new Area(this.x, this.y);
	}
	static fromEuler(radius, theta) {
		return new Point(radius * Math.cos(theta), radius * Math.sin(theta));
	}
	static from(data) {
		if (typeof data === 'string') {
			let comps = data.match(/\d+/g);
			if (comps && comps.length == 2) {
				return new Point(comps[0],comps[1]);
			} else {
				return new Point();
			}
		} else {
			return super.from(data);
		}
	}
}

/**
 * Represents a connection between two Points.
 * @class
 * @extends Generic
 * @prop {Point} start
 * @prop {Point} end
 */
class Line extends Generic {
	start = Point;
	end   = Point;
	
	get length() {
		return this.start.distance(this.end);
	}
	get slope() {
		return this.end.sub(this.start).normal();
	}
	get increasing() {
		return this.slope > 0;
	}
	get decreasing() {
		return this.slope < 0;
	}
	get vertical() {
		return this.start.x === this.end.x;
	}
	get horizontal() {
		return this.start.y === this.end.y;
	}
	midpoint() {
		return this.start.add(this.end).scale(0.5);
	}
	interp(t) {
		return this.start.interp(this.end, t);
	}
	scan(fn) {
		let diff  = this.end.sub(this.start);
		if (diff.x === 0) {
			// vertical line; step y component only
			let steps = Math.floor(diff.y) + 1;
			for (let i = 0, p = this.start.copy(); i < steps; ++i, ++p.y) fn(p,i);
		} else if (diff.y === 0) {
			// horizontal line; step x component only
			let steps = Math.floor(diff.x) + 1;
			for (let i = 0, p = this.start.copy(); i < steps; ++i, ++p.x) fn(p,i);
		} else {
			let steps = Math.floor(diff.magnitude());
			for (let i = 0, p = this.start, step = diff.scale(1/steps); i <= steps; ++i) {
				fn(p,i);
				p = p.add(step);
			}
		}
	}
	toNumber() {
		return this.length;
	}
	toString() {
		return 'from ' + this.start.toString() + ' to ' + this.end.toString();
	}
}

/**
 * Represents something that has a width and height.
 * @class
 * @extends Generic
 * @prop {Number} width
 * @prop {Number} height
 */
class Area extends Generic {
	width = 0; height = 0;
	
	get perimeter() {
		return 2 * (this.width + this.height);
	}
	get area() {
		return this.width * this.height;
	}
	get center() {
		return new Point(this.width / 2, this.height / 2);
	}
	containsPoint(p) {
		return p.x >= 0 && p.x < this.width && p.y >= 0 && p.y < this.height;
	}
	randomPoint() {
		return new Point(
			Math.floor(this.width  * Math.random()),
			Math.floor(this.height * Math.random())
		);
	}
	extend(a) {
		return new Area(this.width + a.width, this.height + a.height);
	}
	scale(t) {
		return new Area(this.width * t, this.height * t);
	}
	scan(fn) {
		for (let p = new Point; p.y < this.height; ++p.y)
			for (p.x = 0; p.x < this.width; ++p.x)
				fn(p);
	}
	toNumber() {
		return this.area;
	}
	toString() {
		return this.width + 'x' + this.height;
	}
	toPoint() {
		return new Point(this.width, this.height);
	}
	toPartition() {
		return new Partition(new Point(), new Point(this.width, this.height));
	}
	static from(data) {
		if (typeof data === 'string') {
			let comps = data.split('x');
			return new Area(comps[0], comps[1]);
		} else {
			return super.from(data);
		}
	}
}

/**
 * Extends Area to include a position.
 * @class
 * @extends Area
 * @prop {Point} pos
 */
class Rectangle extends Area {
	pos = Point;
	
	constructor(x=0,y=0,w=0,h=0) {
		if (x instanceof Point) {
			h = w;
			w = y;
			y = x.y;
			x = x.x;
		}
		if (w instanceof Area) {
			h = w.height;
			w = w.width;
		} else if (w instanceof Point) {
			h = w.y - y;
			w = w.x - x;
		}
		super(w, h, new Point(x, y));
	}
	get center() {
		return this.pos.add(new Point(this.width / 2, this.height / 2));
	}
	scan(fn) {
		for (let p = this.pos.copy(), y = 0, x; y < this.height; ++p.y, ++y)
			for (p.x = this.pos.x, x = 0; x < this.width; ++p.x, ++x)
				fn(p);
	}
	toString() {
		return this.pos.toString() + ' + ' + super.toString();
	}
	toPoint() {
		return this.pos.add(super.toPoint());
	}
	toPartition() {
		return new Partition(this.pos, this.toPoint());
	}
}

/**
 * A screen-like object with scrolling and zooming capabilities.
 * @prop {Point} offset
 * @prop {Number} zoom
 */
class Viewport extends Area {
	width  = 500;
	height = 500;
	offset = Point;
	zoom   = 1;
	
	/**
	 * Transforms a screen pixel coordinate to its new value.
	 * @param {Point} p
	 */
	transform(p) {
		return p.sub(this.center).add(this.offset).scale(this.zoom);
	}
	/**
	 * Undoes the transform on a pixel back to its original screen coordinates.
	 * @param {Point} p
	 */
	untransform(p) {
		return p.scale(1/this.zoom).sub(this.offset).add(this.center);
	}
	/**
	 * Perform an operation on each pixel.
	 * The arguments passed to the callback are the current pixel and the transformed pixel.
	 * @param {Function} fn   - the function called for each pixel
	 * @param {Number} [sx=0] - the starting X coordinate
	 * @param {Number} [sy=0] - the starting Y coordinate
	 * @param {Number} [w]    - the width to scan
	 * @param {Number} [h]    - the height to scan	
	 */
	scan(fn,sx=0,sy=0,w=this.width,h=this.height) {
		let p = new Point;
		for (let dy = 0; dy < h; dy++) {
			p.y = sy + dy;
			for (let dx = 0; dx < w; dx++) {
				p.x = sx + dx;
				fn(p, this.transform(p));
			}
		}
	}
	
	toPoint() {
		return this.offset.add(super.toPoint());
	}
	toRectangle() {
		return new Rectangle(this.offset, this.width, this.height);
	}
	toPartition() {
		return new Partition(new Point(0,0), new Point(this.width-1,this.height-1));
	}
}

/**
 * Represents a region that can be recursively split into quadrants.
 * @class
 * @extends Generic
 * @prop {Point} topLeft
 * @prop {Point} bottomRight
 * @prop {Number} __depth__
 */
class Partition extends Generic {
	topLeft     = Point;
	bottomRight = Point;
	__depth__   = 0;
	
	get leftX() {
		return this.topLeft.x;
	}
	get rightX() {
		return this.bottomRight.x;
	}
	get topY() {
		return this.topLeft.y;
	}
	get bottomY() {
		return this.bottomRight.y;
	}
	
	get width() {
		return 1 + this.rightX - this.leftX;
	}
	get height() {
		return 1 + this.bottomY - this.topY;
	}
	
	get isWide() {
		return this.width > this.height;
	}
	get isTall() {
		return this.height > this.width;
	}
	get isSquare() {
		return this.width == this.height;
	}
	
	get center() {
		return this.topLeft.add(this.bottomRight).scale(0.5).round();
	}
	
	get topRight() {
		return new Point(this.rightX, this.topY);
	}
	get bottomLeft() {
		return new Point(this.leftX, this.bottomY);
	}
	
	get leftBorder() {
		return new Line(this.topLeft, this.bottomLeft);
	}
	get rightBorder() {
		return new Line(this.topRight, this.bottomRight);
	}
	get topBorder() {
		return new Line(this.topLeft, this.topRight);
	}
	get bottomBorder() {
		return new Line(this.bottomLeft, this.bottomRight);
	}
	
	get leftMid() {
		return this.leftBorder.midpoint().round();
	}
	get rightMid() {
		this.rightBorder.midpoint().round();
	}
	get topMid() {
		return this.topBorder.midpoint().round();
	}
	get bottomMid() {
		return this.bottomBorder.midpoint().round();
	}
	
	get upperHalf() {
		return new Partition(this.upperLeft, this.rightMid, this.__depth__+1);
	}
	get lowerHalf() {
		return new Partition(this.leftMid, this.bottomRight, this.__depth__+1);
	}
	get leftHalf() {
		return new Partition(this.upperLeft, this.bottomMid, this.__depth__+1);
	}
	get rightHalf() {
		return new Partition(this.topMid, this.bottomRight, this.__depth__+1);
	}
	
	get upperLeft() {
		return new Partition(this.topLeft, this.center, this.__depth__+1);
	}
	get upperRight() {
		return new Partition(this.topMid, this.rightMid, this.__depth__+1);
	}
	get lowerLeft() {
		return new Partition(this.leftMid, this.bottomMid, this.__depth__+1);
	}
	get lowerRight() {
		return new Partition(this.center, this.bottomRight, this.__depth__+1);
	}
	
	toNumber() {
		return this.__depth__;
	}
	toString() {
		return '['+this.topLeft.toString() + ',' + this.bottomRight.toString()+']';
	}
	toArea() {
		return new Area(this.width, this.height);
	}
	toRectangle() {
		return new Rectangle(this.topLeft, this.bottomRight);
	}
}

class Path extends Generic {
	points    = [];
	smoothing = 'linear';
	closed    = false;
	step      = 0.1;
	
	get degree() {
		return this.points.length;
	}
	
	get center() {
		let center = new Point(0,0);
		for (let p of this.points) {
			center.x += p.x;
			center.y += p.y;
		}
		center.x /= this.points.length;
		center.y /= this.points.length;
		return center;
	}
	getBoundingBox() {
		let min = new Point(Infinity,Infinity);
		let max = new Point(-Infinity,-Infinity);
		for (let p of this.points) {
			//min = min.min(p);
			//max = max.max(p);
			min.x = Math.min(min.x, p.x);
			min.y = Math.min(min.y, p.y);
			max.x = Math.max(max.x, p.x);
			max.y = Math.max(max.y, p.y);
		}
		return new Rectangle(min, max);
	}
	addPoint() {
		this.points.push(new Point(...arguments));
		return this;
	}
	removePoint(p) {
		this.points.splice(this.points.indexOf(p),1);
		return p;
	}
	closePath() {
		this.closed = true;
	}
	getPoint(index = 0) {
		return this.points[Math.floor(index) % this.points.length];
	}
	getPos(t = 0) {
		t = Math.floor(t / this.step) * this.step;
		switch (this.smoothing) {
			case 'linear':
				return this.getLinearPos(t);
			case 'bezier':
				return this.getBezierPos(t);
			case 'smooth':
				return this.getSmoothPos(t);
			default:
				return this.getPoint(t);
		}
	}
	getLinearPos(offset = 0, t = 0) {
		let p0 = this.getPoint(offset);
		let p1 = this.getPoint(offset + 1);
		t = (offset + t) % 1;
		return p0.interp(p1, t);
	}
	getBezierPos(t = 0) {
		t = t % 1;
		let points = this.points.slice();
		while (points.length > 1) {
			for (let o = 0; o < points.length - 1; o++) {
				points[o] = points[o].interp(points[o+1], t);
			}
			points.pop();
		}
		return points[0];
	}
	getSmoothPos(offset = 0, t = 0) {
		let len = this.degree, p0, p1, d0, d1;
		if (!this._dirs) {
			// calculate initial spline vectors
			let dirs = this._dirs = this.points.map((p0,i) => {
				let p1 = this.getPoint(i+1);
				return p1.sub(p0);
			});
			
			// correctively smooth the directions
			do {
				for (let i = len - 1, j; i > 0; i--) {
					j  = (i+1) % len;
					dirs[i].x -= dirs[j].x / 2;
					dirs[i].y -= dirs[j].y / 2;
				}
				// TODO: determine a break condition
				break;
			} while (true);
		}
		
		// perform cubic spline interpolation
		p0 = this.getPoint(offset);
		p1 = this.getPoint(offset + 1);
		d0 = this._dirs[Math.floor(offset) % len];
		d1 = this._dirs[Math.floor(offset+1) % len];
		t = (offset + t) % 1;
		p0 = p0.add(d0.scale(t));
		p1 = p1.add(d1.scale(1-t));
		return p0.interp(p1, t);
	}
}

class Triangle extends Generic {
	p0 = Point;
	p1 = Point;
	p2 = Point;
	
	get center() {
		return this.p0.add(this.p1).add(this.p2).scale(1/3);
	}
	get edges() {
		return [
			new Line(this.p0, this.p1),
			new Line(this.p1, this.p2),
			new Line(this.p2, this.p0)
		];
	}
	get midpoints() {
		return this.edges.map(e => e.midpoint());
	}
	get sideLengths() {
		return this.edges.map(e => e.length);
	}
	// c^2 = a^2 + b^2 - 2ab cos C
	// c^2 - (a^2 + b^2) = -2ab cos C
	// (c^2 - (a^2 + b^2)) / (-2ab) = cos C
	// acos((a^2 + b^2 - c^2) / 2ab) = C
	get angles() {
		let [a,b,c] = this.sideLengths, a2 = a*a, b2 = b*b, c2 = c*c;
		return [
			Math.acos((b2+c2-a2)/(2*b*c)),
			Math.acos((a2+c2-b2)/(2*a*c)),
			Math.acos((a2+b2-c2)/(2*a*b))
		];
	}
	get perimeter() {
		return this.sideLengths.reduce((p,e) => p + e, 0);
	}
	// https://en.wikipedia.org/wiki/Heron%27s_formula
	get area() {
		let [a,b,c] = this.sideLengths, s = (a+b+c)/2;
		return Math.sqrt(s*(s-a)*(s-b)*(s-c));
	}
	get winding() {
		// TODO
	}
	getBaryCoords(p) {
		// TODO
	}
	containsPoint(p) {
		let b = this.getBaryCoords();
		return !(b.u < 0 || b.v < 0 || b.u + b.v > 1);
	}
	getInscribedCircle() {
		// TODO
	}
	getCircumscribedCircle() {
		// TODO
	}
	toNumber() {
		return this.perimeter;
	}
	toPoint() {
		return this.center;
	}
	toPath() {
		return new Path([this.p0, this.p1, this.p2], 'linear', true, 1);
	}
}

class Polygon extends Point {
	sides  = 3;
	radius = 1;
	angle  = 0;
	
	get arc() {
		return PI / this.sides;
	}
	get exteriorAngle() {
		return TAU / this.sides;
	}
	get interiorAngle() {
		return PI - this.exteriorAngle;
	}
	// radius of circumscribed circle
	get circumRadius() {
		return this.radius;
	}
	// radius of inscribed circle
	get inRadius() {
		return this.radius * Math.cos(this.arc);
	}
	get sideLength() {
		return 2 * this.radius * Math.sin(this.arc);
	}
	get edges() {
		let edges = [];
		for (let i = 0; i < this.sides; i++) {
			edges.push(new Line(this.getPoint(i), this.getPoint(i+1)));
		}
		return edges;
	}
	get area() {
		return this.sides * (this.radius ** 2) * Math.sin(this.arc) * Math.cos(this.arc);
	}
	get perimeter() {
		return this.sides * this.sideLength;
	}
	containsPoint(p) {
		let dist = this.distance(p);
		if (dist <= this.radius) {
			if (dist <= this.inRadius) {
				// definitely inside
				return true;
			} else {
				// hmmmmmm...
				return true;
			}
		} else {
			// definitely outside
			return false;
		}
	}
	getPoint(p) {
		return this.add(Point.fromEuler(this.radius, this.angle + p * this.exteriorAngle));
	}
	toNumber() {
		return this.sides;
	}
	toPoint() {
		return new Point(this.x, this.y);
	}
	toPath() {
		let points = [];
		for (let t = 0; t < this.sides; ++t) {
			points.push(this.getPoint(t));
		}
		return new Path(points, 'linear', true, 1);
	}
}

class Circle extends Point {
	radius = 1;
	
	constructor(x=0,y=0,r=0) {
		if (x instanceof Point) {
			r = x.r ?? y;
			y = x.y;
			x = x.x;
		}
		super(x,y,r);
	}
	get area() {
		return Math.PI * this.radius * this.radius;
	}
	get circumference() {
		return 2 * Math.PI * this.radius;
	}
	tangentAt(p) {
		let vec = p.sub(this).normal();
		return new Point(vec.y, -vec.x);
	}
	pointAt(angle) {
		return Point.fromEuler(this.radius, angle).add(this);
	}
	containsPoint(p) {
		return this.distance(p) <= this.radius;
	}
	toNumber() {
		return this.radius;
	}
	toString() {
		return `(${this.x},${this.y},${this.radius})`;
	}
	toPoint() {
		return new Point(this.x, this.y);
	}
	toEllipse() {
		return new Ellipse(this, this.radius, this.radius);
	}
}

class Ellipse extends Point {
	major = 1;
	minor = 1;
	
	constructor(x=0,y=0,maj=1,min=1) {
		if (x instanceof Point) {
			min = x.minor ?? maj;
			maj = x.major ?? x.r ?? y;
			y = x.y;
			x = x.x;
		}
		super(x,y,maj,min);
	}
	get area() {
		return Math.PI * this.major * this.minor;
	}
	get circumference() {
		// TODO
	}
	tangentAt(p) {
		// TODO
	}
	pointAt(angle) {
		return new Point(this.x + this.major * Math.sin(angle), this.y + this.minor * Math.cos(angle));
	}
	containsPoint(p) {
		// TODO
	}
	toPoint() {
		return new Point(this.x, this.y);
	}
	toCircle() {
		return new Circle(this, this.major);
	}
	toNumber() {
		this.major;
	}
	toString() {
		return `(${this.x},${this.y},${this.major},${this.minor})`;
	}
}

Generic.addClass(Point, Line, Area, Rectangle, Viewport, Partition, Path, Triangle, Polygon, Circle, Ellipse);

module.exports = {Point, Line, Area, Rectangle, Viewport, Partition, Path, Triangle, Polygon, Circle, Ellipse};
