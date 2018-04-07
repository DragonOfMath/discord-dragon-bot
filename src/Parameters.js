const TypeMapBase = require('./TypeMapBase');
const Parameter   = require('./Parameter');
const Grant       = require('./Grant');

const MAX_ARGS = 1000;

class Parameters extends TypeMapBase {
	constructor(params = [], command) {
		super(Parameter);
		for (let p = 0; p < params.length; p++) {
			this.set(p, this.create(params[p]));
		}
		this.setProperty('command', command);
	}
	toString() {
		return this.items.map(p => p.toString()).join(' ');
	}
	check(args) {
		if (args.length < this.requiredArgs) {
			return Grant.denied(`Missing arguments: \`${this.getMissingParams(args).map(String).join(' ')}\``);
		} else if (args.length > this.maximumArgs) {
			//return Grant.denied(`Max number of arguments: ${this.maximumArgs}`);
		} else {
			var a = 0;
			// find first unsatisfied parameter (if it exists)
			for (var p in this) {
				if (args[a]) {
					if (this[p].isChoice) {
						if (this[p].choices.includes(args[a].toLowerCase())) a++;
						else return Grant.denied(`"${args[a]}" is not a valid choice: ${this[p].choices.join(', ')}`);
					} else if (this[p].isBlock) {
						if (this[p].isMulti) {
							while (args[a] && args[a].cmd) ++a;
						}
						if (args[a] && !args[a].cmd) {
							return Grant.denied(`"${args[a]}" is not runnable.`);
						} else if (a < args.length) {
							a++;
						} else {
							break;
						}
					} else {
						a++;
					}
				} else if (!this[p].optional) {
					return Grant.denied(`Missing argument: \`${this[p]}\``);
				}
			}
		}
		return Grant.granted();
	}
	/**
		Required Argument count getter
		Gets the number of parameters that are required to have a value passed
	*/
	get requiredArgs() {
		return this.filter(x => !this[x].optional).length;
	}
	/**
		Maximum Argument count getter
		Returns the maximum number of arguments accepted
	*/
	get maximumArgs() {
		if (this.some(x => this[x].isMulti)) {
			return MAX_ARGS;
		} else {
			return this.length;
		}
	}
	/**
		Returns an array of the parameters that have values passed
		@arg {Array} args
	*/
	getSatisifedParams(args) {
		var count = 0;
		for (let p in this) {
			if (this[p] && this[p].isSatisfied(args[count])) count++;
			else return this.items.slice(0,count);
		}
		return this.items;
	}
	/**
		Returns an array of the parameter names that do not have values passed
		@arg {Array} args
	*/
	getMissingParams(args) {
		var count = 0;
		for (let p of this.filter(x => !this[x].optional)) {
			if (args[count]) count++;
			else return this.items.slice(count);
		}
		return [];
	}
}

module.exports = Parameters;
