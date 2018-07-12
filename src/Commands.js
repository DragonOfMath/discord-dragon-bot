const FileCollector = require('./FileCollector');
const TypeMapBase   = require('./TypeMapBase');
const Command       = require('./Command');
const Logger        = require('./Logger');
const Constants     = require('./Constants');
const {Markdown:md,strcmp,truncate} = require('./Utils');

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
			logger
		});
	}
	
	/**
		Load command files from a directory, then load command descriptors from each file.
	*/
	load(dir = __dirname, recursive = true, filter = Constants.Commands.FILE_REGEX) {
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
		return this.categories.find(c => strcmp(c,cat)) || '';
	}
	
	/**
		Gets command objects.
		Each argument can be a separate command to match.
		@return Array of Commands that matched the input.
	*/
	get(...cmds) {
		if (!cmds.length) {
			cmds.push(Constants.Symbols.WILDCARD);
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
		Resolve Handler input
		Matches input to a command
		If 1 command found:
			Checks permissions and parameters
			Runs the command
		Else:
			Produces a listing of matched commands
		@return a resolved Promise for the handler
	*/
	resolve(handler) {
		// find the command object, if possible
		var commands = this.get(handler.cmds);
		
		if (commands.length == 0) {
			this.logger.warn('Not a command: ' + handler.cmd);
			return handler.resolve();
			
		} else if (commands.length == 1) {
			this.logger.info(handler.text);
			var command = commands[0];
			handler.command = command;
			handler.cmd = command.fullID;
			command.validate(handler);
			if (handler.grant == 'granted') {
				return command.run(handler);
			} else {
				return handler.resolve(':no_entry_sign: **Denied**: ' + handler.grant);
			}
			
		} else {
			this.logger.info(handler.text,'->',commands.length,'matches');
			if (handler.userID != handler.client.ownerID) {
				commands = commands.filter(cmd => !cmd.suppress);
			}
			var msg = commands.map(cmd => cmd.fullID).sort().join(', ');
			//msg = truncate(msg, 1980);
			msg = 'Matches:\n' + md.codeblock(msg);
			return handler.resolve(msg);
		}
	}
	embed(client, showSuppressedCommands) {
		var cmds = this.keys.sort();
		if (!showSuppressedCommands) {
			cmds = cmds.filter(cmd => !this[cmd].suppress);
		}
		return {
			title: 'Commands',
			description: `\`${cmds.join(' ')}\``,
			fields: [
				{
					name: 'Using Commands',
					value: `To invoke a command, add \`${Constants.Symbols.PREFIX}\` at the start of your message. In case other bots on the server use the same prefix, you can @mention me ${md.mention(client.id)} before your command (prior to 1.6.0, the prefix was not required, now it is). As of 1.6.0, you can close a command statement with \`${Constants.Symbols.STOP}\` which stops from parsing the rest of the text as arguments. If you are using specially reserved characters, you should escape them with \`\\\` before each character or quote them.`
				},
				{
					name: 'Subcommands',
					value: 'Some commands have further divisions in their functionality called **subcommands**. You can use these subcommands with dot notation -- `command.sub`, `command.sub.subsub` and so on. You can use the built-in subcommand `?` to list them. (Ex: `bank.?`)'
				},
				{
					name: 'Metacommands',
					value: `Introduced in 1.6.0, metacommands allows even more control of commands. They follow a similar syntax to commands, but with one big difference: argument blocks. Argument blocks are denoted by \`${Constants.Symbols.BLOCK_START}\` and \`${Constants.Symbols.BLOCK_END}\`, which treats the text inside as a lambda. Most commands do not accept these, however metacommands will likely use them. For instance, you can run a bunch of commands in a single message using the \`batch\` command!`
				},
				{
					name: 'Categories',
					value: `Commands are divided these groups: ${this.categories.join(', ')}. You can see what commands are in a group by using \`${Constants.Symbols.CATEGORY}\` followed by the category's name.`
				}
			]
		};
	}
}

module.exports = Commands;
