const MessageBrowser = require('./MessageBrowser');

const FIRST = '⏫';
const PREV  = '⬆';
const NEXT  = '⬇';
const LAST  = '⏬';
const OK    = '🆗';
const NAVIGATION = [FIRST,PREV,OK,NEXT,LAST];

/**
 * SelectionMessageBrowser
 * A browsing interface modified to select from a list of items.
 */
class SelectionMessageBrowser extends MessageBrowser {
	get selected() {
		return this.data[this.selectedIdx];
	}
	init() {
		super.init();
		this.selectedIdx = 0;
	}
	handleNavigation(context) {
		let change = true;
		switch (context.reaction) {
			case FIRST:
				this.selectedIdx = 0;
				break;
			case PREV:
				this.selectedIdx = Math.max(0, this.selectedIdx - 1);
				break;
			case NEXT:
				this.selectedIdx = Math.min(this.selectedIdx + 1, this.data.length - 1);
				break;
			case LAST:
				this.selectedIdx = this.data.length - 1;
				break;
			case OK:
				change = this.handleOK(context);
				break;
		}
		this.page = Math.floor(this.selectedIdx / this.options.itemsPerPage) + 1;
		return change;
	}
	handleOK() {
		throw 'You need to override SelectionMessageBrowser#handleOK()';
	}
	mapItem(item, idx) {
		return (idx === this.selectedIdx ? '**>**' : '') + item.toString();
	}
}

SelectionMessageBrowser.CONFIG = {
	displayName: 'Selection Browser',
	itemsPerPage: 10
};

SelectionMessageBrowser.NAVIGATION = NAVIGATION;
SelectionMessageBrowser.FIRST = FIRST;
SelectionMessageBrowser.PREV  = PREV;
SelectionMessageBrowser.NEXT  = NEXT;
SelectionMessageBrowser.LAST  = LAST;
SelectionMessageBrowser.OK    = OK;

module.exports = SelectionMessageBrowser;
