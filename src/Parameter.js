/**
	Parameter class
	Defines a valid parameter for a command
	Syntax:
	 * parameter - singular, required
	 * [parameter] - singular, optional, no default value
	 * ...parameter - multi, required, at least 1
	 * [...parameter] - multi, optional, at least 1
*/
class Parameter {
	constructor(param) {
		if (typeof(param) !== 'string' || !param) {
			throw new TypeError(`${this.constructor.name}.param must be a non-empty string.`);
		}
		this.name = param.match(/[^\[\]\.]+/);
		this.optional = /^\[.+\]$/.test(param);
		this.isMulti = /\.{3}/.test(param);
	}
	toString() {
		let n = this.name;
		if (this.isMulti) n = '...' + n;
		if (this.optional) n = '[' + n + ']';
		return n;
	}
}

module.exports = Parameter;
