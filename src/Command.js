const Parameters  = require('./Parameters');
const Permissions = require('./ConfigurablePermissions');
const Properties  = require('./Properties');
const TypeMapBase = require('./TypeMapBase');
const Resource    = require('./Resource');
const Constants   = require('./Constants');
const {Markdown:md,strcmp} = require('./Utils');

/**
	Subcommands class
	Extension of TypeMapBase to provide recursive processing of Command descriptors
*/
class Subcommands extends TypeMapBase {
	/**
		Subcommands constructor
		@class
		@arg {Object}  [subcommands]  - subcommands to process into Commands
		@arg {Command} [supercommand] - the Command to bind subcommands to
	*/
	constructor(subcommands = {}, supercommand) {
		super(Command);
		if (!(supercommand instanceof this.type)) {
			throw new TypeError(`${this.constructor.name}.supercommand must be a ${this.type.name}`);
		}
		this.setProperty('supercommand', supercommand)
		if (!(subcommands instanceof Object)) {
			throw new TypeError(`${this.constructor.name}.subcommands must be an Object.`);
		}
		for (let sub in subcommands) {
			sub = this.create(sub, subcommands[sub]);
			this.addSubcommand(sub);
		}
		if (this.length > 0 && !this.has(Constants.Symbols.HELP)) {
			const help = this.create(Constants.Symbols.HELP, {
				aliases: ['help','subcommands'],
				title: `Subcommands`,
				info: '(Automatically generated subcommand for listing other subcommands)',
				permissions: 'public',
				suppress: true,
				analytics: false,
				fn({client,userID}) {
					if (userID == client.ownerID) {
						return supercommand.listAllSubcommands();
					} else {
						return supercommand.listSubcommands();
					}
				}
			});
			this.addSubcommand(help);
		}
	}
	/**
		@return Array of subcommand names
	*/
	get list() {
		return this.keys;
	}
	/**
		@return Array of subcommand full identifiers
	*/
	get fullIDs() {
		return this.keys.map(k => this[k].fullID);
	}
	/**
		Internally binds the subcommand to the supercommand
		@arg {Command} sub - subcommand to add
		@return the Subcommands instance
	*/
	addSubcommand(sub) {
		if (this.has(sub.id)) {
			throw `${sub.id} already exists as a subcommand of ${this.supercommand.fullID}`;
		}
		//console.log(`Adding ${sub.id} to ${this.supercommand.fullID}`);
		sub.supercommand = this.supercommand;
		sub.properties.inherit(this.supercommand.properties);
		sub.category = sub.category || this.supercommand.category;
		sub.suppress = sub.suppress || this.supercommand.suppress;
		//console.log('Suppressed:',sub.id,sub.suppress);
		return this.set(sub.id, sub);
	}
}

/**
	@class CommandError
	@extends Error
	Custom error object for commands.
*/
class CommandError extends Error {
	constructor(cmd, str) {
		super(`${str} (in "${cmd}")`);
		this.name = 'CommandError';
	}
}

