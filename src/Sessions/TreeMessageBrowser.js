const MessageBrowser = require('./MessageBrowser');

const DOWN = '⬇';
const UP = '⬆';
const TOP = '🔝';
const NAVIGATION = MessageBrowser.NAVIGATION;
const DEPTH_NAVIGATION = [DOWN,UP,TOP];

/**
 * TreeMessageBrowser class
 * @class
 * Browse items in a tree-like data structure.
 */
class TreeMessageBrowser extends MessageBrowser {
	constructor(context, data, options) {
		super(context, data, options);
		this.root = this.data;
		this.nav = [];
	}
	init() {
		super.init();
		this.data = this.root;
		this.nav = [];
	}
	async handleNavigation(event) {
		switch (event.reaction) {
			case DOWN:
				return this.goDown(event);
			case UP:
				return this.goUp(event);
			case TOP:
				return this.goToTop(event);
			default:
				return super.handleNavigation(event);
		}
	}
	get currentNode() {
		let o = this.root;
		for (let n of this.nav) o = o[n];
		return o;
	}
	get currentKeys() {
		return Object.keys(this.currentNode);
	}
	get selectedKey() {
		return this.currentKeys[this.page-1];
	}
	get selectedNode() {
		return this.data[this.selectedKey];
	}
	goDown() {
		if (typeof(this.selectedNode) !== 'object') {
			return false;
		}
		
		let selectedKey = this.selectedKey;
		this.nav.push(selectedKey);
		this.data = this.currentNode[selectedKey];
		this.page = 1;
		
		return true;
	}
	goUp() {
		if (this.nav.length == 0) {
			return false;
		}
		
		let selectedKey = this.nav.pop();
		this.data = this.currentNode;
		this.page = this.currentKeys.indexOf(selectedKey)+1;
		
		return true;
	}
	goToTop() {
		if (this.nav.length == 0) {
			return false;
		}
		
		this.nav = [];
		this.data = this.root;
		this.page = 1;
		
		return true;
	}
	toString() {
		return this.nav.join(' > ');
	}
}
TreeMessageBrowser = {
	displayName: 'Tree Browser',
	itemsPerPage: 1,
	canSort: false,
	interface: []
};

TreeMessageBrowser.NAVIGATION = [NAVIGATION[0],NAVIGATION[1],...DEPTH_NAVIGATION,NAVIGATION[2],NAVIGATION[3]];
TreeMessageBrowser.DOWN = DOWN;
TreeMessageBrowser.UP = UP;

module.exports = TreeMessageBrowser;
