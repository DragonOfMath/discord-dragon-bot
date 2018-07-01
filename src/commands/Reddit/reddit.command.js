const {random} = require('../../Utils');
const {Reddit,RedditSubscription} = require('./Reddit');

function noPostsFound(posts) {
	if (posts.length == 0) {
		throw 'No posts found. Try a different sub?';
	}
	return posts;
}

module.exports = {
	'reddit': {
		category: 'Fun',
		title: 'Reddit',
		info: 'Retrieve a random reddit post from a sub of your choice or one at random.',
		parameters: ['[subreddit]'],
		permissions: 'inclusive',
		fn({client, arg, channel}) {
			return Reddit.getSubreddit(arg)
			.then(noPostsFound)
			.then(random)
			.then(post => Reddit.embed(post));
		},
		subcommands: {
			'new': {
				title: 'Reddit | New',
				info: 'Get the newest posts of a subreddit.',
				parameters: ['[subreddit]'],
				fn({client, arg, channel}) {
					return Reddit.getSubreddit(arg, {
						type: 'new'
					})
					.then(noPostsFound)
					.then(random)
					.then(post => Reddit.embed(post));
				}
			},
			'rising': {
				title: 'Reddit | Rising',
				info: 'Get the rising posts of a subreddit.',
				parameters: ['[subreddit]'],
				fn({client, arg, channel}) {
					return Reddit.getSubreddit(arg, {
						type: 'rising'
					})
					.then(noPostsFound)
					.then(random)
					.then(post => Reddit.embed(post));
				}
			},
			'top': {
				title: 'Reddit | Top',
				info: 'Get the top posts of a subreddit from the last __day__, __week__, __month__, __year__, or from __all__ time.',
				parameters: ['[subreddit]', '[filter]'],
				fn({client, args, channel}) {
					return Reddit.getSubreddit(args[0], {
						type: 'top',
						time: args[1]
					})
					.then(noPostsFound)
					.then(random)
					.then(post => Reddit.embed(post));
				}
			},
			'controversial': {
				title: 'Reddit | Controversial',
				info: 'Get the controversial posts of a subreddit from the last __day__, __week__, __month__, __year__, or from __all__ time.',
				parameters: ['[subreddit]', '[filter]'],
				fn({client, args}) {
					return Reddit.getSubreddit(args[0], {
						type: 'controversial',
						time: args[1]
					})
					.then(noPostsFound)
					.then(random)
					.then(post => Reddit.embed(post));
				}
			},
			'gilded': {
				aliases: ['golden'],
				title: 'Reddit | Gilded',
				info: 'Get gilded posts of a subreddit from the last __day__, __week__, __month__, __year__, or from __all__ time.',
				parameters: ['[subreddit]', '[filter]'],
				fn({client, args}) {
					return Reddit.getSubreddit(args[0], {
						type: 'gilded',
						time: args[1]
					})
					.then(noPostsFound)
					.then(random)
					.then(post => Reddit.embed(post));
				}
			},
			'subbed': {
				aliases: ['listsubs','listsubscriptions','listsubbed','subbed'],
				title: 'Reddit | Subscribed Subreddits',
				info: 'List subreddits this channel is currently subscribed to.',
				fn({client, channelID, serverID}) {
					var channel = client.database.get('channels').get(channelID);
					var sub = new RedditSubscription(channel.reddit);
					return sub.toString() || 'This channel is not subscribed to any subreddits.';
				}
			},
			'sub': {
				aliases: ['subscribe', 'add'],
				title: 'Reddit | Subscribe',
				info: 'Subscribe to new posts from a subreddit and see them posted in this channel periodically.',
				parameters: ['...subreddits'],
				fn({client, args, channelID, serverID}) {
					client.database.get('channels').modify(channelID, channel => {
						channel.reddit = new RedditSubscription(channel.reddit);
						channel.reddit.subscribe(...args);
						return channel;
					}).save();
					return 'This channel is now subscribed to:\n' + args.map(r => '/r/'+r).join('\n');
				}
			},
			'unsub': {
				aliases: ['unsubscribe', 'remove'],
				title: 'Reddit | Unsubscribe',
				info: 'Unsubscribe from a subreddit this channel is subscribed to.',
				parameters: ['...subreddits'],
				fn({client, args, channelID}) {
					client.database.get('channels').modify(channelID, channel => {
						channel.reddit = new RedditSubscription(channel.reddit);
						channel.reddit.unsubscribe(...args);
						return channel;
					}).save();
					return 'This channel is now unsubscribed from:\n' + args.map(r => '/r/'+r).join('\n');
				}
			},
			'enable': {
				aliases: ['disable','toggle'],
				title: 'Reddit | Enable/Disable Subscription Service',
				info: 'Toggle the use of the subscription service for this channel.',
				fn({client, channelID}) {
					var active = false;
					client.database.get('channels').modify(channelID, channel => {
						channel.reddit = new RedditSubscription(channel.reddit);
						active = channel.reddit.active = !channel.reddit.active;
						return channel;
					}).save();
					return `Subscription service for this channel is now **${active?'enabled':'disabled'}**.`;
				}
			},
			'polling': {
				aliases: ['pollinterval','polltime'],
				title: 'Reddit | Set Subscription Polling Interval',
				info: 'Sets the polling time in seconds for retrieving new posts. Lower means shorter waiting but higher traffic.',
				parameters: ['time'],
				fn({client, args, channelID}) {
					var t = Number(args[0]) * 1000;
					client.database.get('channels').modify(channelID, channel => {
						channel.reddit = new RedditSubscription(channel.reddit);
						channel.reddit.pollInterval = t;
						return channel;
					}).save();
					return `Polling interval set to **${t/1000} seconds**.`;
				}
			},
			'options': {
				aliases: ['subopts'],
				title: 'Reddit | Set Subscription Options',
				info: 'Set subscription options for this channel, which include what type of posts to get, in what time span, and how many posts to poll for.',
				parameters: ['type','[timespan]','[limit]'],
				fn({client, args, channelID}) {
					var [type, time = 'all', limit = 200] = args;
					limit = Number(limit);
					client.database.get('channels').modify(channelID, channel => {
						channel.reddit = new RedditSubscription(channel.reddit);
						channel.reddit.options.type  = type;
						channel.reddit.options.time  = time;
						channel.reddit.options.limit = limit;
						return channel;
					}).save();
					return 'Options saved.';
				}
			}
		}
	}
};
