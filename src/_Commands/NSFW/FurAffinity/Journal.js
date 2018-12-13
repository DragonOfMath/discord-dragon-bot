const {truncate} = require('../../../Utils');

class Journal {
	constructor(journal) {
		if (journal) Object.assign(this, journal);
	}
	embed() {
		let e = {
			url: this.link,
			color: 0x2e3b41,
			timestamp: this.posted_at
		};
		if (this.name) {
			e.title = `"${this.title}" by ${this.name}`;
			e.description = truncate(this.description, 2000);
		} else {
			e.title = this.title;
			e.description = truncate(this.description, 500);
		}
		return e;
	}
}

module.exports = Journal;
