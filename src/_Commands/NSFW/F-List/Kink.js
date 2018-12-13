const {unescapeHTMLEntities} = require('../../../Utils');

class Kink {
	constructor(kink) {
		this.id          = kink.kink_id;
		this.name        = unescapeHTMLEntities(kink.name);
		this.description = kink.description;
	}
	embed() {
		return {
			title: this.name,
			description: this.description,
			color: 0x1b446f
		};
	}
	toString() {
		return `${this.id}: **${this.name}**`;
	}
}

module.exports = Kink;
