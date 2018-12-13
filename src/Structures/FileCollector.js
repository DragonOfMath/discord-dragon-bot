const path = require('path');
const requireAll  = require('require-all');
const TypeMapBase = require('./TypeMapBase');
const Module      = require('./Module');

const __appdir = path.dirname(require.main.filename);

/**
 * @class FileCollector
 * @extends TypeMapBase
 * Collects files from a directory using require-all, then uses the MapBase for containing them.
 */
class FileCollector extends TypeMapBase {
	constructor() {
		super(Module);
		this.setProperty('options', {});
	}
	resolve(filename) {
		if (path.isAbsolute(filename)) {
			return filename;
		} else {
			return path.resolve(__appdir, filename);
		}
	}
	get filenames() {
		return this.keys;
	}
	get files() {
		return this.items;
	}
	load(dirname = __dirname, options = {}) {
		if (options.filter === undefined) {
			options.filter = /^.+\.js$/;
		}
		options.dirname = this.resolve(dirname);
		//console.log(options);
		this.options = options;
		let files = requireAll(options);
		//console.log(files);
		return this._register(files);
	}
	_register(files) {
		for (let filename in files) {
			if (path.extname(filename).includes('.js')) {
				let moduleName = filename.match(/^([^\.]+)\./)[1];
				this.set(moduleName, filename, files[filename]);
			} else {
				this._register(files[filename]);
			}
		}
		return this;
	}
}

FileCollector.__appdir = __appdir;

module.exports = FileCollector;
