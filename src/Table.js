const TypeMapBase = require('./TypeMapBase');
const Record      = require('./Record');
const FilePromise = require('./FilePromise');

/**
	@class Table
	Represents a table in a database
	Has methods for changing the fields and records, and file I/O
*/
class Table extends TypeMapBase {
	/**
		Constructor
		@arg {String} [dir] - location of the table file
		@arg {Object} [data] - default data for the table to immediately load
		@arg {Object} [fields] - fields of the table
	*/
	constructor(dir = './table.json', data = {}, fields = {}) {
		super(Record);
		this.setProperty('dir', dir);
		this.setProperty('fields', fields);
		this._load(data);
		//this.init();
	}
	/**
		Records getter
		@return Array of table record IDs
	*/
	get records() {
		return this.keys
	}
	
	/*
		Field methods
		Fields act as a default data structure for new records.
	*/
	
	/**
		Checks that the table contains a field of the given name
		@arg {String} field - name of the table field
		@return Boolean for whether the table has the given field
	*/
	hasField(field) {
		return typeof(this.fields[field]) !== 'undefined'
	}
	/**
		Retrieves the default value of a field in the table
		@arg {String} field - name of the table field
		@return Default value of the field
	*/
	getFieldDefault(field) {
		if (!this.hasField(field)) {
			throw 'Table does not have a field called ' + field
		}
		return this.fields[field]
	}
	/**
		Sets the default value of the table field, and sets the same field value to all records
		@arg {String} field - name of the (existing) table field
		@arg {Any} value - value of the table field
		@return The Table object
	*/
	setFieldDefault(field, value) {
		if (typeof(field) === 'object') {
			let key = Object.keys(field)[0]
			value = field[key]
			field = key
		}
		if (!this.hasField(field)) {
			throw 'Table does not have a field called ' + field
		}
		if (typeof(value) === 'undefined') {
			throw 'A value for ' + field + ' must be specified'
		}
		this.fields[field] = value
		for (let id of this.records) {
			this[id].trySet(field, value)
		}
		return this
	}
	/**
		Adds a new field to the table, and adds the same field to all records
		@arg {String} field - name of the table field
		@arg {Any} value - value of the table field
		@return The Table object
	*/
	addField(field, value) {
		if (typeof(field) === 'object') {
			let key = Object.keys(field)[0]
			value = field[key]
			field = key
		}
		if (this.hasField(field)) {
			throw 'Table already has a field called ' + field
		}
		this.fields[field] = value
		for (let id of this.records) {
			this.modify(id, rec => {
				//console.log(id,rec)
				rec.set(field, rec[field] || value);
				return rec
			});
		}
		return this
	}
	/**
		Deletes a field from the table, and removes the same field from all records
		@arg {String} field - name of the field
		@return The Table object.
	*/
	removeField(field) {
		if (!this.hasField(field)) {
			throw 'Table does not have a field called ' + field
		}
		delete this.fields[field]
		for (let id of this.records) {
			this[id].delete(field)
		}
		return this
	}
	
	/*
		Record methods
		Records are objects keyed by some unique ID.
	*/
	
	/**
		Retrieves the record with a matching ID, or a new unassigned one
		@arg {String} id - ID of a record
		@return A Record object of the found record, or a new one
	*/
	get(id) {
		if (!this._initialized) {
			this.init()
		}
		if (this.has(id)) {
			return this[id]
		} else {
			return this.create({}, this.fields)
		}
	}
	/**
		Assigns the record with the matching ID the given data; overwrites/creates attributes
		@arg {Object} data - data to set in a Record
		@return The Table object
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
		Retrieves the record with the matching ID, passes it to the callback function,
		then overwrites the record with the modifications from the callback.
		@arg {String} id - ID of the record
		@arg {Function} fn - callback function that modifies a record
		@return The Table object
	*/
	modify(id, fn) {
		if (typeof(fn) !== 'function') {
			throw 'Table.modify() requires a function.'
		}
		let rec = this.get(id);
		this.set(id, fn(rec));
		return this;
	}
	
	/**
		A utility function that handles loading an object with ID/record pairs.
		@arg {Object} records - object notation of records
	*/
	_load(records) {
		for (let k in records) {
			this.set(k, records[k], this.fields);
		}
		this.setProperty('_initialized', true);
	}
	
	/*
		File methods
	*/

	/**
		Initializes the table properly by synchronously loading the contents of its file
		@arg {String} [dir] - optional location of the file
		@return The Table object
	*/
	init(dir = this.dir) {
		if (FilePromise.existsSync(dir)) {
			this.load(dir);
		} else {
			FilePromise.createSync(dir, {});
		}
		this.setProperty('_initialized', true);
		return this;
	}
	/**
		Saves the table contents to a file synchronously
		@arg {String} [dir] - optional location of the file
		@return The Table object
	*/
	save(dir = this.dir) {
		try {
			let result = FilePromise.createSync(dir, this);
		} catch (e) {
			console.error(e);
		} finally {
			return this;
		}
	}
	/**
		Loads the contents of a file and internally parses its contents
		@arg {String} [dir] - optional location of the file
		@return The Table object
	*/
	load(dir = this.dir) {
		try {
			let contents = FilePromise.readSync(dir);
			if (contents instanceof Object) {
				this.clear();
				this._load(contents);
			} else {
				throw 'Contents of table could not be loaded due to malformed format: ' + dir;
			}
		} catch (e) {
			console.error(e);
		} finally {
			return this;
		}
	}
	/**
		Deletes the table's file
		@arg {String} [dir] - optional location of the file
		@return The Table object
	*/
	destroy(dir = this.dir) {
		try {
			FilePromise.deleteSync(dir);
		} catch (e) {
			throw 'Table file could not be deleted: ' + (e.message || e);
		} finally {
			return this;
		}
	}
	/**
		Cleans up IDs that no longer exist
	*/
	gc(reference) {
		var removed = [];
		for (var id of this.records) {
			if (!reference[id]) {
				this.delete(id);
				this.removed.push(id);
			}
		}
		if (removed.length) {
			console.log('Removed',removed.length,'records from',this.dir);
			this.save();
		}
	}
}

module.exports = Table;
