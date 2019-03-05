const Actions   = require('./Actions');
const Offense   = require('./Offense');
const Constants = require('../Constants/Moderation');
const Asset     = require('../Structures/Asset');
const VULGARITY = Asset.load('Discord/vulgarity.json');

class Vulgarity {
	constructor(level, actions) {
		if (typeof(arguments[0]) === 'object') {
			this.level   = arguments[0].level   || 0;
			this.actions = arguments[0].actions || 0;
		} else {
			this.level   = level   || 0;
			this.actions = actions || 0;
		}
	}
	toString() {
		return `Vulgarity Level: ${this.level} ${this.getLevel()} | Actions: ${this.getActions().join('+')}`;
	}
	setLevel(level) {
		switch (String(level)) {
			case '0':
			case 'none':
				level = 'NONE';
				break;
			case '1':
			case 'low':
			case 'light':
				level = 'LIGHT';
				break;
			case '2':
			case 'medium':
				level = 'MEDIUM';
				break;
			case '3':
			case 'heavy':
			case 'high':
				level = 'HEAVY';
				break;
		}
		this.level = Constants.LEVELS[level];
		return level;
	}
	getLevel() {
		for (let lvl in Constants.LEVELS) {
			if (Constants.LEVELS[lvl] == this.level) {
				return lvl.toLowerCase();
			}
		}
		return 'none';
	}
	setActions(actions) {
		return this.actions = Actions.set(actions);
	}
	getActions() {
		return Actions.get(this.actions);
	}
	checkMessage(message) {
		let words = message.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/);
		let levels = Object.keys(VULGARITY);
		for (let i = 0, level; i < levels.length; i++) {
			level = levels[i];
			if (this.level > i && VULGARITY[level].some(word => words.includes(word))) {
				return new Offense('Vulgarity', 'Message contained ' + level, this.actions);
			}
		}
	}
}

module.exports = Vulgarity;
