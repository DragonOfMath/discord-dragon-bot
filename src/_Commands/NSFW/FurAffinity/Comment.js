const {truncate} = require('../../../Utils');

class Comment {
	constructor(comment) {
		if (comment) Object.assign(this, comment);
	}
	embed() {
		return {
			title: `${this.name}'s Comment (#${this.id})`,
			description: truncate(this.text, 500),
			timestamp: this.posted_at,
			author: {
				name: this.name,
				url: this.profile,
				icon_url: this.avatar
			}
		};
	}
}

module.exports = Comment;
