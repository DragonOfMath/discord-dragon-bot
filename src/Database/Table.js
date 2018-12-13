const Query         = require('./Query');
const Record        = require('./Record');
const DatabaseError = require('./DatabaseError');
const TypeMapBase   = require('../Structures/TypeMapBase');
const FilePromise   = require('../Structures/FilePromise');

const SAVE_RATE_LIMIT = 5000;

/**
 * @class Table
 * @extends Query(TypeMapBase)
 * Represents a table in a database.
 * Has methods for changing the fields and records, and file I/O.
 */
class Table extends Query(TypeMapBase) {
	/**
	 * Table constructor
	 * @param {String} [filepath] - location of the table file
	 * @param {Object} [data] - default data for the table to immediately load
	 * @param {Object} [fields] - fields of the table
	 */
	constructor(filepath, data = {}, fields = {}) {
		super(Record);
		
		filepath      = FilePromise.resolve(filepath);
		let dir       = FilePromise.getDir(filepath);
		let filename  = FilePromise.getName(filepath);
		let extension = FilePromise.getExtension(filepath);
		
		if (extension !== '.json') {
			throw new DatabaseError(`Expected JSON file at ${filepath}, got ${extension}.`);
		}
		
		this.setProperty('filepath', filepath);
		this.setProperty('dir', dir);
		this.setProperty('filename', filename);
		this.setProperty('fields', fields);
		this.setProperty('_lastSaveTime', Date.now());
		this.setProperty('_lastSaveTimeoutHandle', null);
		this._load(data);
		//this.init();
	}
	/**
	 * Records getter
	 * @return Array of table record IDs
	 */
	get records() {
		return this.keys;
	}
	
	/**
	 * Checks that the table contains a field of the given name.
	 * @param {String} field - name of the table field
	 * @return Boolean for whether the table has the given field
	 */
	hasField(field) {
		return typeof(this.fields[field]) !== 'undefined';
	}
	/**
	 * Retrieves the default value of a field in the table.
	 * @param {String} field - name of the table field
	 * @return Default value of the field
	 */
	getFieldDefault(field) {
		if (!this.hasField(field)) {
			throw new DatabaseError('Table does not have the field ' + field);
		}
		return this.fields[field];
	}
	/**
	 * Sets the default value of the table field, and sets the same field value to all records.
	 * @param {String} field - name of the (existing) table field
	 * @param {Any} value - value of the table field
	 * @return The Table object
	 */
	setFieldDefault(field, value) {
		if (typeof(field) === 'object') {
			let key = Object.keys(field)[0];
			value = field[key];
			field = key;
		}
		if (!this.hasField(field)) {
			throw new DatabaseError('Table does not have the field ' + field);
		}
		if (typeof(value) === 'undefined') {
			throw new DatabaseError('A value for ' + field + ' must be specified');
		}
		this.fields[field] = value;
		for (let id of this.records) {
			this[id].trySet(field, value);
		}
		return this;
	}
	/**
	 * Adds a new field to the table, and adds the same field to all records.
	 * @param {String} field - name of the table field
	 * @param {Any} value - value of the table field
	 * @return The Table object
	 */
	addField(field, value) {
		if (typeof(field) === 'object') {
			let key = Object.keys(field)[0];
			value = field[key];
			field = key;
		}
		if (this.hasField(field)) {
			throw new DatabaseError('Table already has the field ' + field);
		}
		this.fields[field] = value;
		for (let id of this.records) {
			this.modify(id, rec => {
				rec.set(field, rec[field] || value);
				return rec;
			});
		}
		return this;
	}
	/**
	 * Deletes a field from the table, and removes the same field from all records.
	 * @param {String} field - name of the field
	 * @return The Table object.
	 */
	removeField(field) {
		if (!this.hasField(field)) {
			throw new DatabaseError('Table does not have the field ' + field);
		}
		delete this.fields[field];
		for (let id of this.records) {
			this[id].delete(field);
		}
		return this;
	}
	
