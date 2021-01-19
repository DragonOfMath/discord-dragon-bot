const LiveMessage = require('./LiveMessage');

const FIRST = '⏮';
const PREV  = '⬅';
const NEXT  = '➡';
const LAST  = '⏭';
const NAVIGATION = [FIRST,PREV,NEXT,LAST];

const SORT_BY_KEY   = '🔢';
const SORT_BY_VALUE = '🔠';
const SORTING = [SORT_BY_KEY,SORT_BY_VALUE];

class MessageBrowser extends LiveMessage {
	constructor(context, data = [], options = {}) {
		super(context.channelID);
		this.config(options);
		
		//this.client = context.client;
		
		this.user = context.user;
		this.data = data;
		
		this.on('reaction', evt => {
			if (evt.userID != this.user.id) return;
			
			if (evt.reaction == LiveMessage.CLOSE) {
				return this.delete(evt.client);
			}
			
			this.handleReaction(evt);
		});
	}
	config(options = {}) {
		this.options = Object.assign({}, MessageBrowser.CONFIG, this.constructor.CONFIG, options);
	}
	init() {
		this.page  = 1;
		this.embed = {};
	}
	startBrowser(client) {
		let reactions = (this.constructor.NAVIGATION || NAVIGATION).slice();
		if (this.options.interface) {
			reactions = reactions.concat(this.options.interface);
		}
		if (this.options.canSort) {
			if (!reactions.includes(SORT_BY_KEY)) reactions.push(SORT_BY_KEY);
			if (!reactions.includes(SORT_BY_VALUE)) reactions.push(SORT_BY_VALUE);
		}
		return this.setupReactionInterface(client, reactions);
	}
	async handleReaction(context) {
		let {reaction, change, userID, client} = context;
		
		let valid = false;
		if (this.constructor.NAVIGATION.includes(reaction)) {
			if (change > 0) {
				await this.removeReaction(client, reaction, userID);
			} else {
				return;
			}
			valid = await this.handleNavigation(context);
			
		} else if (SORTING.includes(reaction)) {
			if (change > 0) {
				await this.removeReaction(client, reaction, userID);
			} else {
				return;
			}
			valid = await this.handleSorting(context);
			
		} else if (this.options.interface.includes(reaction)) {
			valid = await this.handleCustomAction(context);
		}
		
		if (valid) {
			this.updateEmbed();
			this.edit(client);
		}
	}
	handleNavigation(context) {
		switch (context.reaction) {
			// navigation
			case FIRST:
				this.page = 1;
				break;
			case PREV:
				this.page--;
				if (this.page < 1) {
					this.page = 1;
					return false;
				}
				break;
			case NEXT:
				this.page++;
				break;
			case LAST:
				this.page = Infinity;
				break;
		}
		return true;
	}
	handleSorting(context) {
		if (!this.options.canSort) return false;
		switch (context.reaction) {
			// sorting
			case SORT_BY_KEY:
				this.sortByKey();
				break;
			case SORT_BY_VALUE:
				this.sortByValue();
				break;
		}
		return true;
	}
	handleCustomAction(context) {
		return false;
	}
	sortByKey() {
		throw 'You need to override MessageBrowser#sortByKey()';
	}
	sortByValue() {
		throw 'You need to override MessageBrowser#sortByValue()';
	}
	filterData(data) {
		return data;
	}
	mapItem(item, index) {
		return item.toString();
	}
	toString() {
		return this.data.map((d,i) => this.mapItem(d,i)).join('\n');
	}
	updateEmbed() {
		return this.embed = {
			title: this.options.displayName,
			color: this.color || null
		};
	}
}

MessageBrowser.CONFIG = {
	displayName: 'Browser',
	itemsPerPage: 1,
	canSort: false,
	interface: []
};

MessageBrowser.NAVIGATION = NAVIGATION;
MessageBrowser.FIRST = FIRST;
MessageBrowser.PREV  = PREV;
MessageBrowser.NEXT  = NEXT;
MessageBrowser.LAST  = LAST;
MessageBrowser.SORTING = SORTING;
MessageBrowser.SORT_BY_KEY   = SORT_BY_KEY;
MessageBrowser.SORT_BY_VALUE = SORT_BY_VALUE;

MessageBrowser.CLOSE = LiveMessage.CLOSE;

module.exports = MessageBrowser;
