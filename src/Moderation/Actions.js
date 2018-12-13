const Constants = require('../Constants/Moderation');

class Actions {
	static set(actions = []) {
		if (!(actions instanceof Array)) {
			actions = actions.split('+');
		}
		let sum = 0;
		for (let a of actions) {
			if (typeof(a) === 'string') {
				sum |= Constants.ACTIONS[a.toUpperCase()];
			} else if (typeof(a) === 'number') {
				sum += a;
			}
		}
		return sum;
	}
	static get(actions = 0xFFFF) {
		let actionNames = [];
		for (let action in Constants.ACTIONS) {
			if (actions & Constants.ACTIONS[action]) {
				actionNames.push(action.toLowerCase());
			}
		}
		return actionNames;
	}
}

module.exports = Actions;
