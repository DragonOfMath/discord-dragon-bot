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
		this.data.m = message.match(/\b\/?[ru]\/[\w\d_]{3,25}\b/gm);
		if (this.data.m && this.data.m.length) {
			return 'r';
		}
	},
	events: {
		r() {
			return this.data.m.map(x => 'https://reddit.com' + x).join('\n');
		}
	}
}

