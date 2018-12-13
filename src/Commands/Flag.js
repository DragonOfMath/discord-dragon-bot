const Constants = require('../Constants/Symbols');

/**
 * Flag class constructor
 * All flags are optional by default.
 * Flag names can have multiple aliases, but are always distinguished in syntax.
 * Flags are separate from the arguments as they can be defined anywhere in the text.
 * Flags do not have validation, they are simply for syntax help.
 * @class Flag
 * @prop {String} name
 * @prop {Array<String>} aliases
*/
class Flag {
	constructor(flag) {
		if (typeof(flag) !== 'string' || !flag) {
			throw new TypeError(`${this.constructor.name}.flag must be a non-empty string.`);
		}
		this.name = flag;
		this.aliases = flag.split('|');
	}
	toString() {
		return this.aliases.map(a => Constants.FLAG + a).join('/');
	}
}

module.exports = Flag;
