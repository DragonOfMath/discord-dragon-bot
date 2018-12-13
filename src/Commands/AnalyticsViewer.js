const MessageBrowser = require('../Sessions/MessageBrowser');
const {bufferize} = require('../Utils');

class AnalyticsViewer extends MessageBrowser {
	constructor() {
		super(...arguments);
		this.init();
	}
	init() {
		super.init();
		this.updateEmbed();
	}
	sortByKey() {
		this.data = this.data.sort('key');
	}
	sortByValue() {
		this.data = this.data.sort('value-desc');
	}
	updateEmbed() {
		super.updateEmbed();
		
		let length   = this.data.length;
		let maxPages = Math.ceil(length / this.options.itemsPerPage);
		this.page    = Math.min(this.page, maxPages);
		
		let embed = bufferize(this.data.keys.map(item => `${item}: ${data[item]}`), this.page, this.options.itemsPerField, this.options.itemsPerPage, '\n');
		this.embed.fields = embed.fields;
		this.embed.footer = embed.footer;
		this.embed.footer.text += ' | Total Usage: ' + this.data.total;
		
		return this.embed;
	}
}

AnalyticsViewer.CONFIG = {
	displayName: 'Analytics',
	itemsPerField: 25,
	itemsPerPage: 75,
	canSort: true
};

module.exports = AnalyticsViewer;
