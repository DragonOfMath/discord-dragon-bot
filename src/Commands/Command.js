const Parameters   = require('./Parameters');
const Flags        = require('./Flags');
const CommandError = require('./CommandError');
const Constants    = require('../Constants');
const Permissions  = require('../Permissions/ConfigurablePermissions');
const Grant        = require('../Permissions/Grant');
const TypeMapBase  = require('../Structures/TypeMapBase');
const Resource     = require('../Structures/Resource');

const {Markdown:md,Format:fmt,strcmp} = require('../Utils');

/**
 * Command class constructor
 * Defines a command's main handle, aliases, description, permissions, and subcommands
 * @class Command
 * @extends Resource
 * @prop {String}        id            - the main alias/handle/name of the command.
 * @prop {Array<String>} [aliases]     - alternative names for the command
 * @prop {String}        [category]    - category for the command, else a default one is used
 * @prop {String}        [title]       - the display title of the command when used
 * @prop {String}        [info]        - retrievable information about the command
 * @prop {Parameters}    [parameters]  - formatted parameter list for the command          (see Parameters.js)
 * @prop {Flags}         [flags]       - the flag parameters of the command                (see Flags.js)
 * @prop {Permissions}   [permissions] - default permissions of the command                (see Permissions.js)
 * @prop {Object}        [subcommands] - subcommands which are recursively processed
 * @prop {Function}      [fn]          - the command function handler, which takes one argument, the input object
 * @prop {Function}      [init]        - optional initialization called after all commands are processed (only allowed on top-level commands)
 *
 * @prop {Boolean}       [suppress=false]  - prevent listing this command and its subcommands
 * @prop {Boolean}       [analytics=true]  - record usage of this command
 * @prop {Boolean}       [enabled=true]    - enable/disable this command, for experimental reasons
 * @prop {Boolean}       [nsfw=false]      - whether the command is considered NSFW, so it can only be used in the appropriate channels
 * @prop {Number}        [cooldown=0]      - the time needed to wait between using this command
 *
 * @prop {Boolean}       [generated=false] - only used for auto-generated commands
 * @prop {Command}       [supercommand]    - the parent command object, automatically linked for subcommands
 */
class Command extends Resource {
	constructor(id, descriptor = {}, supercommand = null) {
		super(Constants.Commands.TEMPLATE, descriptor);
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
		this.flags       = new Flags(descriptor.flags, this);
		this.permissions = new Permissions(descriptor.permissions || Constants.Permissions.DEFAULT, this);
		this.fn = typeof(descriptor.fn) === 'string' ? eval(descriptor.fn) : descriptor.fn;
		this.init = descriptor.init ? descriptor.init.bind(this) : null;
		this.userCooldowns = {};
		
		this.supercommand = supercommand;
		if (supercommand) {
			if (this.init) {
				throw new CommandError(id, `init must be from a top-level command only.`);
			}
			this.category = (typeof(descriptor.category) != 'undefined' && descriptor.category !== 'Misc') ? this.category : supercommand.category;
			this.suppress = (typeof(descriptor.suppress) != 'undefined') ? descriptor.suppress : supercommand.suppress;
			this.nsfw     = (typeof(descriptor.nsfw)     != 'undefined') ? descriptor.nsfw     : supercommand.nsfw;
		}
		
		for (let sub in this.subcommands) {
			if (this.hasSubcommand(sub)) {
				throw `${sub} already exists as a subcommand of ${this.fullID}`;
			}
			this.subcommands[sub] = new Command(sub, this.subcommands[sub], this);
		}
		
		let helpID = Constants.Symbols.HELP;
		if (this.subcommandList.length > 0 && !this.hasSubcommand(helpID)) {
			this.subcommands[helpID] = new Command(helpID, {
				aliases: ['help','subcommands'],
				title: `Subcommands`,
				info: '(Automatically generated subcommand for listing other subcommands)',
				permissions: 'public',
				suppress: true,
				analytics: false,
				generated: true,
				fn({client,userID}) {
					if (userID == client.ownerID) {
						return this.supercommand.listAllSubcommands();
					} else {
						return this.supercommand.listSubcommands();
					}
				}
			}, this);
		}
	}
	/**
	 * Returns the representative string of the command
	 * @param {String} [prefix] - the prefix to prepend, if provided
	 * @return String usage of the command, finalized
	 */
	toString(prefix = '') {
		let tmp = prefix + this.fullID;
		if (this.parameters.length) {
			tmp += ' ' + this.parameters.toString();
		}
		if (this.flags.length) {
			tmp += ' ' + this.flags.toString();
		}
		return tmp;
	}
	toMarkdownString(prefix = '') {
		let tmp = this.toString(prefix);
		tmp = md.code(tmp);
		if (this.disabled) {
			tmp = md.strikethrough(tmp);
		}
		return tmp;
	}
	
