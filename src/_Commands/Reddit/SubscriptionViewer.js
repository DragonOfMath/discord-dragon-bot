const MessageBrowser = require('../../Sessions/MessageBrowser');
const Constants      = require('../../Constants/Reddit');
const {Markdown:md,paginate} = require('../../Utils');

class SubscriptionViewer extends MessageBrowser {
	constructor(context, subscription) {
		super(context, subscription);
		this.init();
	}
	init() {
		super.init();
		this.updateEmbed();
	}
	sortByKey() {
		let subs = this.data.subreddits;
		let orderedObj = {};
		subs = subs.sort((s1,s2) => {
			if (this.data[s1] < this.data[s2]) return 1;
			if (this.data[s1] > this.data[s2]) return -1;
			return 0;
		});
		for (let s of subs) {
			orderedObj[s] = this.data.subs[s];
		}
		this.data.subs = orderedObj;
	}
	sortByValue() {
		let subs = this.data.subreddits;
		let orderedObj = {};
		subs = subs.sort();
		for (let s of subs) {
			orderedObj[s] = this.data.subs[s];
		}
		this.data.subs = orderedObj;
	}
	toString() {
		let opts = this.data.options;
		return `Category: ${opts.type} | Limit: ${opts.limit} | Time: ${opts.time}`;
	}
	updateEmbed() {
		super.updateEmbed();
		
		const Reddit = require('./Reddit');
		
		let subs = this.data.subreddits;
		
		let length   = subs.length;
		let maxPages = Math.ceil(length / this.options.itemsPerPage);
		this.page    = Math.min(this.page, maxPages);
		
		let e = paginate(subs, this.page, Constants.Subscription.PER_PAGE, (subreddits, index, subreddit) => {
			let value = this.data.subs[subreddit];
			if (value) {
				value = md.link(value, Reddit.link(subreddit, value));
			} else {
				value = md.link('No cached post', Reddit.link(subreddit));
			}
			return { name: '/r/' + subreddit, value, inline: true };
		});
		
		this.embed.fields = e.fields;
		this.embed.footer = e.footer;
		
		return this.embed;
	}
}

SubscriptionViewer.CONFIG = {
	displayName: 'Reddit Subscriptions',
	itemsPerPage: Constants.Subscription.PER_PAGE,
	canSort: true
};

module.exports = SubscriptionViewer;
