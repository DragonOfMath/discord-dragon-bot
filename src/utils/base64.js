const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

module.exports.Base64 = {
	DIGITS,
	from(input, type = 'string') {
		if (type == 'string') {
			return Buffer.from(input, 'base64').toString('ascii');
		} else if (type == 'number') {
			let output = 0, idx;
			for (let c of input) {
				if (c == '=') break;
				output *= 64;
				idx = DIGITS.indexOf(c);
				if (idx > -1) {
					output += idx;
				}
			}
			return output;
		}
	},
	to(input) {
		if (typeof input == 'string') {
			return Buffer.from(input).toString('base64');
		} else if (typeof input == 'number') {
			if (isNaN(input) || !isFinite(input) || input < 0) {
				throw 'Invalid number/range.';
			}
			input = Math.floor(input);
			let output = '';
			while (input) {
				output = DIGITS[input % 64] + output;
				input  = Math.floor(input/ 64);
			}
			return output;
		}
	}
};