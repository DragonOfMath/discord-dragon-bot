const MessageBrowser = require('./MessageBrowser');
const {bufferize} = require('../Utils/embed');

class BufferMessageBrowser extends MessageBrowser {
	filterData(data) {
		return data;
	}
	mapData(item, index) {
		return item;
	}
	updateEmbed() {
		super.updateEmbed();
		
		let {itemsPerPage, itemsPerField, delimiter, filter, map} = this.options;
		let items = this.filterData(this.data);
		
		let maxPages = Math.ceil(items.length / itemsPerPage);
		this.page = Math.min(this.page, maxPages);
		
		let embed = bufferize(items, this.page, itemsPerField, itemsPerPage, delimiter, this.mapItem.bind(this));
		this.embed.fields = embed.fields;
		this.embed.footer = embed.footer;
		return this.embed;
	}
}

BufferMessageBrowser.CONFIG = {
	displayName: 'Buffer Message Browser',
	itemsPerField: 25,
	itemsPerPage: 50,
	delimiter: '\n'
};

module.exports = BufferMessageBrowser;
