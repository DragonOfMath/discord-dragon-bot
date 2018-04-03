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

module.exports = {Array2D};
