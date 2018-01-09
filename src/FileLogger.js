const FilePromise = require('./FilePromise');

class LogRecord {
	constructor(t, data = {}) {
		this.t = t || Date.now();
		this.data = data;
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

class FileLogger {
	static read(file) {
		return FilePromise.readLinesSync(file, false)
		.filter(Boolean)
		.map(JSON.parse)
		.map(({t,data}) => new LogRecord(t,data));
	}
	static write(file, data) {
		let log = new LogRecord(null, data);
		return FilePromise.appendSync(file, log.toString() + '\n');
	}
	static delete(file) {
		return FilePromise.deleteSync(file);
	}
}

module.exports = FileLogger;