	/**
	 * @return full command string identifier
	 */
	get fullID() {
		return (this.supercommand ? (this.supercommand.fullID + Constants.Symbols.DELIMITER + this.id) : this.id).toLowerCase();
	}
	/**
	 * @return the string that represents this command's usage
	 */
	get usage() {
		return this.toString(Constants.Symbols.PREFIX);
	}
	/**
	 * Getter/Setter alternative to this.enabled
	 */
	get disabled() {
		return !this.enabled;
	}
	set disabled(x) {
		this.enabled = !x;
	}
	/**
	 * @return the combined titles of the command ancestry delimited by a pipe to indicate subtitles
	 */
	get fullTitle() {
		return this.supercommand ? (this.supercommand.fullTitle + ' | ' + this.title) : this.title;
	}
	/**
	 * @return a boolean that indicates if this command is a subcommand
	 */
	get isSubcommand() {
		return typeof(this.supercommand) !== 'undefined' && this.supercommand instanceof Command;
	}
	/**
	 * @return Array of subcommand IDs
	 */
	get subcommandList() {
		return Object.keys(this.subcommands);
	}
	/**
	 * @return a boolean that indicates if there are subcommands
	 */
	get hasSubcommands() {
		return this.subcommandList.length > 0;
	}
	/**
	 * @param {String} id - subcommand ID
	 * @return {Boolean}
	 */
	hasSubcommand(id) {
		return (id in this.subcommands) && (this.subcommands[id] instanceof Command);
	}
	/**
	 * Quickly list the command info and its subcommands and their usages
	 * Great for explaining everything about a command group
	 */
	listSubcommands() {
		let text = `${this.toMarkdownString()}\n${this.info}\n`;
		for (let sub in this.subcommands) {
			sub = this.subcommands[sub];
			if (sub.suppress || sub.generated) continue;
			text += sub.listSubcommands();
		}
		return text;
	}
	/**
	 * Does the same as above but ignores command suppression
	 */
	listAllSubcommands() {
		let text = `${this.toMarkdownString()}\n${this.info}\n`;
		for (let sub in this.subcommands) {
			text += this.subcommands[sub].listAllSubcommands();
		}
		return text;
	}
	/**
	 * Checks if the command has a matching label/alias
	 * @param {String} a - the command label or alias
	 * @return Boolean
	 */
	hasAlias(a) {
		return strcmp(this.id,a) || this.aliases.some(x => strcmp(x,a));
	}
	/**
	 * Add Alias (if it is in dot notation, use the last part, then pass the rest to the supercommand)
	 * @param {String} a - the command alias to add
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
	 * Validates the current command permissions and parameters.
	 * The result is stored in `handler.grant`.
	 * @param {Handler} handler
	 * @return handler
	 */
	validate(handler) {
		let grant;
		if (this.disabled) {
			grant = Grant.denied('This feature is disabled. 🔒');
		} else if (this.nsfw && !handler.isDM && !handler.context.channel.nsfw) {
			grant = Grant.denied('Command may not be used outside a NSFW channel. 🔞');
		} else {
			grant = this.permissions.check(handler);
			if (grant.granted) {
				grant = this.checkCooldown(handler.userID);
				if (grant.granted) {
					grant = this.parameters.check(handler.args);
				}
			}
		}
		handler.grant = grant.value;
		return handler;
	}
	/**
	 * Run the command's handler with the input
	 * @param {Handler} handler
	 * @return Promise that resolves to the handler
	 */
	async run(handler) {
		// command functions can either generate responses internally or return one
		try {
			var value;
			if (this.fn instanceof Function) {
				value = this._run(handler);
			} else if (this.info) {
				value = this.info + (this.hasSubcommands ? `\nUse ${md.code(this.fullID + '.?')} to list subcommands.` : '');
			}
			await handler.resolve(value);
		} catch (e) {
			await handler.reject(e);
		} finally {
			// after resolving, set the handler's response title to this command's title
			handler.title = this.title;
			return handler;
		}
	}
	_run(data) {
		return this.fn.call(this, data);
	}
	/**
	 * Returns a Discord-embeddable object containing information about this command
	 * @param {Client} client
	 * @param {Server} server
	 * @return embed object
	 */
	embed(client, server) {
		let settings = [];
		if (this.cooldown) {
			settings.push('🕓 Cooldown (' + fmt.time(this.cooldown) + ')');
		}
		if (this.suppress) {
			settings.push('🕵️‍ Hidden');
		}
		if (this.enabled) {
			settings.push('🔓 Enabled');
		} else {
			settings.push('🔒 Disabled');
		}
		if (this.analytics) {
			settings.push('📊 Usage Tracked');
		}
		if (this.nsfw) {
			settings.push('🔞 NSFW');
		}
		if (this.generated) {
			settings.push('🖥 Generated');
		}
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
					name: 'Settings',
					value: settings.join('\n'),
					inline: true
				},
				{
					name: 'Subcommands',
					value: this.subcommandList.join(', ') || 'None',
					inline: true
				}
			],
			footer: {
				text: 'Command Parameter Guide: [] = optional, ... = 1 or more, <|> = set of acceptable values, {} = command lambda'
			}
		};
	}
	/**
	 * Resolves to the command object(s) that matches any aliases
	 * Can be a string for a quick check, or an array of command levels
	 * Special Selectors:
	 * * is a wildcard selector. It always matches.
	 * & is a category selector. It matches commands of that category.
	 * @param {String|Array<String>} cmd - the command(s) to search for
	 * @param {Number} [level] - the subcommand depth for recursive search
	 * @return Array of matched commands in recursive fashion
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
			return [this, ...this.subcommandList.map(sub => this.subcommands[sub].resolveAlias(cmd,level))];
		} else if (this.hasAlias(selector)) {
			if (level < cmd.length-1) {
				return this.subcommandList.map(sub => this.subcommands[sub].resolveAlias(cmd,level+1));
			} else {
				return [this];
			}
		} else {
			return [];
		}
	}
	/**
	 * Check the last usage by a user with the cooldown. Update their last usage when ready.
	 * @return a Grant that explains if the cooldown has not been waited out.
	 */
	checkCooldown(userID) {
		if (this.cooldown > 0) {
			this.userCooldowns[userID] = this.userCooldowns[userID] || 0;
			let now = Date.now(),
			    elapsed = now - this.userCooldowns[userID],
				remaining = this.cooldown - elapsed;
			if (remaining > 0) {
				return Grant.denied('Please wait 🕓' + md.bold(fmt.time(remaining)) + ' before using ' + md.code(this.id) + ' again!');
			}
			this.userCooldowns[userID] = now;
		}
		return Grant.granted();
	}
	resetCooldown(userID) {
		delete this.userCooldowns[userID];
	}
	
	/* Documentation generator functions */
	toText(recursive = false) {
		let docs = this.toString();
		if (this.disabled) {
			docs += ' 🔒';
		} else if (this.nsfw) {
			docs += ' 🔞';
		}
		
		let p = this.permissions.inherited;
		if (p.isPrivate) {
			docs += ' (Private)';
		} else if (p.isPrivileged) {
			docs += ' (Privileged)';
		}
		docs += '\n';
		
		if (this.aliases.length) {
			docs += 'Aliases: ' + this.aliases.join(', ') + '\n';
		}
		if (this.cooldown) {
			docs += 'Cooldown: ' + fmt.time(this.cooldown) + '\n';
		}
		
		docs += this.info;
		
		if (recursive) {
			docs += '\n\n' + this.subcommandList.map(subcmd => this.subcommands[subcmd].toText(recursive)).join('\n');
		}
		
		return docs;
	}
	toMarkdown(recursive = false) {
		let docs = '### ' + this.toMarkdownString();
		
		let p = this.permissions.inherited;
		if (p.isPrivate) {
			docs += ' ' + md.italics('Private');
		} else if (p.isPrivileged) {
			docs += ' ' + md.italics('Privileged');
		}
		docs += '\n\n';
		
		if (this.aliases.length) {
			docs += 'Aliases: ' + this.aliases.map(md.code).join(', ') + '\n\n';
		}
		if (this.cooldown) {
			docs += 'Cooldown: ' + fmt.time(this.cooldown) + '\n\n';
		}
		
		docs += this.info + '\n';
		
		if (recursive) {
			docs += '\n' + this.subcommandList.map(subcmd => this.subcommands[subcmd].toMarkdown(recursive)).join('\n');
		}
		
		return docs;
	}
	toHTML(recursive = false) {
		let docs = `<div class="command" id="${this.fullID}">\n<div><h3 class="command-id"><code>${this.toString()}</code></h3>`;
		if (this.disabled) {
			docs += `<i>Disabled</i>`;
		} else if (this.nsfw) {
			docs += `<i>NSFW</i>`;
		}
		let p = this.permissions.inherited;
		if (p.isPrivate) {
			docs += `<i>Private</i>`;
		} else if (p.isPrivileged) {
			docs += `<i>Privileged</i>`;
		}
		docs +=`</div>\n`;
		
		if (this.aliases.length) {
			docs += `<div>Aliases: <span class="aliases">${this.aliases.map(a => '<code>'+a+'</code>').join(', ')}</span></div>\n`;
		}
		if (this.cooldown) {
			docs += `<div>Cooldown: <span class="cooldown">${fmt.time(this.cooldown)}</span></div>\n`;
		}
		
		docs += `<p>${this.info}</p>\n</div>`;
		
		if (recursive) {
			docs += '\n' + this.subcommandList.map(subcmd => this.subcommands[subcmd].toHTML(recursive)).join('\n');
		}
		
		return docs;
	}
	toXML(recursive = false) {
		let docs = 
`<Command>
	<ID>${this.fullID}</ID>
	<Usage>${this.toString()}</Usage>
	<PermissionLevel>${this.permissions.type}</PermissionLevel>
	<Description>${this.info}</Description>
</Command>`;

		if (recursive) {
			docs += '\n' + this.subcommandList.map(subcmd => this.subcommands[subcmd].toXML(recursive)).join('\n');
		}
		
		return docs;
	}
	export(recursive = false) {
		let _export = {};
		if (this.aliases.length) {
			_export.aliases = this.aliases;
		}
		if (this.category) {
			_export.category = this.category;
		}
		if (this.title) {
			_export.title = this.title;
		}
		if (this.info) {
			_export.info = this.info;
		}
		if (this.parameters.length) {
			_export.parameters = this.parameters.toArray();
		}
		if (this.flags.length) {
			_export.flags = this.flags.toArray();
		}
		_export.permissions = this.permissions.type;
		if (!this.enabled) {
			_export.enabled = this.enabled;
		}
		if (!this.analytics) {
			_export.analytics = this.analytics;
		}
		if (this.suppress) {
			_export.suppress = this.suppress;
		}
		if (this.nsfw) {
			_export.nsfw = this.nsfw;
		}
		if (this.cooldown) {
			_export.cooldown = this.cooldown;
		}
		if (this.generated) {
			_export.generated = this.generated;
		} else if (this.fn) {
			_export.fn = this.fn.toString();
		}
		if (recursive && this.subcommandList.length) {
			_export.subcommands = {};
			for (let subcmd of this.subcommandList) {
				_export.subcommands[subcmd] = this.subcommands[subcmd].export(recursive);
			}
		}
		return _export;
	}
}

module.exports = Command;
