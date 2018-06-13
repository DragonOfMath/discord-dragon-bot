const {Reddit,RedditSubscription} = require('./Reddit'); 
const {forEachAsync,random} = require('../../Utils');

var busy = false;

module.exports = {
	id: 'reddit',
	title: '',
	info: 'Assists with reddit-related things such as /r/cats or /u/waterguy12, and provides subscription service.',
	data: {
		m: []
	},
	permissions: {
		type: 'public'
	},
	resolver({message}) {
		var matches = message.match(/^\/?([ru]\/[\w\d_]+)$/);
		if (matches) {
			this.data.m = matches[1];
			return 'r';
		}
	},
	events: {
		r() {
			return 'https://reddit.com/' + this.data.m;
		},
		// run a scheduler for polling reddit subscriptions
		tick(client) {
			// prevent overlapping async requests
			if (busy) return;
			busy = true;
			
			var channelTable = client.database.get('channels');
			var now = Date.now();
			var change = false;
			forEachAsync.call(channelTable.entries(), ([channelID, channel]) => {
				var r = channel.reddit;
				if (r && r.active && Object.keys(r.subs).length && now - r.lastPollTime > r.pollInterval) {
					channel.reddit = new RedditSubscription(r);
					channel.reddit.lastPollTime = now;
					change = true;
					return channel.reddit.poll()
					.then(posts => {
						if (posts && posts.length) {
							var post = random(posts);
							channel.reddit.updatePostCache(post);
							client.log('Posting subscription to ' + post.subreddit + ' in ' + channelID);
							var embed = Reddit.quickEmbed(post);
							embed.footer.text = channel.reddit.options.type + ' post from /r/' + post.subreddit;
							return client.send(channelID, '', embed);
						}
					});
				}
			})
			.catch(e => {
				client.error(e);
			})
			.then(() => {
				if (change) channelTable.save();
				busy = false;
			});
		}
	}
};

