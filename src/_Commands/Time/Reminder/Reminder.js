const {Markdown:md,Format:fmt} = require('../../../Utils');

class Reminder {
	constructor(who, what, when, repeat = 0) {
		if (typeof(who) === 'object') {
			this.who  = who.who;
			this.what = who.what;
			this.when = who.when;
			this.repeat = who.repeat || 0;
		} else {
			this.who  = who;
			this.what = what;
			this.when = when;
			this.repeat = repeat;
		}
	}
	get date() {
		return new Date(this.when);
	}
	get ready() {
		return Date.now() >= this.when;
	}
	toString() {
		let str = this.date.toLocaleString();
		if (this.repeat) {
			str += ` (repeat every ${fmt.time(this.repeat)})`;
		}
		str += `: ${this.what} (${md.code(this.when)})`
		return str;
	}
}

module.exports = Reminder;
