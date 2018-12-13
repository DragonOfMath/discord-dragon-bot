const {Markdown:md} = require('../Utils');

class Response {
	constructor() {
		this.message  = '';
		this.embed    = null;
		this.filename = '';
		this.file     = null;
		this.expires  = false;
	}
	set title(x) {
		if (typeof(x) === 'string' && x.length > 0) {
			if (this.embed) {
				if (this.embed.title) {
					this.embed.title = x + ' | ' + this.embed.title;
				} else {
					this.embed.title = x;
				}
			} else {
				if (this.message) {
					this.message = md.bold(x) + ' | ' + this.message;
				} else {
					//this.message = md.bold(x);
				}
			}
		}
	}
}

module.exports = Response;
