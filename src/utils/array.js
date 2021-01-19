const {extend} = require('./extend');

class Array2D extends Array {
	constructor(rows = 0, columns = 0) {
		super(rows);
		for (var i = 0; i < this.length; i++) {
			this[i] = Array(columns);
		}
	}
	fill(x, rowStart = 0, colStart = 0, rowEnd = this.rows-1, colEnd = this.cols-1) {
		for (var r=rowStart;r<=rowEnd;++r)this[r].fill(x,colStart,colEnd+1);
		return this;
	}
	resize(rows, cols) {
		while (this.rows < rows) {
			this.push(Array(cols));
		}
		while (this.rows > rows) {
			delete this.pop();
		}
		for (var row of this) {
			row.length = cols;
		}
		return this;
	}
	get rows() {
		return this.length;
	}
	set rows(r) {
		this.resize(r, this.cols);
	}
	get cols() {
		return this[0].length;
	}
	set cols(c) {
		this.resize(this.rows, c);
	}
	shiftRows(shift) {
		while (shift < 0) {
			this.shift();
			this.push(Array(this.cols));
			++shift;
		}
		while (shift > 0) {
			this.pop();
			this.unshift(Array(this.cols));
			--shift;
		}
	}
	shiftColumns(shift) {
		if (shift < 0) {
			for (var row of this) {
				row.splice(0, -shift);
				row.length = row.length - shift;
			}
		} else if (shift > 0) {
			for (var row of this) {
				row.splice(0,0, ...Array(shift));
				row.length = row.length - shift;
			}
		}
	}
	slice2D(rowStart = 0, colStart = 0, rowLength = this.rows, colLength = this.cols) {
		return super.slice(rowStart, rowLength).map(row => row.slice(colStart, colLength));
	}
}

extend(Array, {
	/**
		Combine arrays such that the result contains all the common elements
	*/
	union(a, ...b) {
		return b.reduce((u,c) => u.concat(c.filter(x => !u.includes(x))), a);
	},
	/**
		Filter the source array such that the result does not contain any of the target arrays' elements
	*/
	diff(a, ...b) {
		return b.reduce((d,c) => d.filter(x => !c.includes(x)), a);
	},
	/**
		Remove duplicate elements from an array
	*/
	unique(a) {
		return a.reduce((b,i) => {
			if (!b.includes(i)) b.push(i);
			return b;
		}, []);
	},
	/**
		Recursively flatten arrays within arrays
	*/
	flatten(a) {
		return [].concat(...a.map(x => x instanceof Array ? x.flatten() : [x]));
	},
	/**
		Perform forEach but resolving a Promise after each iteration
	*/
	async forEachAsync(iterable, callback, start, end) {
		if (typeof(start) === 'undefined') start = 0;
		if (typeof(end) === 'undefined') end = iterable.length;
		for (let i = start; i < end; i++) {
			await callback(iterable[i], i);
		}
		return await void 0;
	},
	/**
		Perform map but resolving a Promise after each iteration
	*/
	async mapAsync(iterable, callback, start, end) {
		if (typeof(start) === 'undefined') start = 0;
		if (typeof(end) === 'undefined') end = iterable.length;
		let mapped = [];
		for (let i = start; i < end; i++) {
			mapped.push(await callback(iterable[i], i));
		}
		return await mapped;
	},
	/**
		Similar to lodash's _.groupBy() function
	*/
	groupBy(iterable, callback) {
		let groups = {};
		for (let i = 0, g; i < iterable.length; i++) {
			if (typeof(callback) === 'function') {
				g = callback(iterable[i],i);
			} else {
				g = iterable[i][callback];
			}
			groups[g] = groups[g] || [];
			groups[g].push(iterable[i]);
		}
		return groups;
	},
	shuffle(iterable, iterations = 1) {
		let shuffled = iterable.slice();
		while (iterations-- > 0) {
			for (var a = 0, b, temp; a < shuffled.length; a++) {
				b = Math.floor(shuffled.length * Math.random());
				temp = shuffled[a];
				shuffled[a] = shuffled[b];
				shuffled[b] = temp;
			}
		}
		return shuffled;
	},
	range(start, end, step = 1) {
		return Array.from({length: (end - start) / step}, (x,i) => start + (i * step));
	},
	/**
	 * Transpose an Array of Arrays such that the rows become columns and the columns become rows.
	 */
	transpose(table) {
		return table[0].map((col,i) => table.map((row,j) => table[j][i]));
	},
	sum(arr) {
		return arr.reduce((s,x) => s + x, 0);
	}
});

extend(Array.prototype, {
	flatten() {
		return Array.flatten(this);
	},
	unique() {
		return Array.unique(this);
	},
	union(a) {
		return Array.union(this, a);
	},
	diff(a) {
		return Array.diff(this, a);
	},
	forEachAsync() {
		return Array.forEachAsync(this, ...arguments);
	},
	mapAsync() {
		return Array.mapAsync(this, ...arguments);
	},
	groupBy(callback) {
		return Array.groupBy(this, callback);
	},
	shuffle(iterations) {
		return Array.shuffle(this, iterations);
	},
	transpose() {
		return Array.transpose(this);
	}
});

module.exports = {Array,Array2D};
