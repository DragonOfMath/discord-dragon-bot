const Booru = require('./booru');

class E621 extends Booru {
	static get host() {
		return 'https://e621.net';
	}
	static get color() {
		return 0x012e57;
	}
}

module.exports = E621;
