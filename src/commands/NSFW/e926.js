const Booru = require('./booru');

class E926 extends Booru {
	static get host() {
		return 'https://e926.net';
	}
	static get color() {
		return 0x8cc5ff;
	}
}

module.exports = E926;
