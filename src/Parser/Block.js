const Constants = require('../Constants/Symbols');
const {escape, quote} = require('../Utils');

/**
 * Block class constructor
 * Abstract representation of a command-line "block", which includes a command and its arguments.
 * The name "Block" suggests that Blocks themselves can be arguments of other Blocks.
 * @param {Array<Any>}     tokens  - produced by Parser.tokenize()
 * @prop {String}          text    - the raw input text
 * @prop {String}          cmd     - the command name, if treated as a command
 * @prop {Array<String>}   [cmds]  - the command path, if treated as a command
 * @prop {Array<String>}   [ctx]   - the context of the command
 * @prop {String}          [arg]   - the argument string of the command
 * @prop {Array<Any>}      [args]  - the arguments of the command, cast to their appropriate types
 * @prop {Map<String,Any>} [flags] - the flags provided for the command
 */
class Block {
	constructor(tokens, parseAsCommand = true) {
		this.text     = '';
		this.cmd      = '';
		//this.comments = [];
		if (tokens.length > 0) {
			let i, j, t, s, b, stop = false;
			
			if (parseAsCommand) {
				this.cmd = tokens[0];
				this.cmds = this.cmd.split(Constants.DELIMITER);
				this.ctx = [];
				this.arg = '';
				this.args = [];
				this.flags = new Map();
				
				read:
				for (i = 1; i < tokens.length; ++i) {
					t = tokens[j=i];
					
					if (t == Constants.STOP) {
						stop = true;
						break read;
						
					} else if (/^(\/\/.*|\/\*.*\*\/)$/.test(t)) {
						//this.comments.push(t);
						continue read;
						
					} else if (!stop && t == Constants.BLOCK_START) {
						s = 1;
						do {
							i++;
							switch (tokens[i]) {
								case Constants.BLOCK_START:
									s++;
									break;
								case Constants.BLOCK_END:
									s--;
									if (s > 0) break;
								case Constants.STOP:
									if (s > 1) break;
									b = tokens.slice(j+1,i);
									if (b.length) {
										b = new Block(b);
										b.superblock = this;
										this.args.push(b);
									}
									j = i;
									break;
							}
						} while (tokens[i] && s > 0);
						if (s > 0) throw new SyntaxError(`Missing "${Constants.BLOCK_END}" for token ${j}: ${tokens.join(' ')}`);
						continue read;
						
					} else if (!stop) {
						if (String(t).startsWith(Constants.FLAG) && t != Constants.FLAG && !Number(t)) {
							let keyIdx = t.indexOf(Constants.KEY);
							if (keyIdx < 0) keyIdx = t.length;
							let flag  = t.substring(Constants.FLAG.length, keyIdx);
							let value = t.substring(keyIdx+1);
							this.flags.set(flag, value);
						} else {
							this.args.push(t);
						}
						continue read;
					}
				}
				
				this.arg  = this.args.map(String).join(' ');
				this.text = this.cmd;
				if (this.args.length > 0) {
					this.text += ' ' + this.args.map(a => {
						if  (typeof(a) === 'string') return a.includes(' ') ? quote(a) : a;
						else if (a instanceof Block) return '{' + a.toString() + '}';
						else if (a instanceof Object) return '%' + JSON.stringify(a);
						else return a;
					}).join(' ');
				}
				if (this.flags.size > 0) {
					let tmp = '';
					for (let pair of this.flags.entries()) {
						tmp += ' ' + Constants.FLAG + pair[0];
						if (pair[1]) {
							tmp += Constants.KEY + pair[1];
						}
					}
					this.arg  += tmp;
					this.text += tmp;
				}
			} else {
				this.text = tokens.join(' ');
			}
		}
	}
	/**
	 * Contexts allow subcommands to be called without explicitly using the parent command.
	 */
	get contexts() {
		if (this.superblock) {
			return this.ctx.concat(superblock.ctx);
		} else {
			return this.ctx;
		}
	}
	/**
	 * Cast the block to a representative string.
	 */
	toString() {
		return this.text;
	}
}

module.exports = Block;
