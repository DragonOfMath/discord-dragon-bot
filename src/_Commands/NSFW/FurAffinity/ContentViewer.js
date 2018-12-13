const ContentMessageBrowser = require('../../../Sessions/ContentMessageBrowser');

const GENERAL = '⚪';
const MATURE = '🔵';
const ADULT = '🔴';
const RATING = {
	General: GENERAL,
	Mature: MATURE,
	Adult: ADULT
};

class ContentViewer extends ContentMessageBrowser {
	constructor(context, items, options) {
		super(context, items, options);
		this.init();
	}
	init() {
		super.init();
		this.options.ratings = {};
		for (let r in RATING) {
			this.options.ratings[r] = false;
		}
		this.updateEmbed();
	}
	get color() {
		return 0x2e3b41;
	}
	handleUserAction({reaction, change, client, userID}) {
		for (let r in RATING) {
			if (reaction == RATING[r]) {
				this.options.ratings[r] = change > 0;
				return true;
			}
		}
	}
	sortByKey() {
		this.data = this.data.sort((s1,s2) => {
			if (s1.id > s2.id) return -1;
			if (s1.id < s2.id) return 1;
			return 0;
		});
	}
	sortByValue() {
		this.data = this.data.sort((s1,s2) => {
			if (s1.title > s2.title) return 1;
			if (s1.title < s2.title) return -1;
			return 0;
		});
	}
	filterData(data) {
		let hasFilter = Object.keys(this.options.ratings).some(r => this.options.ratings[r]);
		return data.filter(sub => {
			return !sub.rating || !hasFilter || this.options.ratings[sub.rating];
		});
	}
	mapItem(item) {
		return item.embed();
	}
	toString() {
		let activeFilters = Object.keys(this.options.ratings).filter(r => this.options.ratings[r]);
		if (activeFilters.length) {
			return 'Filters: ' + activeFilters.join(', ');
		} else {
			return null;
		}
	}
}

ContentViewer.CONFIG = {
	displayName: 'FurAffinity',
	itemsPerPage: 1,
	canSort: true,
	//interface: [GENERAL,MATURE,ADULT]
};

module.exports = ContentViewer;
