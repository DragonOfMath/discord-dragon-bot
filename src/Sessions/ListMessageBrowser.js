const MessageBrowser = require('./MessageBrowser');
const {paginate} = require('../Utils/embed');

class ListMessageBrowser extends MessageBrowser {
	filterData(data) {
		return data;
	}
	mapItem(data, item, index) {
		return {
			name: `#${index+1}`,
			value: item,
			inline: true
		};
	}
	updateEmbed() {
		super.updateEmbed();
		
		let {filter, map, itemsPerPage} = this.options;
		let items = this.filterData(this.data);
		
		let maxPages = Math.ceil(items.length / itemsPerPage);
		this.page = Math.min(this.page, maxPages);
		
		let embed = paginate(items, this.page, itemsPerPage, this.mapItem.bind(this));
		this.embed.fields = embed.fields;
		this.embed.footer = embed.footer;
		return this.embed;
	}
}

ListMessageBrowser.CONFIG = {
	displayName: 'List Message Browser',
	itemsPerPage: 15
};

module.exports = ListMessageBrowser;
