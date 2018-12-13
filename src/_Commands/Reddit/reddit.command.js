const Reddit    = require('./Reddit');
const Constants = require('../../Constants/Reddit');
const {random}  = require('../../Utils');

module.exports = {
	'reddit': {
		category: 'Fun',
		title: 'Reddit',
		info: 'Retrieve reddit posts from a sub of your choice or one at random.\n**Post Types**: __hot__, __new__, __rising__, __top__, __controversial__, or __gilded__.\n**Time Ranges**: __day__, __week__, __month__, __year__, or from __all__ time.\nDefault flag values are `type=hot`, `time=all`, and `limit=200`.',
		parameters: ['[subreddit]'],
		flags: ['type','time','limit'],
		permissions: 'inclusive',
		fn({client, context, args, flags}) {
			let options = {
				type: flags.get('type') || 'hot',
				limit: flags.get('limit') || 200,
				time: flags.get('time') || 'all'
			};
			return Reddit.getSubreddit(args[0], options)
			.then(posts => {
				if (posts.length == 0) {
					throw 'No posts found. Try a different sub?';
				}
				let rv = new Reddit.Viewer(context, posts, options);
				rv.startBrowser(client);
			});
		},
		subcommands: {
			'subbed': {
				aliases: ['listsubs','listsubscriptions','listsubbed','subscriptions','subscribed'],
				title: 'Reddit | Subscribed Subreddits',
				info: 'List subreddits this channel is currently subscribed to.',
				fn({client, context, channelID}) {
					return Reddit.getSubscription(client, channelID).view(context);
				}
			},
			'sub': {
				aliases: ['subscribe', 'add'],
				title: 'Reddit | Subscribe',
				info: 'Subscribe to new posts from a subreddit and see them posted in this channel periodically.',
				parameters: ['...subreddits'],
				fn({client, args, channelID, serverID}) {
					return Reddit.modifySubscription(client, channelID, subscription => {
						subscription.subscribe(...args);
						return 'This channel is now subscribed to:\n' + args.map(r => '/r/'+r).join('\n');
					});
				}
			},
			'unsub': {
				aliases: ['unsubscribe', 'remove'],
				title: 'Reddit | Unsubscribe',
				info: 'Unsubscribe from a subreddit this channel is subscribed to.',
				parameters: ['...subreddits'],
				fn({client, args, channelID}) {
					return Reddit.modifySubscription(client, channelID, subscription => {
						subscription.unsubscribe(...args);
						return 'This channel is now unsubscribed from:\n' + args.map(r => '/r/'+r).join('\n');
					});
				}
			},
			'enable': {
				aliases: ['disable','toggle'],
				title: 'Reddit | Enable/Disable Subscription Service',
				info: 'Toggle the use of the subscription service for this channel.',
				fn({client, channelID}) {
					return Reddit.modifySubscription(client, channelID, subscription => {
						subscription.active = !subscription.active;
						return `Subscription service for this channel is now **${subscription.active?'enabled':'disabled'}**.`;
					});
				}
			},
			'options': {
				aliases: ['subopts'],
				title: 'Reddit | Subscription Options',
				info: 'Set subscription options for this channel, which include what type of posts to get, in what time span, and how many posts to poll for.\n * `-polling` is the interval in seconds between fetching posts.\n * `-type` must be either hot, new, rising, top, controversial, or gilded.\n * `-time` must be either hour, day, week, month, year, or all.\n * `-limit` is the number of posts to fetch.\n * `-threshold` is the minimum post score.\n * `-crossposts` is to allow crossposting between shared subreddits.\n * `-media` is a comma-separated string for allowing post types: text, image, video, and other.',
				flags: ['polling|interval','type','time','limit','threshold','crossposts|xposts','media'],
				fn({client, flags, channelID}) {
					if (!flags.size) {
						return Reddit.getSubscription(client, channelID).embed();
					}
					return Reddit.modifySubscription(client, channelID, subscription => {
						if (flags.has('polling')) {
							subscription.pollInterval = Number(flags.get('polling')) * 1000;
						}
						if (flags.has('type') && Constants.TYPES.includes(flags.get('type'))) {
							subscription.options.type = flags.get('type');
						}
						if (flags.has('time') && Constants.TIME.includes(flags.get('time'))) {
							subscription.options.time = flags.get('time');
						}
						if (flags.has('limit')) {
							subscription.options.limit = Number(flags.get('limit')) || subscription.options.limit;
						}
						if (flags.has('threshold')) {
							subscription.options.threshold = Number(flags.get('threshold')) || subscription.options.threshold;
						}
						if (flags.has('crossposts')) {
							subscription.options.crossposts = Boolean(flags.get('crossposts'));
						} else if (flags.has('xposts')) {
							subscription.options.crossposts = Boolean(flags.get('xposts'));
						}
						if (flags.has('media')) {
							for (let type in subscription.options.media) {
								subscription.options.media[type] = false;
							}
							for (let type of flags.get('media').split(',')) {
								if (type in subscription.options.media) {
									subscription.options.media[type] = true;
								}
							}
						}
						
						return 'Subscription settings updated.';
					});
				}
			},
			'status': {
				aliases: ['isitdown'],
				title: 'Reddit Status',
				info: 'Check the health status of reddit.',
				fn() {
					return Reddit.getStatus();
				}
			}
		}
	}
};
