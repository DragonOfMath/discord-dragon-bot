class Point {
	constructor(x=0,y=0) {
		this.x = Number(x);
		this.y = Number(y);
	}
	get magnitude() {
		return Math.sqrt(this.x*this.x+this.y*this.y);
	}
	get direction() {
		return Math.atan2(this.y,this.x);
	}
	get normal() {
		let n = this.magnitude;
		return new Point(this.x/n,this.y/n);
	}
	get negative() {
		return new Point(-this.x,-this.y);
	}
	get absolute() {
		return new Point(Math.abs(this.x),Math.abs(this.y));
	}
	get round() {
		return new Point(~~this.x,~~this.y);
	}
	get transpose() {
		return new Point(this.y,this.x);
	}
	set(x,y) {
		this.x = Number(x);
		this.y = Number(y);
		return this;
	}
	add(v) {
		return new Point(this.x+v.x,this.y+v.y);
	}
	subtract(v) {
		return new Point(this.x-v.x,this.y-v.y);
	}
	distance(p) {
		return this.subtract(p).magnitude;
	}
	scale(c) {
		return new Point(this.x*c,this.y*c);
	}
	dot(v) {
		return this.x * v.x + this.y * v.y;
	}
	angle(v) {
		return Math.acos(this.dot(v)/(this.magnitude*v.magnitude));
	}
	project(v) {
		return v.scale(this.dot(v)/Math.pow(v.magnitude,2));
	}
	isParallel(v) {
		return this.absolute.isEqual(v.absolute);
	}
	isEqual(v) {
		return this.x == v.x && this.y == v.y;
	}
	isZero() {
		return !this.x && !this.y;
	}
	isNormal() {
		return Math.abs(1-this.magnitude) < 1e-10;
	}
	isPerpendicular(v) {
		return this.dot(v) == 0;
	}
	fromPolarCoords(r,theta) {
		this.x = r * Math.sin(theta);
		this.y = r * Math.cos(theta);
		return this;
	}
	toJSON() {
		return {type:this.constructor.name,x:this.x,y:this.y};
	}
	toString() {
		return '<' + this.x + ',' + this.y + '>';
	}
}

class Dimensions {
	constructor(w,h) {
		this.width  = Number(w);
		this.height = Number(h);
	}
	get area() {
		return this.width * this.height;
	}
	toJSON() {
		return {type:this.constructor.name,width:this.width,height:this.height};
	}
	toString() {
		return this.width + 'x' + this.height;
	}
}

class Line {
	constructor(p1,p2) {
		this.start = p1;
		this.end   = p2;
	}
	get length() {
		return this.start.distance(this.end);
	}
	get midpoint() {
		return new Point((this.start.x+this.end.x)/2,(this.start.y+this.end.y)/2);
	}
	interpolate(t) {
		return p1.add(p2.subtract(p1).scale(t));
	}
	toJSON() {
		return {type:this.constructor.name,start:this.start.toJSON(),end:this.end.toJSON()};
	}
	toString() {
		return '[' + this.start.toString() + ',' + this.end.toString() + ']';
	}
}

class Partition {
	constructor(topLeft, bottomRight) {
		var topRight   = new Point(bottomRight.x, topLeft.y);
		var bottomLeft = new Point(topLeft.x, bottomRight.y);
		
		this.topLeft     = topLeft;
		this.topRight    = topRight;
		this.bottomLeft  = bottomLeft;
		this.bottomRight = bottomRight;
		
		this.leftX   = topLeft.x;
		this.rightX  = bottomRight.x;
		this.topY    = topLeft.y;
		this.bottomY = bottomRight.y;
		
		this.width   = 1 + this.rightX - this.leftX;
		this.height  = 1 + this.bottomY - this.topY;
		
		this.top    = new Line(topLeft, topRight);
		this.bottom = new Line(bottomLeft, bottomRight);
		this.left   = new Line(topLeft, bottomLeft);
		this.right  = new Line(topRight, bottomRight);
		
		this.topMid    = this.top.midpoint.round;
		this.bottomMid = this.bottom.midpoint.round;
		this.leftMid   = this.left.midpoint.round;
		this.rightMid  = this.right.midpoint.round;
		
		this.center = new Line(topLeft, bottomRight).midpoint.round;
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
	get upperHalf() {
		return new Partition(this.upperLeft, this.rightMid);
	}
	get lowerHalf() {
		return new Partition(this.leftMid, this.bottomRight);
	}
	get leftHalf() {
		return new Partition(this.upperLeft, this.bottomMid);
	}
	get rightHalf() {
		return new Partition(this.topMid, this.bottomRight);
	}
	get upperLeft() {
		return new Partition(this.topLeft, this.center);
	}
	get upperRight() {
		return new Partition(this.topMid, this.rightMid);
	}
	get lowerLeft() {
		return new Partition(this.leftMid, this.bottomMid);
	}
	get lowerRight() {
		return new Partition(this.center, this.bottomRight);
	}
	fill(ctx,color) {
		ctx.fillStyle = color;
		ctx.fillRect(this.topLeft.x,this.topLeft.y,this.width,this.height);
	}
	toJSON() {
		return {type:this.constructor.name,topLeft:this.topLeft.toJSON(),bottomRight:this.bottomRight.toJSON()};
	}
	toString() {
		return '{' + this.topLeft.toString() + ',' + this.bottomRight.toString() + '}';
	}
}

module.exports = {
	Point,
	Dimensions,
	Line,
	Partition
};
