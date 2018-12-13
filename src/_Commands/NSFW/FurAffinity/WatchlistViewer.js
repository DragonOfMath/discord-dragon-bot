const BufferMessageBrowser = require('../../../Sessions/BufferMessageBrowser');

class WatchlistViewer extends BufferMessageBrowser {
	constructor(context, usernames, options) {
		super(context, usernames, options);
		this.init();
	}
	init() {
		super.init();
		this.updateEmbed();
	}
}

WatchlistViewer.CONFIG = {
	displayName: 'FurAffinity',
	itemsPerField: 25,
	itemsPerPage: 25,
	delimiter: '\n',
	canSort: false
};

module.exports = WatchlistViewer;
