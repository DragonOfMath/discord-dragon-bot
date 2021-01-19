const ContentMessageBrowser = require('../../Sessions/ContentMessageBrowser');

class RedditViewer extends ContentMessageBrowser {
	constructor() {
		super(...arguments);
		this.init();
	}
	init() {
		super.init();
		this.updateEmbed();
	}
	sortByKey() {
		this.data = this.data.sort((p1,p2) => {
			if (p1.id > p2.id) return -1;
			if (p1.id < p2.id) return 1;
			return 0;
		});
	}
	sortByValue() {
		if (this.data[0].isPost) {
			this.data = this.data.sort((p1,p2) => {
				if (p1.title > p2.title) return 1;
				if (p1.title < p2.title) return -1;
				return 0;
			});
		} else if (this.data[0].isComment) {
			this.data = this.data.sort((p1,p2) => {
				if (p1.score > p2.score) return 1;
				if (p1.score < p2.score) return -1;
				return 0;
			});
		}
	}
	mapItem(item) {
		return item.embed();
	}
}

RedditViewer.CONFIG = {
	displayName: 'Reddit',
	itemsPerPage: 1,
	canSort: true
};

module.exports = RedditViewer;
