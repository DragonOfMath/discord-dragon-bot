const Parameters   = require('./Parameters');
const CPermissions = require('./ConfigurablePermissions');
const Properties   = require('./Properties');
const TypeMapBase  = require('./TypeMapBase');
const Constants    = require('./Constants');
const {Markdown:md,random,strcmp} = require('./Utils');

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
				permissions: { type: 'public' },
				suppress: true,
				fn: supercommand.listSubcommands.bind(supercommand)
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
		
		//sub.permissions.inherit(this.supercommand.permissions);
		sub.properties.inherit(this.supercommand.properties);
		sub.category = sub.category || this.supercommand.category;
		sub.suppress = sub.suppress || this.supercommand.suppress;
		//console.log('Suppressed:',sub.id,sub.suppress);
		return this.set(sub.id, sub);
	}
}

/**
	Command class
	Defines a command's main handle, aliases, description, permissions, and subcommands
*/
class Command {
	/**
		Command constructor
		@class
		@arg {String}        cmd                      - the main alias/handle/name of the command.
		@arg {Object}        [descriptor]             - command description object, multiple fields below
		@arg {Array<String>} [descriptor.aliases]     - alternative names for the command
		@arg {String}        [descriptor.category]    - category for the command, else a default one is used
		@arg {String}        [descriptor.info]        - retrievable information about the command
		@arg {Array<String>} [descriptor.parameters]  - strictly-formatted parameter list for the command (see Parameters.js)
		@arg {Object}        [descriptor.permissions] - default permission settings of the command        (see Permissions.js)
		@arg {Object}        [descriptor.properties]  - optional properties for the command               (see Properties.js)
		@arg {Boolean}       [descriptor.suppress]    - prevent listing this command and its subcommands
		@arg {Object}        [descriptor.subcommands] - subcommands which are recursively processed
		@arg {Function}      descriptor.fn            - the command function handler, which takes one argument, the input object
	*/
	constructor(cmd, {
		aliases  = [],
		category = Constants.Command.DEFAULT_CATEGORY,
		title    = Constants.Command.DEFAULT_TITLE,
		info     = Constants.Command.DEFAULT_INFO,
		parameters  = [],
		permissions = {},
		properties  = {},
		suppress    = Constants.Command.DEFAULT_SUPPRESSION,
		subcommands = {},
		fn
	}) {
		if (typeof(cmd) !== 'string' || !cmd) {
			throw new TypeError(`${this.constructor.name}.id must be a string identifier.`);
		}
		if (Constants.Symbols.RESERVED.some(r => cmd.indexOf(r) > -1)) {
			throw new TypeError(`${this.constructor.name}.${cmd}.id cannot have any of these reserved characters: ${Constants.Symbols.RESERVED.join('')}`);
		}
		if (!(aliases instanceof Array)) {
			throw new TypeError(`${this.constructor.name}.${cmd}.aliases must be an Array.`);
		}
		if (aliases.some(a => Constants.Symbols.RESERVED.some(r => a.indexOf(r) > -1))) {
			throw new TypeError(`${this.constructor.name}.${cmd}.aliases = ${aliases.join(',')} cannot have any of these reserved characters: ${Constants.Symbols.RESERVED.join('')}`);
		}
		if (typeof(category) !== 'string') {
			throw new TypeError(`${this.constructor.name}.${cmd}.category must be a string identifier.`);
		}
		if (Constants.Symbols.RESERVED.some(r => category.indexOf(r) > -1)) {
			throw new TypeError(`${this.constructor.name}.${cmd}.category cannot have any of these reserved characters: ${Constants.Symbols.RESERVED.join('')}`);
		}
		if (typeof(title) !== 'string') {
			throw new TypeError(`${this.constructor.name}.${cmd}.title must be a string.`);
		}
		if (typeof(info) !== 'string') {
			throw new TypeError(`${this.constructor.name}.${cmd}.info must be a string.`);
		}
		if (typeof(parameters) !== 'object') {
			throw new TypeError(`${this.constructor.name}.${cmd}.parameters must be an array or object.`);
		}
		if (typeof(permissions) !== 'object') {
			throw new TypeError(`${this.constructor.name}.${cmd}.permissions must be an object.`);
		}
		if (typeof(properties) !== 'object') {
			throw new TypeError(`${this.constructor.name}.${cmd}.properties must be an object.`);
		}
		if (typeof(subcommands) !== 'object') {
			throw new TypeError(`${this.constructor.name}.${cmd}.subcommands must be an object.`);
		}
		
		this.id       = cmd;
		this.aliases  = aliases;
		this.category = category;
		this.title    = title;
		this.info     = info;
		this.suppress = !!suppress;
		
		this.parameters  = new Parameters(parameters, this);
		this.properties  = new Properties(properties, this);
		this.permissions = new CPermissions(permissions, this);
		this.subcommands = new Subcommands(subcommands, this);
		this.fn = fn;
	}
	/**
		@return full command string identifier
	*/
	get fullID() {
		return (typeof(this.supercommand) !== 'undefined' ? (this.supercommand.fullID + Constants.Symbols.DELIMITER + this.id) : this.id).toLowerCase();
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
		let text = `${this.toUsageString()}\n${this.info}\n`;
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
		let text = `${this.toUsageString()}\n${this.info}\n`;
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
		Resolve permissions and return a Grant
	*/
	checkPermissions(input) {
		return this.permissions.check(input);
	}
	/**
		Resolve parameters and return a grant
	*/
	checkParameters(params) {
		return this.parameters.check(params);
	}
	/**
		Validating the arguments with the command's permissions, then return the result
	*/
	validate(input) {
		let grant = this.checkPermissions(input);
		if (grant.granted) {
			grant = this.checkParameters(input.args);
		}
		input.grant = grant.value;
		return input;
	}
	/**
		Run the command's handler with the input
	*/
	run(input) {
		// command functions can either generate responses internally or return one
		if (this.fn instanceof Function) {
			try {
				input.response = this.fn.call(this,input);
			} catch (e) {
				input.error    = e;
				input.response = ':warning: **Error**: ' + e;
				input.temp     = true; // delete this error message after a few seconds
			} finally {
				if (input.response) {
					if (input.response instanceof Promise) {
						input.response = input.response.then(x => this.insertTitle(x));
					} else {
						if (input.response instanceof Array) {
							input.response = random(input.response);
						}
						input.response = this.insertTitle(input.response);
					}
				}
			}
		} else if (this.title || this.info) {
			input.response = md.bold(this.title) + '\n' + this.info;
			if (this.hasSubcommands) {
				input.response += `\nUse ${md.code(this.fullID + '.?')} to list subcommands.`;
			}
		}
		return input;
	}
	/**
		Insert title where appropriate
	*/
	insertTitle(x) {
		//console.log('Inserting title:',this.title)
		if (typeof(this.title) === 'string' && this.title.length > 0) {
			if (typeof(x) === 'object') {
				if (typeof(x.message) === 'string') {
					x.message = md.bold(this.title) + ' | ' + x.message;
				} else {
					x.title = this.title + (x.title ? ' | ' + x.title : '');
				}
			} else if (typeof(x) === 'string') {
				x = md.bold(this.title) + ' | ' + x;
			}
		}
		return x;
	}
	/**
		Returns the representative string of the command
	*/
	toUsageString() {
		return md.code(this.fullID + ' ' + this.parameters.toString());
	}
	/**
		Returns an embeddable object containing information about this command
	*/
	toHelpEmbed(client, server) {
		return {
			title: this.category + ': ' + this.fullID,
			description: this.info,
			fields: [
				{
					name: 'Usage',
					value: Constants.Symbols.PREFIX + this.toUsageString(),
					inline: true
				},
				{
					name: 'Aliases',
					value: this.aliases.map(a => a.toLowerCase()).join(', ') || 'No other aliases.',
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
					value: this.subcommands.toString() || 'No subcommands for this command.',
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
			throw new TypeError(`${arguments.callee.name} requires a String or Array.`);
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
