const ContentMessageBrowser = require('../../../Sessions/ContentMessageBrowser');

class PoolViewer extends ContentMessageBrowser {
	constructor(context, pool, options) {
		super(context, pool.posts, options);
		this.pool = pool;
		this.booru = pool.booru;
		this.init();
	}
	init() {
		super.init();
		this.updateEmbed();
	}
	filterData(data) {
		return data;
	}
	mapItem(item, index) {
		return item.embed();
	}
	updateEmbed() {
		super.updateEmbed();
		let poolEmbed = this.pool.embed();
		this.embed.title = poolEmbed.title;
		this.embed.description = poolEmbed.description;
		this.embed.author = poolEmbed.author;
		return this.embed;
	}
}

PoolViewer.CONFIG = {
	displayName: 'Booru Posts',
	canSort: false
};

module.exports = PoolViewer;
