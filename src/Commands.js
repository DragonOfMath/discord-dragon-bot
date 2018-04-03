const FileCollector = require('./FileCollector');
const TypeMapBase   = require('./TypeMapBase');
const Command       = require('./Command');
const Logger        = require('./Logger');
const {Markdown:md,strcmp} = require('./Utils');

const WILDCARD   = '*';
const SUBCOMMAND = '.';
const CATEGORY   = '&';
const VARIABLE   = '$';
const KEY        = ':';
const FILE_REGEX = /^cmd_.+\.js$/;

/*
	Recursively flatten arrays within arrays
*/
Array.prototype.flatten = function () {
	return [].concat(...this.map(x => x instanceof Array ? x.flatten() : [x]));
};
/*
	Remove duplicate elements from an array
*/
Array.prototype.unique = function () {
	return this.reduce((a,x) => {
		if (!a.includes(x)) a.push(x);
		return a;
	}, []);
};

/**
	Commands class export
	The module's primary functionality, responsible for registering, validating, and resolving commands
*/
class Commands extends TypeMapBase {
	constructor(client) {
		super(Command);
		const logger = new Logger('Commands');
		this.setProperties({
			client,
			logger,
			PREFIX: client.PREFIX,
			SUBCOMMAND,
			WILDCARD,
			CATEGORY,
			FILE_REGEX,
			KEY
		});
	}
	
	/**
		Load command files from a directory, then load command descriptors from each file.
	*/
	load(dir = __dirname, recursive = true, filter = FILE_REGEX) {
		var commands = this;
		var fc = new FileCollector();
		
		this.logger.info('Loading files...');
		this.logger.indent();
		fc.load(dir,recursive,filter);
		fc.forEach((filename, file) => {
			commands.logger.info(filename);
			commands.logger.indent();
			file.forEach((cmd, descriptor) => {
				commands.logger.info(cmd);
				commands.set(cmd, cmd, descriptor);
			});
			commands.logger.unindent();
		});
		this.logger.unindent();
		//this.logger.info('Loading complete.');
	}
	
	get categories() {
		return this.items.reduce((cat,cmd) => {
			if (cat.indexOf(cmd.category) < 0) {
				cat.push(cmd.category);
			}
			return cat;
		}, []);
	}
	hasCategory(cat) {
		return this.categories.some(c => strcmp(c,cat));
	}
	getCategoryCommands(cat) {
		return this.items.reduce((cmds,cmd) => {
			if (strcmp(cmd.category,cat)) {
				cmds.push(cmd);
			}
			return cmds;
		}, []);
	}
	resolveCategory(cat) {
		for (let c of this.categories) {
			if (strcmp(c,cat)) {
				return c;
			}
		}
		return '';
	}
	
	/**
		Gets command objects.
		Each argument can be a separate command to match.
		@return Array of Commands that matched the input.
	*/
	get(...cmds) {
		if (!cmds.length) {
			cmds.push(WILDCARD);
		}
		var matches = [];
		for (let cmd of cmds) {
			for (let c in this) {
				var match = this[c].resolveAlias(cmd);
				if (match != null) {
					matches.push(match);
				}
			}
		}
		return matches.flatten().unique();
	}
	/**
		Has a command
		@arg {String|Array<String>} cmd
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
		Resolve Input
		Matches input to a command
		If 1 command found:
			Checks permissions and parameters
			Runs the command
		Else:
			Produces a listing of matched commands
		@return the input object
	*/
	resolve(input) {
		try {
			// find the command object, if possible
			var commands = this.get(input.cmds);
			if (commands.length > 1) {
				if (input.userID != input.client.ownerID) {
					commands = commands.filter(cmd => !cmd.suppress);
				}
				input.response = 'Matches: ' + commands.map(cmd => cmd.fullID).sort().join(', ');
				if (input.response.length > 2000) {
					input.response = input.response.substring(0, 1997) + '...';
				}
			} else if (commands.length == 1) {
				let command = commands[0];
				input.cmd = command.fullID;
				command.resolve(input);
				
				if (input.grant == 'granted') {
					this.logger.info('Command:', input.cmd);
					command.run(input);
				} else {
					input.response = input.grant;
				}
			} else {
				//throw 'Invalid command/category.';
			}
		} catch (e) {
			input.error    = e;
			input.response = ':warning: **Error**: ' + (e.message||e);
			input.grant = '';
		} finally {
			return input;
		}
	}
	toHelpEmbed(client, showSuppressedCommands) {
		var cmds = this.keys;
		if (!showSuppressedCommands) {
			cmds = cmds.filter(cmd => !this[cmd].suppress);
		}
		return {
			title: 'Commands',
			description: `\`${cmds.join(', ')}\``,
			fields: [
				{
					name: 'Using Commands',
					value: `To invoke a command, add \`${client.PREFIX}\` at the start of your message. In case other bots on the server use the same prefix, you can @mention me ${md.mention(client.id)} in place of the prefix.`
				},
				{
					name: 'Subcommands',
					value: 'Some commands have further divisions in their functionality called **subcommands**. You can use these subcommands with dot notation -- `command.sub`, `command.sub.subsub` and so on. You can use the built-in subcommand `command.?` to list them.'
				},
				{
					name: 'Categories',
					value: `Commands are divided these groups: ${this.categories.join(', ')}. You can see what commands are in the group by using \`&\` character followed by the category's name.`
				}
			]
		};
	}
}

module.exports = Commands;
