/**
	Parameter class
	Defines a valid parameter for a command
	Syntax:
	 * parameter - singular, required
	 * [parameter] - singular, optional, no default value
	 * ...parameter - multi, required, at least 1
	 * [...parameter] - multi, optional, at least 1
	 * <par|am|et|er> - singular, required choice of "par", "am", "et", or "er"
*/
class Parameter {
	constructor(param) {
		if (typeof(param) !== 'string' || !param) {
			throw new TypeError(`${this.constructor.name}.param must be a non-empty string.`);
		}
		this.name = param.match(/[^\[\]\.]+/);
		this.optional = /^\[.+\]$/.test(param);
		this.isMulti = /\.{3}/.test(param);
		this.isChoice = /<[\w\d]+(\|[\w\d]+)*>/.test(param);
		if (this.isChoice) {
			this.choices = param.match(/[\w\d]+/g);
			if (this.choices.length < 2) {
				throw new Error(`${this.constructor.name} "${this.name}" requires at least 2 choices.`);
			}
		}
	}
	isSatisfied(x) {
		if (this.isChoice) {
			return !!x && this.choices.includes(x.toLowerCase());
		} else {
			return !!x;
		}
	}
	toString() {
		let n = this.isChoice ? `<${this.choices.join('|')}>` : this.name;
		if (this.isMulti) n = '...' + n;
		if (this.optional) n = '[' + n + ']';
		return n;
	}
}

/* Concept classes
class OptionalParameter extends Parameter {
	toString() {
		return '[' + this.name + ']';
	}
}
class OptionalSpreadParameter extends OptionalParameter {
	toString() {
		return '[' + this.name + '...]';
	}
}
class SpreadParameter extends Parameter {
	toString() {
		return this.name + '...';
	}
}
class ChoiceParameter extends Parameter {
	toString() {
		return '<' + this.name + '>';
	}
}
*/

module.exports = Parameter;
