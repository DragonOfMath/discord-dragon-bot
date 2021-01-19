const Reddit = require('./Reddit'); 
const Constants = require('../../Constants/Reddit');
const {Array,random} = require('../../Utils');

var busy = false;

module.exports = {
	id: 'reddit',
	title: '',
	info: 'Assists with reddit-related things such as /r/cats or /u/waterguy12, and handles subscriptions.',
	data: {
		m: []
	},
	permissions: 'public',
	resolver({message}) {
		let matches = message.match(/^\/?([ru]\/[\w\d_]+)$/);
		if (matches) {
			this.data.m = matches[1];
			return 'r';
		}
	},
	events: {
		r() {
			return `${Constants.URL}/${this.data.m}`;
		},
		// run a scheduler for polling reddit subscriptions
		tick(client) {
			// prevent overlapping async requests
			if (busy) return;
			busy = true;
			
			let channelTable = client.database.get('channels');
			let change = false;
			
			channelTable.entries().forEachAsync(async ([channelID, channel]) => {
				if (!(channelID in client.channels)) {
					client.notice(`Reddit Subscription: terminating subscription for ${channelID} because channel was deleted`);
					channelTable.delete(channelID);
					change = true;
					return;
				}
				if (!channel.reddit) return;
				if (!(channel.reddit instanceof Reddit.Subscription)) {
					channel.reddit = new Reddit.Subscription(channel.reddit);
				}
				subscription = channel.reddit;
				if (subscription.active && subscription.subreddits.length && Date.now() - subscription.lastPollTime > subscription.pollInterval) {
					change = true;
					
					let posts = await subscription.poll();
					if (!posts || !posts.length) return;
					
					// pick a random post
					let post = random(posts);
					subscription.updatePostCache(post);
					
					// create the embed
					let e = post.embed(true);
					e.footer = {
						text: subscription.options.type + ' post from /r/' + post.subreddit
					};
					
					client.log(`Reddit Subscription: posting ${post.id} from /r/${post.subreddit} to ${client.channels[channelID].name} (${channelID})`);
					return client.send(channelID, '', e);
				}
			})
			.catch(e => client.error(e))
			.then(() => {
				if (change) channelTable.save();
				busy = false;
			});
		}
	}
};

