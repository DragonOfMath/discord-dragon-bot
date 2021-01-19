const MessageBrowser = require('./MessageBrowser');

class ContentMessageBrowser extends MessageBrowser {
	mapItem(item, index) {
		return item;
	}
	toString() {
		return '';
	}
	updateEmbed() {
		super.updateEmbed();
		this.embed.fields = [];
		
		let {filter, map} = this.options;
		let items = this.filterData(this.data);
		
		this.page = Math.min(this.page, items.length);
		
		if (items.length == 0) {
			this.embed.fields.push({
				name: 'Nothing',
				value: 'There are no items to display.'
			});
			return this.embed;
		}
		
		this.embed.footer = {
			text: `${this.page}/${items.length}`
		};
		
		let embed = this.mapItem(items[this.page-1], this.page-1);
		
		if (embed.title) {
			this.embed.fields.push({
				name: embed.title,
				value: embed.description || embed.url || 'No information provided.'
			});
		} else if (embed.description) {
			this.embed.description = embed.description;
		}
		if (embed.fields) {
			this.embed.fields = this.embed.fields.concat(embed.fields);
		}
		if (embed.color) {
			this.embed.color = embed.color;
		}
		if (embed.image) {
			this.embed.image = embed.image;
		}
		if (embed.thumbnail) {
			this.embed.thumbnail = embed.thumbnail;
		}
		if (embed.timestamp) {
			this.embed.timestamp = embed.timestamp;
		}
		if (embed.author) {
			this.embed.author = embed.author;
		}
		if (embed.footer) {
			this.embed.footer.text += ' | ' + embed.footer.text;
		}
		
		return this.embed;
	}
}

ContentMessageBrowser.CONFIG = {
	displayName: 'Content Browser'
};

module.exports = ContentMessageBrowser;
