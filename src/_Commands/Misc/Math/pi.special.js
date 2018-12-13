const pi = require('./pi');

var t = 0;

module.exports = {
	id: 'pi',
	info: 'Low-overhead and minimally computative progressive pi calculator.',
	permissions: 'public',
	data: {
		calculator: pi(),
		digits: new Array()
	},
	events: {
		tick(client) {
			// calculate a new digit every 5 seconds
			if (t++ % 5 == 0) {
				this.data.digits.push(this.data.calculator.next().value);
				//console.log(this.data.digits);
			}
		}
	}
};