/**
	Command class
	Defines a command's main handle, aliases, description, permissions, and subcommands
*/
class Command extends Resource {
	/**
		@class Command
		@extends Resource
		@arg {String}        id                       - the main alias/handle/name of the command.
		@arg {Object}        [descriptor]             - command description object, multiple fields below
		@arg {Array<String>} [descriptor.aliases]     - alternative names for the command
		@arg {String}        [descriptor.category]    - category for the command, else a default one is used
		@arg {String}        [descriptor.info]        - retrievable information about the command
		@arg {Array<String>} [descriptor.parameters]  - strictly-formatted parameter list for the command (see Parameters.js)
		@arg {String}        [descriptor.permissions] - default permission type of the command            (see Permissions.js)
		@arg {Object}        [descriptor.properties]  - optional properties for the command               (see Properties.js)
		@arg {Boolean}       [descriptor.suppress]    - prevent listing this command and its subcommands
		@arg {Object}        [descriptor.subcommands] - subcommands which are recursively processed
		@arg {Function}      [descriptor.fn]          - the command function handler, which takes one argument, the input object
	*/
	constructor(id, descriptor = {}) {
		super(Constants.Command.TEMPLATE, descriptor);
		if (typeof(id) !== 'string' || !id) {
			throw new CommandError('<invalid>', `id must be a string identifier.`);
		}
		if (Constants.Symbols.RESERVED.some(r => id.includes(r))) {
			throw new CommandError(id, `id cannot have any of these reserved characters: ${Constants.Symbols.RESERVED.join('')}`);
		}
		if (this.aliases.some(a => Constants.Symbols.RESERVED.some(r => a.includes(r)))) {
			throw new CommandError(id, `aliases (${this.aliases.join(',')}) cannot have any of these reserved characters: ${Constants.Symbols.RESERVED.join('')}`);
		}
		if (Constants.Symbols.RESERVED.some(r => this.category.includes(r))) {
			throw new CommandError(id, `category (${category}) cannot have any of these reserved characters: ${Constants.Symbols.RESERVED.join('')}`);
		}
		this.id = id;
		this.parameters  = new Parameters(descriptor.parameters, this);
		this.properties  = new Properties(descriptor.properties, this);
		this.permissions = new Permissions(descriptor.permissions || Constants.Permissions.DEFAULT_TYPE, this);
		this.subcommands = new Subcommands(descriptor.subcommands, this);
		this.fn = descriptor.fn;
	}
	/**
		@return full command string identifier
	*/
	get fullID() {
		return (typeof(this.supercommand) !== 'undefined' ? (this.supercommand.fullID + Constants.Symbols.DELIMITER + this.id) : this.id).toLowerCase();
	}
	/**
		@return the string that represents this command's usage
	*/
	get usage() {
		return this.toString(Constants.Symbols.PREFIX);
	}
	/**
		@return a boolean that indicates if this command is a subcommand
	*/
	get isSubcommand() {
		return typeof(this.supercommand) !== 'undefined' && this.supercommand instanceof Command;
	}
	/**
		@return a boolean that indicates if there are subcommands
	*/
	get hasSubcommands() {
		return this.subcommands.list.length > 0;
	}
	/**
		Quickly list the command info and its subcommands and their usages
		Great for explaining everything about a command group
	*/
	listSubcommands() {
		let text = `${this.toString()}\n${this.info}\n`;
		for (let sub of this.subcommands.list) {
			sub = this.subcommands[sub];
			if (sub.suppress) continue;
			text += sub.listSubcommands();
		}
		return text;
	}
	/**
		Does the same as above but also lists suppressed commands
	*/
	listAllSubcommands() {
		let text = `${this.toString()}\n${this.info}\n`;
		for (let sub of this.subcommands.list) {
			text += this.subcommands[sub].listAllSubcommands();
		}
		return text;
	}
	/**
		@arg {String} x - property name
		@return a property stored in Command.properties
	*/
	prop(x) {
		return this.properties.get(x);
	}
	/**
		Has Alias
		@return true whether the given string is the name of the command or one of its aliases, false otherwise
	*/
	hasAlias(a) {
		return strcmp(this.id,a) || this.aliases.some(x => strcmp(x,a));
	}
	/**
		Add Alias (if it is in dot notation, use the last part, then pass the rest to the supercommand)
	*/
	addAlias(a) {
		var parts = a.split(Constants.Symbols.DELIMITER);
		var last = parts.pop();
		if (!this.hasAlias(last)) {
			this.aliases.push(last);
		}
		if (parts.length > 0 && this.supercommand) {
			this.supercommand.addAlias(parts.join(Constants.Symbols.DELIMITER));
		}
		return last;
	}
	/**
		Validating the arguments with the command's permissions, then return the result
	*/
	validate(handler) {
		let grant = this.permissions.check(handler);
		if (grant.granted) {
			grant = this.parameters.check(handler.args);
		}
		handler.grant = grant.value;
		return handler;
	}
	/**
		Run the command's handler with the input
	*/
	run(handler) {
		// command functions can either generate responses internally or return one
		var resolving, value;
		try {
			if (this.fn instanceof Function) {
				value = this.fn.call(this, handler);
			} else if (this.info) {
				value = this.info + (this.hasSubcommands ? `\nUse ${md.code(this.fullID + '.?')} to list subcommands.` : '');
			}
			resolving = handler.resolve(value);
		} catch (e) {
			resolving = handler.reject(e);
		} finally {
			return resolving.then(() => {handler.title = this.title});
		}
	}
	/**
		Returns the representative string of the command
	*/
	toString(prefix = '') {
		return md.code(prefix + this.fullID + ' ' + this.parameters.toString());
	}
	/**
		Returns an embeddable object containing information about this command
	*/
	embed(client, server) {
		return {
			title: this.category + ': ' + this.fullID,
			description: this.info,
			fields: [
				{
					name: 'Usage',
					value: this.usage,
					inline: true
				},
				{
					name: 'Aliases',
					value: this.aliases.map(a => a.toLowerCase()).join(', ') || 'None',
					inline: true
				},
				{
					name: 'Permissions',
					value: this.permissions.toString(client, server),
					inline: true
				},
				{
					name: 'Properties',
					value: this.properties.toString(),
					inline: true
				},
				{
					name: 'Subcommands',
					value: this.subcommands.toString() || 'None',
					inline: true
				}
			]
		};
	}
	/**
		Resolves to the command object(s) that matches any aliases
		Can be a string for a quick check, or an array of command levels
		Special Selectors:
		* is a wildcard selector. It always matches.
		& is a category selector. It matches commands of that category.
		
		@return jagged Array of matched commands
	*/
	resolveAlias(cmd, level = 0) {
		if (typeof(cmd) === 'string') {
			cmd = cmd.split('.');
		}
		if (!(cmd instanceof Array)) {
			throw new CommandError(this.id, `${arguments.callee.name} requires a String or Array.`);
		}
		
		let selector = cmd[level];
		if (strcmp(selector,Constants.Symbols.WILDCARD) || strcmp(selector,Constants.Symbols.CATEGORY+this.category)) {
			return [this, ...this.subcommands.items.map(s => s.resolveAlias(cmd,level))];
		} else if (this.hasAlias(selector)) {
			if (level < cmd.length-1) {
				return this.subcommands.items.map(sub => sub.resolveAlias(cmd,level+1));
			} else {
				return [this];
			}
		} else {
			return [];
		}
	}
}

module.exports = Command;
