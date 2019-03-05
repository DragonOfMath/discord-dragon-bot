const FilePromise = require('./FilePromise');

class Asset {
	static getPath(dir) {
		return FilePromise.join(process.cwd(), this.directory, dir);
	}
	static load(dir) {
		dir = this.getPath(dir);
		return FilePromise.readSync(dir);
	}
	static require(dir) {
		dir = this.getPath(dir);
		return require(dir);
	}
}
Asset.directory = '/assets';

module.exports = Asset;
