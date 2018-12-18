const SubscriptionViewer = require('./SubscriptionViewer');
const Resource  = require('../../Structures/Resource');
const Constants = require('../../Constants/Reddit');
const {Array,Format:fmt,wait} = require('../../Utils');

function allowed(x) {
	return x ? 'allowed' : 'ignored';
}

class RedditSubscription extends Resource {
	constructor(subscription = {}) {
		super(Constants.Subscription.TEMPLATE, subscription);
	}
	get feed() {
		return `${Constants.URL}/r/${this.toRedditString()}`;
	}
	get subreddits() {
		return Object.keys(this.subs);
	}
	subscribe(...subs) {
		for (var sub of subs) {
			sub = sub.toLowerCase();
			this.subs[sub] = '';
		}
		return this;
	}
	unsubscribe(...subs) {
		for (var sub of subs) {
			sub = sub.toLowerCase();
			delete this.subs[sub];
		}
		return this;
	}
	checkPostCache(post) {
		return post.id <= this.subs[post.subreddit.toLowerCase()];
	}
	updatePostCache(post) {
		this.subs[post.subreddit.toLowerCase()] = post.id;
		let parent = post.crosspost;
		if (parent && parent.subreddit.toLowerCase() in this.subs) {
			//console.log('updating parent post of crosspost');
			this.updatePostCache(parent);
		}
	}
	async poll() {
		this.lastPollTime = Date.now();
		let posts = [];
		
		do {
			try {
				posts = await require('./Reddit').getSubreddit(this.toRedditString(), this.options);
				break;
			} catch (e) {
				if (e.code == 'ENOTFOUND') {
					// somehow the dns lookup for reddit breaks a lot, so try again
					await wait(5000);
				} else {
					// if there was a different error involved, then don't get any posts.
					console.error('Unable to get reddit posts: ' + e);
					return [];
				}
			}
		} while (true);
		
		posts = posts.filter(post => {
			// post score must be positive
			if (post.score < this.options.threshold) return false;
			
			// post must not already be visited
			if (this.checkPostCache(post)) return false;
			
			// if crossposting is not allowed, then avoid crossposts
			if (!this.options.crossposting) {
				// if a crosspost, it must not be from an already visited post
				let parent = post.crosspost;
				if (parent && this.checkPostCache(parent)) return false;
			}
			
			// post type must be allowed
			if (post.is_self)
				return this.options.media.text;
			else if (post.isImage)
				return this.options.media.image;
			else if (post.isVideo)
				return this.options.media.video;
			else
				return this.options.media.other;
		});
		if (!posts.length) return;
		
		// group the posts by subreddit
		let subreddits = Array.groupBy(posts, post => post.subreddit);
		
		// find the next post of each subreddit pool
		let newPosts = [], lastPostID, newSubPosts, nextPost;
		for (let sub in subreddits) {
			// get the ID of the last used post for this subreddit
			lastPostID  = this.subs[sub.toLowerCase()];
			
			// find posts with an ID newer than the last post ID
			newSubPosts = lastPostID ? subreddits[sub].filter(post => post.id > lastPostID) : subreddits[sub];
			
			// use the last newest post (the oldest of the newest, if that makes sense)
			nextPost    = newSubPosts[newSubPosts.length - 1];
			if (nextPost && nextPost.id != lastPostID) {
				//console.log(`Next post from ${sub}: ${nextPost.id} (previous: ${lastPostID})`);
				newPosts.push(nextPost);
			}
		}
		
		return newPosts;
	}
	async view(context) {
		if (!this.subreddits.length) {
			return 'This channel is not subscribed to any subreddits.';
		}
		let sv = new SubscriptionViewer(context, this);
		await sv.startBrowser(context.client);
	}
	toString() {
		return Object.keys(this.subs).map(r => '/r/'+r).join(', ');
	}
	toRedditString() {
		return Object.keys(this.subs).join('+');
	}
	embed() {
		return {
			color: Constants.COLOR,
			fields: [
				{
					name: 'Subreddits',
					value: String(this.subreddits.length),
					inline: true
				},
				{
					name: 'Polling',
					value: this.active ? `${fmt.plural('post',this.options.limit)} every ${fmt.time(this.pollInterval)}` : 'disabled',
					inline: true
				},
				{
					name: 'Last Poll Time',
					value: new Date(this.lastPollTime).toLocaleString(),
					inline: true
				},
				{
					name: 'Post Filter',
					value: `>=${fmt.plural('point',this.options.threshold)} from ${this.options.type}/${this.options.time}`,
					inline: true
				},
				{
					name: 'Post Media Types',
					value: Object.keys(this.options.media).map(k => `${k}: ${allowed(this.options.media[k])}`).join('\n'),
					inline: true
				},
				{
					name: 'Crossposting',
					value: allowed(this.options.crossposts),
					inline: true
				}
			]
		}
	}
}

module.exports = RedditSubscription;
