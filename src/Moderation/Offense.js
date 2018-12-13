const Constants = require('../Constants/Moderation');

/**
 * Represents a detected offense and the actions it must take.
 * @class Offense
 * @prop {String} type    - the type of offense made
 * @prop {String} reason  - the reason for the offense
 * @prop {Number} actions - the number calculated from the actions to take for the offense
 */
class Offense {
	constructor(type, reason, actions = 0) {
		this.type    = type;
		this.reason  = reason;
		this.actions = actions;
	}
	toString() {
		return `[${this.type}] ${this.reason}`;
	}
	get reportable() {
		return this.actions & Constants.ACTIONS.REPORT;
	}
	get bannable() {
		return this.actions & Constants.ACTIONS.BAN;
	}
	get softbannable() {
		return this.actions & Constants.ACTIONS.SOFTBAN;
	}
	get kickable() {
		return this.actions & Constants.ACTIONS.KICK;
	}
	get strikeable() {
		return this.actions & Constants.ACTIONS.STRIKE;
	}
	get mutable() {
		return this.actions & Constants.ACTIONS.MUTE;
	}
	get warnable() {
		return this.actions & Constants.ACTIONS.WARN;
	}
	get removeable() {
		return this.actions & Constants.ACTIONS.DELETE;
	}
	get ignore() {
		return this.actions == Constants.ACTIONS.NONE;
	}
}

module.exports = Offense;
