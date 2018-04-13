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
		var matches = message.match(/\B\/?[ru]\/[\w\d_]+/g);
		if (matches) {
			this.data.m = matches;
			return 'r';
		}
	},
	events: {
		r() {
			return this.data.m.map(x => 'https://reddit.com' + x).join('\n');
		}
	}
}

