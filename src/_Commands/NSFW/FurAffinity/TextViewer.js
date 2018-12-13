const ListMessageBrowser = require('../../../Sessions/ListMessageBrowser');
const {Markdown:md} = require('../../../Utils');

class TextViewer extends ListMessageBrowser {
	constructor(context, items, options) {
		super(context, items, options);
		this.init();
	}
	init() {
		super.init();
		this.updateEmbed();
	}
	get color() {
		return 0x2e3b41;
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
			if (s1.title) {
				if (s1.title > s2.title) return 1;
				if (s1.title < s2.title) return -1;
			} else {
				if (s1.name > s2.name) return 1;
				if (s1.name < s2.name) return -1;
			}
			return 0;
		});
	}
	mapItem(_, i, item) {
		let e = item.embed();
		return {
			name: e.title,
			value: e.url ? md.link(e.description, e.url) : e.description
		};
	}
}

TextViewer.CONFIG = {
	displayName: 'FurAffinity',
	itemsPerPage: 10,
	canSort: true
};

module.exports = TextViewer;
