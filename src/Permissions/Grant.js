
class Grant {
	constructor(g, r) {
		if (typeof(g) === 'boolean') {
			this.granted = !!g;
			this.reason = r;
		} else if (typeof(g) === 'string') {
			this.granted = false;
			this.reason = g;
		} else {
			this.granted = true;
		}
	}
	get value() {
		if (this.granted) {
			return 'granted';
		} else {
			return this.reason;
		}
	}
	static granted() {
		return new Grant(true);
	}
	static denied(reason) {
		return new Grant(false, reason);
	}
}

module.exports = Grant;
