const MessageBrowser = require('./MessageBrowser');
const {tableify} = require('../Utils/embed');

class TableMessageBrowser extends MessageBrowser {
	filterData(data) {
		return data;
	}
	map(item, index) {
		return [`#${index+1}`,item];
	}
	updateEmbed() {
		super.updateEmbed();
		
		let {itemsPerPage, columns} = this.options;
		let items = this.filterData(this.data);
		
		let maxPages = Math.ceil(items.length / itemsPerPage);
		this.page = Math.min(this.page, maxPages);
		
		let embed = tableify(columns, items, this.mapItem.bind(this), itemsPerPage * (this.page - 1), itemsPerPage);
		this.embed.fields = embed.fields;
		this.embed.footer = embed.footer;
		return this.embed;
	}
}

TableMessageBrowser.CONFIG = {
	displayName: 'Table Message Browser',
	columns: ['ID','Value'],
	itemsPerPage: 30
};

module.exports = TableMessageBrowser;
