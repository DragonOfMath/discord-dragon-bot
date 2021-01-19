const Constants = require('../../Constants/Reddit');
const {truncate} = require('../../Utils');

class Comment {
	constructor(comment = {}) {
		Object.assign(this, comment);
		if (this.replies) {
			this.replies = this.replies.data.children.map(c => new Comment(c.data));
		} else {
			this.replies = null;
		}
	}
	get timestamp() {
		return new Date(this.created * 1000);
	}
	embed() {
		return {
			url: this.permalink,
			title: `/u/${this.author} | ${this.score} points`,
			description: truncate(this.body, 2000),
			color: Constants.COLOR,
			timestamp: this.timestamp,
			footer: {text: `replying to ${this.parent_id} | ${this.replies.length} replies`}
		};
	}
}

module.exports = Comment;
