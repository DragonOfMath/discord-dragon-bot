const Constants = require('../../Constants/Reddit');
const RedditPost = require('./Post');
const RedditViewer = require('./RedditViewer');
const RedditSubscription = require('./Subscription');
const SubscriptionViewer = require('./SubscriptionViewer');
const {fetch,RSS} = require('../../Utils');

class Reddit {
	static async getSubreddit(sr, options = {}) {
		if (!sr) sr   = 'random';
		options.type  = Constants.TYPES.includes(options.type) ? options.type : Constants.TYPES[0];
		options.time  = Constants.TIME.includes(options.time) ? options.time : Constants.TIME[2];
		options.limit = options.limit || 100;
		
		let url = `${Constants.URL}/r/${sr}/${options.type}.json`;
		let response = await fetch(url, {
			qs: {t: options.time, limit: options.limit}
		});
		
		let posts = response.data.children
			// extract the posts
			.map(c => new RedditPost(c.data))
			// filter out sticked posts/announcements
			.filter(p => !p.stickied)
			// sort posts by ID descending
			.sort((a,b) => (a.id<b.id)-(a.id>b.id));
		
		return posts;
	}
	static async getPost(sr, id) {
		let url = `${Constants.URL}/r/${sr}/comments/${id}/.json`;
		let response = await fetch(url);
		return new RedditPost(response[0].data);
	}
	static async getStatus() {
		return RSS(Constants.STATUS_URL)
		.then(incident => {
			incident.color = Constants.COLOR;
			return incident;
		});
	}
	static getSubscription(client, channel) {
		channel = channel.id || channel;
		let channelData = client.database.get('channels').get(channel);
		return new RedditSubscription(channelData.reddit);
	}
	static modifySubscription(client, channel, fn) {
		let message;
		channel = channel.id || channel;
		client.database.get('channels').modify(channel, channelData => {
			channelData.reddit = new RedditSubscription(channelData.reddit);
			message = fn(channelData.reddit);
			return channelData;
		}).save();
		return message;
	}
	static link(subreddit, post) {
		if (post) {
			return `${Constants.URL}/r/${subreddit}/comments/${post}`;
		} else {
			return `${Constants.URL}/r/${subreddit}`;
		}
	}
}

Reddit.Post = RedditPost;
Reddit.Viewer = RedditViewer;
Reddit.Subscription = RedditSubscription;

module.exports = Reddit;
