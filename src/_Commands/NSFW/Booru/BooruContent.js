const {Markdown:md} = require('../../../Utils');

const RATING = {
	e: '🔞 **Explicit**',
	q: '⚠ *Questionable*',
	s: '👌 Safe'
};

class BooruContent {
	constructor(data = {}, booru) {
		Object.assign(this, data);
		this.booru = booru;
	}
	get pending() {
		return this.status === 'pending';
	}
	get approved() {
		return this.status === 'approved';
	}
	get flagged() {
		return this.status === 'flagged';
	}
	get deleted() {
		return this.status === 'deleted';
	}
	get safe() {
		return this.rating === 's';
	}
	get questionable() {
		return this.rating === 'q';
	}
	get explicit() {
		return this.rating === 'e';
	}
	get color() {
		if (this.pending) {
			return 0x0000ff;
		} else if (this.flagged || this.deleted) {
			return 0x000000;
		} else if (this.explicit) {
			return 0xff0000;
		} else if (this.questionable) {
			return 0xffff00;
		} else if (this.safe) {
			return 0x008800;
		}
	}
	// collect info such as score, faves, rating, and artists
	get metrics() {
		return `${this.score>0?'👍':this.score<0?'👎':'--'} ${this.score} | ❤ ${this.faves} | ${RATING[this.rating]} | by ${this.getArtistLinks().join(', ')}`;
	}
	getArtistLinks() {
		return this.artists.map(a => md.link(a.name, a.url));
	}
	embed(title, description, color = this.booru.color, url = this.booru.host) {
		return {
			title,
			description,
			color,
			url,
			timestamp: new Date(),
			fields: [],
			author: this.booru.authorEmbedInfo,
			footer: {
				text: ''
			}
		};
	}
}

module.exports = BooruContent;
