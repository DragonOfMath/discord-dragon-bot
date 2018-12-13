const Query         = require('./Query');
const Table         = require('./Table');
const Record        = require('./Record');
const DatabaseError = require('./DatabaseError');
const Logger        = require('../Debugging/LoggerMixin');
const TypeMapBase   = require('../Structures/TypeMapBase');
const FileCollector = require('../Structures/FileCollector');
const FilePromise   = require('../Structures/FilePromise');

/**
 * @class Database
 * @extends Logger(Query(TypeMapBase))
 */
class Database extends Logger(Query(TypeMapBase)) {
	constructor() {
		super(Table);
		this.setProperty('root', FilePromise.__appdir);
	}
	get tables() {
		return this.items;
	}
	/**
	 * Load the database tables from a directory.
	 * @param {String} [dir] - the directory of files to read; defaults to the current working directory
	 * @param {Boolean} [recursive=true] - load files in subfolders, too
	 * @param {RegExp} [filter] - the filename filter
	 */
	load(dir = this.root, recursive = true, filter = /^\w+\.json$/) {
		try {
			this.root = dir;
			let database = this;
			let fc = new FileCollector();
			
			this.info('Loading database...');
			this.indent();
			fc.load(dir,{recursive,filter});
			fc.forEach((filename, file) => {
				database.add(filename, file);
			});
			this.unindent();
			//this.info('Loading complete.');
		} catch (e) {
			this.error(e);
		}
	}
	
	/**
	 * Adds the table to the database.
	 * @param {String} table - name/filename of the table
	 * @param {Object} data - enumerable data for the table
	 */
	add(table, data = {}) {
		try {
			table = table.match(/^(\w+)\.json$/)[1];
		} catch (e) {}
		
		let filename = FilePromise.join(this.root, table + '.json');
		
		if (this.has(table)) {
			throw new DatabaseError('Table already exists: ' + table);
		}

		this.info('Adding table:',table);
		return this.set(table, filename, data);
	}
	
	/**
	 * Removes the table and its associated file
	 * @param {String} table - name of the table
	 * @param {Boolean} [keepFile] - skip deleting the table file
	 */
	remove(table, keepFile = false) {
		if (!this.has(table)) {
			throw new DatabaseError('No such table: ' + table);
		}
		this.info('Deleting table',table);
		
		let temp = this.get(table);
		if (!keepFile) {
			temp.destroy();
		}
		
		return this.delete(table);
	}
	
	/**
	 * Create a backup folder copy of the tables
	 * @param {String} [backupName="_backup"] - the suffix of the backup directory
	 */
	backup(backupName = '_backup') {
		let backupDir = this.root + backupName;
		if (!FilePromise.existsSync(backupDir)) {
			FilePromise.makeDirSync(backupDir);
		}
		for (let table of this.tables) {
			let filepath = FilePromise.join(backupDir, table.filename);
			table.save(filepath);
		}
	}
	
	/**
	 * Reverts to the database backup folder.
	 * @param {String} [backupName="_backup"] - the suffix of the backup directory
	 * */
	revert(backupName = '_backup') {
		let backupDir = this.root + backupName;
		if (!FilePromise.existsSync(backupDir)) {
			throw new DatabaseError('Backup directory does not exist');
		}
		for (let table of this.tables) {
			let filepath = FilePromise.join(backupDir, table.filename);
			table.load(filepath);
		}
	}

	/**
	 * Save changes to the following tables.
	 * @param  {...String} tables 
	 */
	UPDATE(...tables) {
		for (let t of tables) {
			this.get(t).save();
		}
	}
	/**
	 * Load the tables from their files to undo changes.
	 * @param  {...String} tables 
	 */
	RELOAD(...tables) {
		for (let t of tables) {
			this.get(t).load();
		}
	}

	/**
     * Run an advanced request on the database. See ./README.md for more info on the request structure.
	 * Supports an object format that follows SQL-like instructions and a simpler way.
     * @param {Object} options - the request object
	
	 * Common options
	 * @param {String}               [options.method]   - GET, SET, DELETE, ALTER or UPDATE; defaults to GET
	 * @param {Object<Any>}          [options.alter]    - adds or removes fields from all records
	 * @param {Record|Array<Record>} [options.insert]   - inserts new record(s)
	 * @param {String|Array<String>} [options.delete]   - deletes the selected record(s)
	 * @param {Boolean}              [options.drop]     - drops (delete) the selected table(s)
	 * @param {String|Function}      [options.order_by] - the field or function to order records by
	 * @param {String}               [options.group_by] - the field to group similar records by
	 * @param {Object<Any>}          [options.set]      - the fields to set values to
	
	 * Simple selector options
     * @param {String|Array<String>} [options.table]  - the table ID(s)
     * @param {String|Array<String>} [options.record] - the record ID(s)
     * @param {String|Array<String>} [options.field]  - the field name(s)
	
	 * SQL-like selector options
     * @param {String}               [options.from]     - the table ID
     * @param {Function}             [options.where]    - the record filter
     * @param {String|Array<String>} [options.select]   - the field selector
	
	 * @return Array of records with the given fields, in the given order, grouped as specified.
     */
	request(options) {
		let result;

        if (options.table) {
            result = this.database.get(options.table);
        } else if (options.from) {
            result = this.database.get(options.from);
        } else {
            return this.database;
        }

        if (options.record) {
            result = result.get(options.record);
        } else if (options.where) {
            if (typeof(options.where) === 'string') {
                result = result.get(options.where);
            } else {
                result = result.find(options.where);
            }
        } else {
            return result;
        }

        if (options.field) {
            if (options.field instanceof Array) {
                let field = {};
                for (let f of options.field) {
                    field[f] = result[f] || {};
                }
                return field;
            } else {
                return result[field] || {};
            }
        } else if (options.select) {
            if (options.select instanceof Array) {
                let field = {};
                for (let f of options.select) {
                    field[f] = result[f] || {};
                }
                return field;
            } else if (options.select == '*') {
                return result;
            } else {
                return result[options.select] || {};
            }
        } else {
            return result;
        }
	}
}

module.exports = Database;
