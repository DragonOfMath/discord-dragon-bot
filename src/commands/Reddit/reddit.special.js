module.exports = {
	id: 'reddit',
	title: '',
	info: 'Assists with reddit-related things such as /r/cats or /u/waterguy12',
	data: {
		m: []
	},
	permissions: {
		type: 'public'
	},
	resolver({message}) {
		var matches = message.match(/^\/?([ru]\/[\w\d_]+)$/);
		if (matches) {
			this.data.m = matches[1];
			return 'r';
		}
	},
	events: {
		r() {
			return 'https://reddit.com/' + this.data.m;
		}
	}
}

