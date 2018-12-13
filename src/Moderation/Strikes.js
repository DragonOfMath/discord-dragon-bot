const Actions = require('./Actions');
const Offense = require('./Offense');

/**
 * Strikes class constructor
 * Represents the list of users with strikes against them.
 * @class Strikes
 * @prop {Object<Snowflake>} users - the user table of strikes, with their IDs as the key
 * @prop {Array<Number>} actions - the actions to take for each strike
 */
class Strikes {
	constructor(users, actions) {
		if (typeof(arguments[0]) === 'object') {
			this.users   = arguments[0].users || {};
			this.actions = arguments[0].actions || [0,0,0];
		} else {
			this.users   = users || {};
			this.actions = actions || [0,0,0];
		}
	}
	toString() {
		return `Strikes Issued: ${this.totalStrikes} | Actions: ${this.getActions().map(a => a.join('+')).join(' -> ')}`;
	}
	get totalStrikes() {
		let total = 0;
		for (let id in this.users) {
			total += this.users[id];
		}
		return total;
	}
	get(user) {
		return this.users[user] || 0;
	}
	set(user, x) {
		return this.users[user] = x;
	}
	clear(user) {
		delete this.users[user];
	}
	clearAll() {
		Object.keys(this.users).forEach(id => this.clear(id));
	}
	strike(user) {
		return this.set(this.get(user) + 1);
	}
	unstrike(user) {
		let strikes = this.get(user) - 1;
		if (strikes < 1) {
			this.clear(user);
			strikes = 0;
		} else {
			this.set(strikes);
		}
		return strikes;
	}
	isOut(user) {
		return this.get(user) >= 3;
	}
	setActions(actions) {
		return this.actions = actions.slice(0, 3).map(Actions.set);
	}
	getActions() {
		return this.actions.map(Actions.get);
	}
}

module.exports = Strikes;
