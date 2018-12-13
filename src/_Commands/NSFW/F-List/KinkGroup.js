const Kink = require('./Kink');
const {unescapeHTMLEntities} = require('../../../Utils');

class KinkGroup {
	constructor(id, data) {
		this.id    = id;
		this.name  = unescapeHTMLEntities(data.group);
		this.kinks = data.items.map(k => new Kink(k));
	}
	embed() {
		var e = {
			title: 'Group: ' + this.name,
			description: '',
			color: 0x1b446f
		};
		for (var kink of this.kinks) {
			e.description += kink.toString();
			
			e.description += '\n';
		}
		return e;
	}
	toString() {
		return `${this.id}: **${this.name}** (${this.kinks.length})`;
	}
}

module.exports = KinkGroup;
