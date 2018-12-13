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
		this.config(this.constructor.CONFIG);
		Object.assign(this.options, options);
		
		//this.client = context.client;
		
		this.user = context.user;
		this.data = data;
		
		this.on('reaction', async (ctx) => {
			let {reaction, change, userID, client} = ctx;
			if (userID != this.user.id) return;
			
			if (reaction == LiveMessage.CLOSE) {
				return this.delete(client);
			}
			
			if (NAVIGATION.includes(reaction) || SORTING.includes(reaction)) {
				if (change > 0) {
					await this.removeReaction(client, reaction, userID);
				} else {
					return;
				}
				
				switch (reaction) {
					// navigation
					case FIRST:
						this.page = 1;
						break;
					case PREV:
						this.page--;
						if (this.page < 1) {
							this.page = 1;
							return;
						}
						break;
					case NEXT:
						this.page++;
						break;
					case LAST:
						this.page = Infinity;
						break;

					// sorting
					case SORT_BY_KEY:
						if (!this.options.canSort) return;
						this.sortByKey();
						break;
					case SORT_BY_VALUE:
						if (!this.options.canSort) return;
						this.sortByValue();
						break;
				}
				
				this.updateEmbed();
				this.edit(client);
			} else if (this.options.interface.includes(reaction)) {
				let valid = await this.handleUserAction(ctx);
				if (valid) {
					this.updateEmbed();
					this.edit(client);
				}
			}
		});
	}
	config(options = {}) {
		this.options = {};
		if (!options.displayName) {
			options.displayName = this.constructor.name;
		}
		for (let key in options) {
			if (key in MessageBrowser.CONFIG) {
				this.options[key] = options[key];
			}
		}
	}
	init() {
		this.page  = 1;
		this.embed = {};
	}
	startBrowser(client) {
		let reactions = NAVIGATION.slice();
		if (this.options.interface) {
			reactions = reactions.concat(this.options.interface);
		}
		if (this.options.canSort) {
			if (!reactions.includes(SORT_BY_KEY)) reactions.push(SORT_BY_KEY);
			if (!reactions.includes(SORT_BY_VALUE)) reactions.push(SORT_BY_VALUE);
		}
		return this.setupReactionInterface(client, reactions);
	}
	sortByKey() {
		throw 'You need to override MessageBrowser#sortByKey()';
	}
	sortByValue() {
		throw 'You need to override MessageBrowser#sortByValue()';
	}
	handleUserAction({reaction, change, client, userID}) {
		
	}
	filterData(data) {
		return data;
	}
	mapItem(item) {
		return item;
	}
	toString() {
		return '';
	}
	updateEmbed() {
		return this.embed = {
			title: this.options.displayName,
			description: this.toString(),
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

MessageBrowser.CLOSE = LiveMessage.CLOSE;

module.exports = MessageBrowser;
