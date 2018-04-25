const fs      = require('fs');
const Promise = require('bluebird');
const path    = require('path');

const APP_DIR = path.dirname(require.main.filename);
const WRITE = 'w';
const WRITE_APPEND = 'wx';
const READ = 'r';
const ENCODING = 'utf8';

function splitLines(content) {
	return content.split(/\r?\n/).filter(String);
}

class FilePromise {
	static resolve(filename) {
		if (path.isAbsolute(filename)) {
			return filename;
		} else {
			return path.resolve(APP_DIR, filename);
		}
	}
	/**
		Reads a file's contents and returns the data in a Promise
		@arg {String} filename - location of the file
	*/
	static read(filename) {
		filename = this.resolve(filename);
		return new Promise((resolve, reject) => {
			fs.readFile(filename, ENCODING, (err, data) => {
				if (err) {
					return reject(err);
				}
				if (/json$/.test(filename)) {
					try {
						data = JSON.parse(data);
					} catch (e) {}
				}
				return resolve(data);
			});
		});
	}
	/**
		Reads a file's contents synchronously, returns the data
		@arg {String} filename - location of the file
	*/
	static readSync(filename) {
		filename = this.resolve(filename);
		let data = fs.readFileSync(filename, ENCODING);
		if (/json$/.test(filename)) {
			try {
				data = JSON.parse(data);
			} catch (e) {}
		}
		return data;
	}
	/**
		Reads a file's contents and returns the data as an array of its lines in a Promise
		@arg {String} filename - location of the file
	*/
	static readLines(filename) {
		filename = this.resolve(filename);
		return this.read(filename).then(splitLines);
	}
	/**
		Reads a file's contents synchronously, and returns the data as an array of its lines
		@arg {String} filename - location of the file
	*/
	static readLinesSync(filename) {
		filename = this.resolve(filename);
		let data = this.readSync(filename);
		return (data && splitLines(data)) || [];
	}
	/**
		Reads multiple files and returns key/value pairs of their filenames/data
		@arg {Array<String>} filenames - location of the files
	*/
	static readAll(filenames, json = true) {
		filenames = filenames.map(f => this.resolve(f));
		return Promise.all(filenames.map(f => this.read(f,json)))
		.then(results => {
			var o = {};
			for (let f = 0; f < filenames.length; f++) {
				o[filenames[f]] = results[f];
			}
			return o;
		});
	}
	/**
		Reads multiple files synchronously
		@arg {Array<String>} filenames - location of the files
	*/
	static readAllSync(filenames, json = true) {
		return filenames.map(f => this.readSync(f,json));
	}
	/**
		Creates an empty file, or replaces an existing one
		@arg {String} filename - location of the file
	*/
	static createEmpty(filename) {
		filename = this.resolve(filename);
		return new Promise((resolve, reject) => {
			fs.open(filename, WRITE, (err, file) => {
				if (err) {
					return reject(err);
				}
				return resolve(file);
			});
		});
	}
	/**
		Creates an empty file synchronously, or replaces an existing one
		@arg {String} filename - location of the file
	*/
	static createEmptySync(filename) {
		filename = this.resolve(filename);
		return fs.open(filename, WRITE);
	}
	/**
		Creates or overwrites an existing file with the given contents
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
	*/
	static create(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'File cannot be made with empty contents.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return new Promise((resolve, reject) => {
			fs.writeFile(filename, contents, err => {
				if (err) {
					return reject(err);
				}
				return resolve(filename);
			});
		});
	}
	/**
		Creates or overwrites an existing file synchronously with the given contents
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
	*/
	static createSync(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'File cannot be made with empty contents.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return fs.writeFile(filename, contents);
	}
	/**
		Creates or appends to an existing file
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
	*/
	static append(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'Cannot append empty contents to file.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return new Promise((resolve, reject) => {
			fs.appendFile(filename, contents, err => {
				if (err) {
					return reject(err);
				}
				return resolve(filename);
			});
		});
	}
	/**
		Appends contents to a file synchronously
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
	*/
	static appendSync(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'Cannot append empty contents to file.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return fs.appendFileSync(filename, contents);
	}
	/**
		Deletes a file
		@arg {String} filename - location of the file
	*/
	static delete(filename) {
		filename = this.resolve(filename);
		return new Promise((resolve, reject) => {
			fs.unlink(filename, err => {
				if (err) {
					return reject(err);
				}
				return resolve(filename);
			});
		});
	}
	/**
		Deletes a file synchronously
		@arg {String} filename - location of the file
	*/
	static deleteSync(filename) {
		filename = this.resolve(filename);
		return fs.unlinkSync(filename);
	}
	/**
		Renames a file
		@arg {String} filename - location of the file
		@arg {String} newfilename - new file location
	*/
	static rename(filename, newfilename) {
		filename = this.resolve(filename);
		newfilename = this.resolve(newfilename);
		return new Promise((resolve, reject) => {
			fs.rename(filename, newfilename, err => {
				if (err) {
					return reject(err);
				}
				return resolve(newfilename);
			});
		});
	}
	/**
		Renames a file synchronously
		@arg {String} filename - location of the file
		@arg {String} newfilename - new file location
	*/
	static renameSync(filename, newfilename) {
		filename = this.resolve(filename);
		newfilename = this.resolve(newfilename);
		return fs.renameSync(filename, newfilename);
	}
	/**
		Checks that a file exists
		@arg {String} filename - location of the file
	*/
	static exists(filename) {
		filename = this.resolve(filename);
		return new Promise((resolve, reject) => {
			fs.exists(filename, resolve);
		});
	}
	/**
		Checks that a file exists synchronously
		@arg {String} filename - location of the file
	*/
	static existsSync(filename) {
		filename = this.resolve(filename);
		return fs.existsSync(filename);
	}
	/**
		Make the directory at the given path
		@arg {String} path
	*/
	static makeDir(path) {
		path = this.resolve(path);
		return new Promise((resolve, reject) => {
			fs.mkdir(path, (err, res) => {
				if (err) {
					return reject(err);
				}
				return resolve(res);
			});
		});
	}
	/**
		Make the directory synchronously
		@arg {String} path
	*/
	static makeDirSync(path) {
		path = this.resolve(path);
		return fs.mkdirSync(path);
	}
	/**
		Get a list of files in the given directory
		@arg {String} path
	*/
	static readDir(path) {
		path = this.resolve(path);
		return new Promise((resolve, reject) => {
			fs.readdir(path, (err, files) => {
				if (err) {
					return reject(err);
				}
				return resolve(files);
			});
		})
	}
	/**
		Get a list of files in the given directory synchronously
		@arg {String} path
	*/
	static readDirSync(path) {
		path = this.resolve(path);
		return fs.readdirSync(path);
	}
}

module.exports = FilePromise;
