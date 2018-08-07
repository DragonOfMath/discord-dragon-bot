module.exports = class Reminder {
	constructor(who, what, when) {
		if (typeof(who) === 'object') {
			this.who  = who.who;
			this.what = who.what;
			this.when = who.when;
		} else {
			this.who  = who;
			this.what = what;
			this.when = when;
		}
	}
};

