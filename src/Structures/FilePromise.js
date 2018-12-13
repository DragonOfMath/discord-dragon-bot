const fs      = require('fs');
const path    = require('path');
const request = require('request');
const {promisify} = require('../Utils/function');

const HYPERLINK  = /^(http|ftp)s?:\/\//;
const TEXT_TYPES = ['.txt','.json','.js','.md','.log','.bat'];
const READ  = 'r';
const WRITE = 'w';
const WRITE_APPEND = 'wx';

const __appdir = path.dirname(require.main.filename);

function splitLines(content) {
	return content.split(/\r?\n/).filter(String);
}

/**
 * @class FilePromise
 * Provides asynchronous file I/O
*/
class FilePromise {
	/**
	 * Resolve the path to itself or from the current working directory
	 * @arg {String} filename - the path of the file or link
	 * @return String of the fully-qualified filepath
	 */
	static resolve(filename) {
		if (HYPERLINK.test(filename)) {
			return filename;
		} else if (path.isAbsolute(filename)) {
			return filename;
		} else {
			return path.resolve(__appdir, filename);
		}
	}
	/**
		Wrapper for path.join
	*/
	static join(...paths) {
		return path.join(...paths);
	}
	/**
		Wrapper for path.dirname
	*/
	static getDir(filepath) {
		return path.dirname(filepath);
	}
	/**
		Wrapper for path.basename
	*/
	static getName(filepath, ext) {
		return path.basename(filepath, ext);
	}
	/**
		Wrapper for path.extname
	*/
	static getExtension(filepath) {
		return path.extname(filepath);
	}
	/**
		Read and return a file's metadata
		@arg {String} filename - location of the file
		@return a Promise that resolves to the file stats Object
	*/
	static getStats(filename) {
		filename = this.resolve(filename);
		return promisify.call(this, fs.stats, filename);
	}
	/**
		Read and return a file's metadata synchronously
		@return the file stats Object
	*/
	static getStatsSync(filename) {
		filename = this.resolve(filename);
		return fs.statsSync(filename);
	}
	/**
		Reads a file's contents and returns the data in a Promise
		@arg {String} filename - location of the file, either local or remote
		@arg {String} [encoding] - the encoding of the file, defaults to utf8 if it's a known text format
		@return a Promise that resolves to the contents of the file, cast to an appropriate type
	*/
	static read(filename, encoding) {
		filename = this.resolve(filename);
		let type = this.getExtension(filename);
		if (!encoding && TEXT_TYPES.includes(type)) {
			encoding = 'utf8';
		}
		if (HYPERLINK.test(filename)) {
			// read data from a remote source
			return new Promise((resolve, reject) => {
				request({url:filename, encoding}, function (error, response, body) {
					if (error) {
						return reject(error);
					} else if (response && response.statusCode >= 300) {
						return reject('Status Code: ' + response.statusCode);
					} else {
						if (encoding == 'binary' && typeof(body) === 'string') {
							body = Buffer.from(body, encoding);
						}
						return resolve(body);
					}
				});
			});
		} else {
			return promisify.call(this, fs.readFile, filename, encoding)
			.then(data => {
				if (type === '.json') {
					data = JSON.parse(data);
				}
				return data;
			});
		}
		
	}
	/**
		Reads a file's contents synchronously, returns the data
		@arg {String} filename - location of the file (local only)
		@arg {String} [encoding] - the encoding of the file, defaults to utf8 if it's a known text format
		@return the file's contents
	*/
	static readSync(filename, encoding) {
		filename = this.resolve(filename);
		let type = this.getExtension(filename);
		if (!encoding && TEXT_TYPES.includes(type)) {
			encoding = 'utf8';
		}
		let data = fs.readFileSync(filename, encoding);
		if (type === '.json') {
			data = JSON.parse(data);
		}
		return data;
	}
	/**
		Reads a file's contents and returns the data as an array of its lines in a Promise
		@arg {String} filename - location of the file
		@return Promise that resolves to an Array<string> of the file's contents
	*/
	static readLines(filename) {
		filename = this.resolve(filename);
		return this.read(filename).then(splitLines);
	}
	/**
		Reads a file's contents synchronously, and returns the data as an array of its lines
		@arg {String} filename - location of the file
		@return Array<string> of the file's contents
	*/
	static readLinesSync(filename) {
		filename = this.resolve(filename);
		let data = this.readSync(filename);
		return (data && splitLines(data)) || [];
	}
	/**
		Reads multiple files and returns key/value pairs of their filenames/data
		@arg {Array<String>} filenames - location of the files
		@return Promise that resolve to an Object with keys as the filenames and values as the contents of each file
	*/
	static readAll(filenames) {
		filenames = filenames.map(f => this.resolve(f));
		return Promise.all(filenames.map(this.read))
		.then(results => {
			let o = {};
			for (let f = 0; f < filenames.length; f++) {
				o[filenames[f]] = results[f];
			}
			return o;
		});
	}
	/**
		Reads multiple files synchronously
		@arg {Array<String>} filenames - location of the files
		@return Object with keys as the filenames and values as the contents of each file
	*/
	static readAllSync(filenames) {
		return filenames.map(this.readSync);
	}
	/**
		Creates an empty file, or replaces an existing one
		@arg {String} filename - location of the file
		@return Promise that resolves when the file is successfully created
	*/
	static createEmpty(filename) {
		filename = this.resolve(filename);
		return promisify.call(this, fs.open, filename, WRITE);
	}
	/**
		Creates an empty file synchronously, or replaces an existing one
		@arg {String} filename - location of the file
	*/
	static createEmptySync(filename) {
		filename = this.resolve(filename);
		return fs.openSync(filename, WRITE);
	}
	/**
		Creates or overwrites an existing file with the given contents
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
		@return Promise that resolves to the success of the file operation
	*/
	static create(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'File cannot be made with empty contents.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return promisify.call(this, fs.writeFile, filename, contents);
	}
	/**
		Creates or overwrites an existing file synchronously with the given contents
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
		@return Success of the file operation
	*/
	static createSync(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'File cannot be made with empty contents.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return fs.writeFileSync(filename, contents);
	}
	/**
		Creates or appends to an existing file
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
		@return Promise that resolves to the success of the file operation
	*/
	static append(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'Cannot append empty contents to file.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return promisify.call(this, fs.appendFile, filename, contents);
	}
	/**
		Appends contents to a file synchronously
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
		@return Success of the file operation
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
		@return Promise that resolves to the success of the file operation
	*/
	static delete(filename) {
		filename = this.resolve(filename);
		return promisify.call(this, fs.unlink, filename);
	}
	/**
		Deletes a file synchronously
		@arg {String} filename - location of the file
		@return Success of the file operation
	*/
	static deleteSync(filename) {
		filename = this.resolve(filename);
		return fs.unlinkSync(filename);
	}
	/**
		Renames a file
		@arg {String} filename - location of the file
		@arg {String} newfilename - new file location
		@return Promise that resolves to the success of the operation
	*/
	static rename(filename, newfilename) {
		filename = this.resolve(filename);
		newfilename = this.resolve(newfilename);
		return promisify.call(this, fs.rename, filename, newfilename);
	}
	/**
		Renames a file synchronously
		@arg {String} filename - location of the file
		@arg {String} newfilename - new file location
		@return Success of the operation
	*/
	static renameSync(filename, newfilename) {
		filename = this.resolve(filename);
		newfilename = this.resolve(newfilename);
		return fs.renameSync(filename, newfilename);
	}
	/**
		Checks that a file exists
		@arg {String} filename - location of the file
		@return Promise that resolves to a boolean indicating if the file exists
	*/
	static exists(filename) {
		filename = this.resolve(filename);
		return promisify.call(this, fs.exists, filename);
	}
	/**
		Checks that a file exists synchronously
		@arg {String} filename - location of the file
		@return Boolean indicating if a file exists
	*/
	static existsSync(filename) {
		filename = this.resolve(filename);
		return fs.existsSync(filename);
	}
	/**
		Make the directory at the given path
		@arg {String} filepath
		@return Promise that resolves to the success of the operation
	*/
	static makeDir(filepath) {
		filepath = this.resolve(filepath);
		return promisify.call(this, fs.mkdir, filepath);
	}
	/**
		Make the directory synchronously
		@arg {String} filepath
		@return Success of the operation
	*/
	static makeDirSync(filepath) {
		filepath = this.resolve(filepath);
		return fs.mkdirSync(filepath);
	}
	/**
		Get a list of files in the given directory
		@arg {String} filepath
		@return Promise that resolves to an Array of filenames in the directory
	*/
	static readDir(filepath) {
		filepath = this.resolve(filepath);
		return promisify.call(this, fs.readdir, filepath);
	}
	/**
		Get a list of files in the given directory synchronously
		@arg {String} filepath
		@return Array of filenames in the directory
	*/
	static readDirSync(filepath) {
		filepath = this.resolve(filepath);
		return fs.readdirSync(filepath);
	}
}

FilePromise.__appdir = __appdir;

module.exports = FilePromise;
