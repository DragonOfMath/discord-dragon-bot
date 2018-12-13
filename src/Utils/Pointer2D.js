const {random} = require('./random');
const {Math}   = require('./Math');
const DIRS     = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };

class Pointer2D {
	constructor(x=0,y=0,dx=1,dy) {
		if (typeof(x) === 'object') {
			({x=0,y=0,dx=1,dy} = x);
		}
		this.x = this.ox = x;
		this.y = this.oy = y;
		if (dx !== undefined && dy === undefined) {
			this.dir = dx;
		} else {
			this.dx = dx || 0;
			this.dy = dy || 0;
		}
		this.trace = [];
	}
	get dir() {
		if (this.dx > 0) {
			return DIRS.RIGHT;
		} else if (this.dx < 0) {
			return DIRS.LEFT;
		} else if (this.dy > 0) {
			return DIRS.DOWN;
		} else if (this.dy < 0) {
			return DIRS.UP;
		} else {
			throw new Error(`Invalid direction vector: (${this.dx},${this.dy})`);
		}
	}
	set dir(dir) {
		switch (dir) {
		case DIRS.RIGHT:
			this.right();
			break;
		case DIRS.LEFT:
			this.left();
			break;
		case DIRS.UP:
			this.up();
			break;
		case DIRS.DOWN:
			this.down();
			break;
		default:
			throw new Error(`Invalid direction constant: ${dir}`);
		}
	}
	record(...info) {
		this.trace.push({
			x: this.x,
			y: this.y,
			i: info.join(' ')
		});
	}
	right() {
		this.dx = 1;
		this.dy = 0;
	}
	left() {
		this.dx = -1;
		this.dy = 0;
	}
	up() {
		this.dx = 0;
		this.dy = -1;
	}
	down() {
		this.dx = 0;
		this.dy = 1;
	}
	random() {
		this[random('right','left','up','down')]();
	}
	clockwise(n = 1) {
		this.dir = (this.dir + n) % 4;
	}
	anticlockwise(n = 1) {
		this.dir = (this.dir + 3 * n) % 4;
	}
	semiclockwise(n = 1) {
		let dir = Math.atan2(-this.dy, this.dx) + (n * Math.PI / 4);
		let dx  = Math.sin(dir);
		let dy  = Math.cos(dir);
		this.dx = Math.sign(dx) * Math.step(Math.abs(dx)-0.0001);
		this.dy = Math.sign(dy) * Math.step(Math.abs(dy)-0.0001);
	}
	semianticlockwise(n = 1) {
		let dir = Math.atan2(-this.dy, this.dx) - (n * Math.PI / 4);
		let dx  = Math.sin(dir);
		let dy  = Math.cos(dir);
		this.dx = Math.sign(dx) * Math.step(Math.abs(dx)-0.0001);
		this.dy = Math.sign(dy) * Math.step(Math.abs(dy)-0.0001);
	}
	reflect() {
		this.dx *= -1;
		this.dy *= -1;
	}
	forward() {
		this.x += this.dx;
		this.y += this.dy;
	}
	reverse() {
		this.x -= this.dx;
		this.y -= this.dy;
	}
	jump(n) {
		this.x += this.dx * n;
		this.y += this.dy * n;
	}
	next(n = 1) {
		return new Pointer2D(this.x + this.dx * n, this.y + this.dy * n, this.dx, this.dy);
	}
	wrap(w,h) {
		this.x = (this.x + w) % w;
		this.y = (this.y + h) % h;
	}
	OOB(w,h) {
		return this.x < 0 || this.x >= w || this.y < 0 || this.y >= h;
	}
	
	clone() {
		return new Pointer2D(this.x, this.y, this.dx, this.dy);
	}
	goto(x,y) {
		if (typeof(x) === 'object') {
			({x,y} = x);
		}
		if (isNaN(x) || isNaN(y)) {
			throw new Error(`Invalid destination: (${x},${y})`);
		}
		this.x = x;
		this.y = y;
	}
	equals(x,y) {
		if (typeof(x) === 'object') {
			({x,y} = x);
		}
		return this.x == x && this.y == y;
	}
	toString() {
		return `<${this.constructor.name} (${this.x},${this.y},${this.dx},${this.dy})>`;
	}
}