	/**
	 * Retrieves the record with a matching ID, or a new unassigned one.
	 * @param {String} id - ID of a record
	 * @return A Record object of the found record, or a new one
	 */
	get(id) {
		if (!this._initialized) {
			this.init();
		}
		if (this.has(id)) {
			return this[id];
		} else {
			return this.create({}, this.fields);
		}
	}
	/** 
	 * Assigns the record with the matching ID the given data; overwrites/creates attributes.
	 * @param {Object} data - data to set in a Record
	 * @return The Table object
	 */
	set(id, data) {
		if (this.has(id)) {
			this[id].setAll(data);
		} else {
			this[id] = this.create(data);
		}
		return this;
	}
	/**
	 * Retrieves the record with the matching ID, passes it to the callback function,
	 * then overwrites the record with the modifications from the callback.
	 * @param {String} id - ID of the record
	 * @param {Function} fn - callback function that modifies a record
	 * @return The Table object
	 */
	modify(id, fn) {
		if (typeof(fn) !== 'function') {
			throw new DatabaseError('Modification function required');
		}
		let rec = this.get(id);
		this.set(id, fn(rec));
		return this;
	}
	
	/**
	 * A utility function that handles loading an object with ID/record pairs.
	 * @param {Object} records - object notation of records
	 */
	_load(records) {
		for (let k in records) {
			this.set(k, records[k], this.fields);
		}
		this.setProperty('_initialized', true);
	}
	
	/**
	 * Initializes the table properly by synchronously loading the contents of its file.
	 * @param {String} [filepath] - optional location of the file
	 * @return The Table object
	 */
	init(filepath = this.filepath) {
		if (FilePromise.existsSync(filepath)) {
			this.load(filepath);
		} else {
			FilePromise.createSync(filepath, {});
		}
		this.setProperty('_initialized', true);
		return this;
	}
	/**
	 * Saves the table contents to a file synchronously.
	 * @param {String} [filepath] - optional location of the file
	 * @return The Table object
	 */
	save(filepath = this.filepath) {
		// to protect the file streams from rapid save behavior,
		// do rate-limiting and only save when ready
		let now = Date.now();
		if (now - this._lastSaveTime < SAVE_RATE_LIMIT) {
			if (this._lastSaveTimeoutHandle) {
				clearTimeout(this._lastSaveTimeoutHandle);
			}
			this._lastSaveTime = now;
			this._lastSaveTimeoutHandle = setTimeout(() => this.save(filepath), SAVE_RATE_LIMIT);
			return this;
		}
		
		try {
			FilePromise.createSync(filepath, this);
			this._lastSaveTime = now;
		} catch (e) {
			console.error(e);
		} finally {
			return this;
		}
	}
	/**
	 * Loads the contents of a file and internally parses its contents.
	 * @param {String} [filepath] - optional location of the file
	 * @return The Table object
	 */
	load(filepath = this.filepath) {
		try {
			let contents = FilePromise.readSync(filepath);
			if (contents instanceof Object) {
				this.clear();
				this._load(contents);
			} else {
				throw new DatabaseError(`Table file at ${filepath} could not be loaded due to malformed format`);
			}
		} catch (e) {
			console.error(e);
		} finally {
			return this;
		}
	}
	/**
	 * Deletes the table's file.
	 * @param {String} [filepath] - optional location of the file
	 * @return The Table object
	 */
	destroy(filepath = this.filepath) {
		try {
			FilePromise.deleteSync(filepath);
		} catch (e) {
			throw new DatabaseError(`Table file at ${filepath} could not be deleted: ${e}`);
		} finally {
			return this;
		}
	}
	/**
	 * Cleans up records that no longer exist in the reference.
	 * @param {Object} reference
	 */
	gc(reference) {
		var removed = [];
		for (var id of this.records) {
			if (!(id in reference)) {
				this.delete(id);
				removed.push(id);
			}
		}
		if (removed.length) {
			this.save();
		}
		return removed;
	}
}

module.exports = Table;
