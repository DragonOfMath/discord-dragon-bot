const FilePromise = require('./FilePromise');

class Asset {
	static get directory() {
		return '/assets';
	}
	static getPath(dir) {
		return FilePromise.join(process.cwd(), this.directory, dir);
	}
	static load(dir, encoding) {
		dir = this.getPath(dir);
		return FilePromise.readSync(dir, encoding);
	}
	static require(dir) {
		dir = this.getPath(dir);
		return require(dir);
	}
	static save(dir, data) {
		dir = this.getPath(dir);
		return FilePromise.createSync(dir, data);
	}
}

module.exports = Asset;
