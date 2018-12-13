const Flag = require('./Flag');
const TypeMapBase = require('../Structures/TypeMapBase');

class Flags extends TypeMapBase {
	constructor(flags = [], command) {
		super(Flag);
		for (let f = 0; f < flags.length; f++) {
			this.set(f, this.create(flags[f]));
		}
		this.setProperty('command', command);
	}
	toArray() {
		return this.items.map(f => f.toString());
	}
	toString() {
		return this.toArray().join(' ');
	}
}

module.exports = Flags;
