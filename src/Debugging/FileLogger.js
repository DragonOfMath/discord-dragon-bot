const LogRecord = require('./LogRecord');
const FilePromise = require('../Structures/FilePromise');

class FileLogger {
	constructor(file) {
		this.filename = file;
	}
	read() {
		return FileLogger.read(this.filename);
	}
	write(data) {
		return FileLogger.write(this.filename, data);
	}
	delete() {
		return FileLogger.delete(this.filename);
	}
	static read(file) {
		return FilePromise.readLines(file, false)
		.then(contents => {
			return contents.filter(Boolean)
			.map(JSON.parse)
			.map(rec => new LogRecord(rec));
		});
	}
	static write(file, data) {
		let log = new LogRecord(0, data);
		return FilePromise.append(file, log.toString() + '\n');
	}
	static delete(file) {
		return FilePromise.delete(file);
	}
}

module.exports = FileLogger;
