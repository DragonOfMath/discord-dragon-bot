const TypeMapBase   = require('./TypeMapBase');
const Table         = require('./Table');
const Logger        = require('./LoggerMixin');
const FileCollector = require('./FileCollector');
const path = require('path');

class Database extends Logger(TypeMapBase) {
	constructor() {
		super(Table);
		this.setProperty('root', __dirname);
	}
	
	load(dir = this.root, recursive = true, filter = /^\w+\.json$/) {
		try {
			this.root = dir;
			var database = this;
			var fc = new FileCollector();
			
			this.info('Loading database...');
			this.indent();
			fc.load(dir,recursive,filter);
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
		Adds the table to the database.
		@arg {String} table - name/filename of the table
		@arg {Object} data - enumerable data for the table
	*/
	add(table, data = {}) {
		try {
			table = table.match(/^(\w+)\.json$/)[1];
		} catch (e) {}
		
		var filename = path.join(this.root, table + '.json');
		
		if (this.has(table)) {
			return this.error('Table "' + table + '" already exists.');
		}

		this.info('Adding table:',table);
		return this.set(table, filename, data);
	}
	
	/**
		Removes the table and its associated file
		@arg {String} table - name of the table
		@arg {Boolean} [keepFile] - skip deleting the table file
	*/
	remove(table, keepFile = false) {
		if (!this.has(table)) {
			this.error('Table "' + table + '" does not exist.');
		}
		this.info('Deleting table',table);
		
		let temp = this.get(table);
		if (!keepFile) {
			temp.destroy();
		}
		
		return this.delete(table);
	}
}

module.exports = Database;
