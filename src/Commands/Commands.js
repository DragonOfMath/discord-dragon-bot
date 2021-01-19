const Command       = require('./Command');
const FileCollector = require('../Structures/FileCollector');
const TypeMapBase   = require('../Structures/TypeMapBase');
const Logger        = require('../Debugging/Logger');
const Constants     = require('../Constants');
const {Markdown:md,strcmp,truncate,Array} = require('../Utils');

/**
 * Commands class constructor
 * Responsible for registering, validating, categorizing, and resolving commands.
 * @class Commands
 * @extends TypeMapBase
 * @param {Client} client
*/
class Commands extends TypeMapBase {
	constructor(client) {
		super(Command);
		const logger = new Logger('Commands');
		this.setProperties({
			client,
			logger
		});
	}
	toString() {
		return this.toArray().map(cmd => cmd.toString()).join('\n');
	}
	toArray() {
		return this.items;
	}
	
	/**
	 * Load command files from a directory, then load command descriptors from each file.
	 * @param {String} [dir] - the directory location of command modules to load; defaults to the current directory
	 * @param {Object} [options] - options for loading commands
	 * @param {Boolean} [options.recursive=true] - look for and load command modules in subfolders
	 * @param {RegExp} [options.filter] - the filename filter, defaults to `Constants.Commands.FILE_REGEX`
	 */
	load(dir = __dirname, options = {}) {
		if (typeof(options.recursive) === 'undefined') {
			options.recursive = true;
		}
		if (typeof(options.filter) === 'undefined') {
			options.filter = Constants.Commands.FILE_REGEX;
		}
		let fc = new FileCollector();
		this.logger.info('Loading files...');
		this.logger.indent();
		fc.load(dir,options);
		fc.forEach((filename, file) => {
			this.logger.info(filename);
			this.logger.indent();
			this._register(file);
			this.logger.unindent();
		});
		this.logger.unindent();
		//this.logger.info('Loading complete.');
	}
	_register(commands) {
		for (let cmd in commands) {
			let descriptor = commands[cmd];
			this.logger.info(cmd);
			this.set(cmd, cmd, descriptor);
		}
	}
	
	/**
	 * Get the categories used by commands.
	 * @return {Array<String>}
	 */
	get categories() {
		return this.items.reduce((cat,cmd) => {
			if (cat.indexOf(cmd.category) < 0) {
				cat.push(cmd.category);
			}
			return cat;
		}, []);
	}
	/**
	 * Check if a category exists among the commands.
	 * @param {String} cat - the category
	 * @return {Boolean}
	 */
	hasCategory(cat) {
		return this.categories.some(c => strcmp(c,cat));
	}
	/**
	 * Get the commands in the category.
	 * @param {String} cat - the category
	 * @return {Array<Command>}
	 */
	getCategoryCommands(cat) {
		return this.items.reduce((cmds,cmd) => {
			if (strcmp(cmd.category,cat)) {
				cmds.push(cmd);
			}
			return cmds;
		}, []);
	}
	/**
	 * Resolve a category by name, case-insensitive
	 * @param {String} cat - the category
	 * @return {String}
	 */
	resolveCategory(cat) {
		return this.categories.find(c => strcmp(c,cat)) || '';
	}
	
	/**
	 * Gets command objects. Accepts wildcard and categorical selectors.
	 * @param {...String} cmds - the commands to resolve to
	 * @return {Array<Command>}
	*/
	get(...cmds) {
		if (!cmds.length) {
			cmds.push(Constants.Symbols.WILDCARD);
		}
		return this.items.reduce((matches, command) => {
			for (let cmd of cmds) {
				let match = command.resolveAlias(cmd);
				if (match != null) {
					matches.push(match);
				}
			}
			return matches;
		}, []).flatten().unique();
	}
	/**
	 * Checks if a command exists.
	 * @param {String|Array<String>} cmd - the command label or alias
	 * @return {Boolean}
	*/
	has(cmd) {
		try {
			let matches = this.get(cmd);
			return matches.length == 1;
		} catch (e) {
			return false;
		}
	}
	/**
	 * Resolve Handler input
	 * Matches input to a command
	 * If 1 command found:
	 * 	Checks permissions and parameters
	 * 	Runs the command
	 * Else:
	 * 	Produces a listing of matched commands
	 * TODO: resolve unique subcommands
	 * @param {Handler} handler
	 * @return {Promise} resolves to the handler
	 */
	resolve(handler) {
		// find the command object, if possible
		let commands = this.get(handler.cmds);
		
		if (commands.length == 0) {
			this.logger.warn('Not a command: ' + handler.cmd);
			return handler.resolve();
			
		} else if (commands.length == 1) {
			let command = commands[0];
			handler.command = command;
			handler.cmd = command.fullID;
			this.logger.info(handler.cmd, handler.args, handler.flags);
			command.validate(handler);
			if (handler.grant == 'granted') {
				return command.run(handler);
			} else {
				return handler.resolve(':no_entry_sign: **Denied**: ' + handler.grant);
			}
			
		} else {
			this.logger.info(handler.text,'->',commands.length,'matches');
			commands = commands.filter(cmd => !cmd.generated);
			if (handler.userID != handler.client.ownerID) {
				commands = commands.filter(cmd => !cmd.suppress);
			}
			let msg = commands.map(cmd => cmd.fullID).sort().join(', ');
			//msg = truncate(msg, 1980);
			msg = 'Matches:\n' + md.codeblock(msg);
			return handler.resolve(msg);
		}
	}
}

module.exports = Commands;
