function forEachAsync(callback, start = 0, end = this.length) {
	var iterable = this;
	function _next(i) {
		return Promise.resolve(callback(iterable[i], i))
		.then(() => {
			if (i+1 < end) {
				return _next(i+1);
			}
		});
	}
	return _next(start);
}
function mapAsync(callback, start = 0, end = this.length) {
	var iterable = this;
	var mapped = [];
	function _next(i) {
		return Promise.resolve(callback(iterable[i], i))
		.then(value => {
			if (typeof(value) !== 'undefined') mapped.push(value);
			if (i+1 < end) {
				return _next(i+1);
			} else {
				return mapped;
			}
		});
	}
	return _next(start);
}

class Array2D extends Array {
	constructor(rows = 0, columns = 0) {
		super(rows);
		for (var i = 0; i < this.length; i++) {
			this[i] = Array(columns);
		}
	}
	fill(x, rowStart = 0, colStart = 0, rowEnd = this.rows-1, colEnd = this.cols-1) {
		for (var r=rowStart;r<=rowEnd;++r)this[r].fill(x,colStart,colEnd);
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

module.exports = {
	forEachAsync,
	mapAsync,
	Array2D
};
