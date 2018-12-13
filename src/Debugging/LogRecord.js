
class LogRecord {
	constructor(t, data = {}) {
		if (typeof(arguments[0]) === 'object') {
			this.t = arguments[0].t || Date.now();
			this.data = arguments[0].data || {};
		} else {
			this.t = t || Date.now();
			this.data = data || {};
		}
	}
	get timestamp() {
		return new Date(this.t).toLocaleString();
	}
	set timestamp(t) {
		this.t = Date.parse(t);
	}
	toString() {
		return JSON.stringify(this);
	}
	toDataString() {
		return Object.keys(this.data).map(k => `${k}: ${this.data[k]}`).join(', ')
	}
}

module.exports = LogRecord;
