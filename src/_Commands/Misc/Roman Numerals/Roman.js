const ROMAN_VALUES = {
	I: 1,
	V: 5,
	X: 10,
	L: 50,
	C: 100,
	D: 500,
	M: 1000,
	'ↁ': 5000,
	'ↂ': 10000,
	'ↇ': 50000,
	'ↈ': 100000
};
const ROMAN_NUMERALS = Object.keys(ROMAN_VALUES).reverse();

class Roman {
	static from(rn) {
		if (rn == 'nulla') {
			return 0;
		}
		let isNegative = rn[0] == '-';
		if (isNegative) {
			rn = rn.substring(1);
		}
		
		let x = 0;
		
		for (let i = 0; i < rn.length; i++) {
			let letter = rn[i];
			let value  = ROMAN_VALUES[letter];
			let nextLetter = rn[i+1];
			let nextValue  = ROMAN_VALUES[nextLetter];
			if (nextValue > value) {
				x += nextValue - value;
				i++;
			} else {
				x += value;
			}
		}
		
		if (isNegative) {
			x *= -1;
		}
		
		return x;
	}
	static to(x) {
		x = x|0;
		let rn = '';
		if (x == 0) {
			return 'nulla';
		}
		if (x < 0) {
			rn += '-';
			x = Math.abs(x);
		}
		if (x >= 5e5) {
			return 'number is too large';
		}
		
		while (x > 0) {
			let magnitude = Math.pow(10, Math.floor(Math.log10(x)));
			let digits = Math.floor(x / magnitude);
			
			let idx    = ROMAN_NUMERALS.findIndex(r => ROMAN_VALUES[r] == magnitude);
			let letter = ROMAN_NUMERALS[idx];
			let value  = ROMAN_VALUES[letter];
			
			if (digits > 3) {
				if (digits == 4 || digits == 9) {
					x += value;
				} else {
					letter = ROMAN_NUMERALS[idx-1];
					x -= 5 * value;
				}
			} else {
				x -= value;
			}
			
			rn += letter;
		}

		return rn;
	}
}

Roman.NUMERALS = ROMAN_NUMERALS;
Roman.VALUES   = ROMAN_VALUES;

module.exports = Roman;
