const path = require('path');
const requireAll  = require('require-all');
const MapBase     = require('./MapBase');
const TypeMapBase = require('./TypeMapBase');

const APP_DIR = path.dirname(require.main.filename);

/**
	Wrapper class for JS file contents
*/
class JSFile extends MapBase {
	constructor(filename, data) {
		//console.log(data);
		super(data);
		this.setProperty('filename', filename);
	}
}

/**
	Collects files from a directory using require-all,
	using the MapBase technology for containing them.
*/
class FileCollector extends TypeMapBase {
	constructor() {
		super(JSFile);
		this.setProperty('_filter', null);
	}
	resolve(filename) {
		if (path.isAbsolute(filename)) {
			return filename;
		} else {
			return path.resolve(APP_DIR, filename);
		}
	}
	get filenames() {
		return this.keys;
	}
	get files() {
		return this.items;
	}
	load(dirname = __dirname, recursive = true, filter = /^.+\.js$/) {
		dirname = this.resolve(dirname);
		this._filter = filter;
		return this._register(requireAll({dirname,recursive,filter}));
	}
	_register(files) {
		for (var filename in files) {
			if (this._filter.test(filename)) {
				var moduleName = filename.match(/^([^\.]+)\./)[1];
				this.set(moduleName, filename, files[filename]);
			} else {
				this._register(files[filename]);
			}
		}
		return this;
	}
}

module.exports = FileCollector;