Pointer2D.DIRS = DIRS;

class PathNode {
	constructor(point, prev = null) {
		this.point = point;
		this.prev  = prev;
		this.id    = prev ? prev.id + 1 : 0;
	}
	propagate(diagonal = false) {
		let neighbors = [];
		let directions = diagonal ? 8 : 4;
		for (let dir = 0; dir < directions; dir++) {
			neighbors.push(new PathNode(this.point.next(), this));
			if (diagonal) {
				this.point.semiclockwise();
			} else {
				this.point.clockwise();
			}
		}
		return neighbors;
	}
	backtrace(path = []) {
		if (this.id > path.length) {
			path.length = this.id + 1;
		}
		path[this.id] = this.point;
		if (this.prev) {
			path = this.prev.backtrace(path);
		}
		return path;
	}
	equals(node) {
		return this.point.equals(node.point || node);
	}
}

class PointStore {
	set(point) {
		this[point.y] = this[point.y] || {};
		this[point.y][point.x] = point;
	}
	get(point) {
		return this[point.y] && this[point.y][point.x];
	}
}

class Pathfinder {
	/**
     * Find the path between two points in a uniform grid.
	 * @param {Object}               start       - the starting point, must have an x and y
	 * @param {Object|Array<Object>} end         - the destination point(s), must have an x and y; if an array, will find the path to the closest point
	 * @param {Object}        [options]          - the options for routing
	 * @param {Function}      [options.map]      - the mapping function for cells; returns true if a passage, false if an obstacle
	 * @param {Array<Object>} [options.avoid]    - the cells to avoid travelling over
	 * @param {Number}        [options.maxDepth] - the maximum length a path can take
	 * @param {Boolean}       [options.diagonal] - allow intercardinal movement
	 * @param {Number}        [options.xmin]     - the minimum x coordinate
	 * @param {Number}        [options.ymin]     - the minimum y coordinate
	 * @param {Number}        [options.xmax]     - the maximum x coordinate (inclusive)
	 * @param {Number}        [options.ymax]     - the maximum y coordinate (inclusive)
	 * @return The solution path as an Array of Pointer2D's or null if the path cannot be made.
	 */
	static route(start, end, {
			map = null,
			avoid = [],
			maxDepth = Infinity,
			diagonal = false,
			xmin = 0,
			ymin = 0,
			xmax = Infinity,
			ymax = Infinity
		}) {
		if (!(start instanceof Pointer2D)) {
			start = new Pointer2D(start);
		}
		
		function obstacle(cell) {
			return (cell.x < xmin || cell.x > xmax || cell.y < ymin || cell.y > ymax) || avoid.some(a => a.equals(cell));
		}
		
		let solution = null,
		    multi = end instanceof Array,
		    visited = new PointStore(),
		    queue = [], node, current;
		
		// start the queue
		queue.push(new PathNode(start));
		
		// search for the shortest solution to any endpoint
		while (queue.length) {
			node = queue.shift();
			current = node.point;
			
			// avoid running into obstacles, previous cells, or reaching the maximum depth
			if (node.id >= maxDepth
			 || visited.get(current)
			 || obstacle(current)
			 || (map && !map(current))) continue;
			 
			visited.set(current);
			
			if (multi) {
				// check if one of the destinations has been reached
				if (end.some(e => current.equals(e))) {
					solution = node.backtrace();
					break;
				}
			} else {
				if (current.equals(end)) {
					solution = node.backtrace();
					break;
				}
				
				// cull undesirable path directions
				let dx = end.x - current.x;
				let dy = end.y - current.y;
				if (Math.abs(dx) > Math.abs(dy)) {
					current.dx = Math.sign(dx);
					current.dy = 0;
				} else {
					current.dx = 0;
					current.dy = Math.sign(dy);
				}
			}
			
			// add the neighboring cells to the queue
			for (let neighbor of node.propagate(diagonal)) queue.push(neighbor);
		}
		
		return solution;
	}
}

module.exports = {Pointer2D,Pathfinder,PathNode,PointStore};
