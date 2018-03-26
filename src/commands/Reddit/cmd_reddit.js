const {random,fetch} = require('../../Utils');
const Subreddits = require('./reddit.json');

function truncate(x, maxlen) {
	if (x.length < maxlen) {
		return x;
	} else {
		return x.substring(0, maxlen - 3) + '...';
	}
}

function embed(post) {
	var e = {
		title: `[/r/${post.subreddit}] ${truncate(post.title, 180)} - by ${post.author}`,
		color: 0xd25a32,
		url: post.url,
		description: `${post.score<0?':arrow_down:':':arrow_up:'} ${post.score}`,
		footer: {
			text: new Date(post.created * 1000).toLocaleString()
		}
	};
	if (post.gilded) {
		e.description += ' | <:redditgold:303781934813675520> ' + post.gilded;
	}
	if (post.num_comments) {
		e.description += ' | :speech_balloon: ' + post.num_comments;
	}
	
	post.permalink = `https://www.reddit.com${post.permalink}`;
	if (post.url != post.permalink) {
		e.description += ` | [Permalink](${post.permalink})`;
	}
	if (post.spoiler) {
		e.description += '\n\n' + '**Spoiler alert!** This post contains spoilers, so please click the permalink.';
	} else {
		if (post.is_self) {
			e.description += '\n\n' + truncate(post.selftext, 1800);
		} else if (post.domain == 'v.redd.it' || post.domain == 'gfycat.com' || post.url.endsWith('.gifv') || post.domain == 'youtube.com' || post.domain == 'youtu.be') {
			e.description += '\n\n' + '**Cannot embed video.** :confused:';
			e.video = {
				url: post.url
			};
		} else if (post.domain.includes('reddit.com')) {
			e.description += '\n\n' + '**Cannot embed X-post.** :confused:';
		} else {
			// stupid imgur embed fix
			if (post.domain == 'imgur.com') {
				// stupid imgur album embed workaround
				if (post.url.includes('/a/') || post.url.includes('/gallery/')) {
					var images = post.preview.images;
					e.description += '\n\n' + `This Imgur album contains **${images.length}** image(s). Click the permalink to view the full album.`;
					post.url = images[0].source.url;
				} else {
					post.url = 'https://i.imgur.com/' + post.url.split('/').pop() + '.jpg'; // .png, .jpg, doesn't matter
				}
			}
			e.image = {
				url: post.url
			};
		}
	}
	if (post.over_18) {
		// TODO: use the nsfw property to ensure nsfw content doesn't get posted in safe channels
		e.description += '\n\n' + '**NSFW!** You must be 18+ or older to view this post. If this Channel is not marked NSFW, you should delete this.'
	} 
	return e;
}

function Reddit(sr, filter = '', t = '', limit = 100) {
	if (!sr) sr = random(Subreddits);
	var url = `https://www.reddit.com/r/${sr}/${filter}.json?limit=${limit}`;
	if (['hour','day','week','month','year','all'].includes(t)) url += `&t=${t}`;
	else url += '&t=week';
	return fetch(url)
	.then(response => {
		if (typeof(response) === 'object') {
			return response;
		} else {
			return JSON.parse(response);
		}
	})
	.then(response => {
		if (response.data.children.length == 0) {
			throw 'No posts found. Try a different sub?';
		}
		return random(response.data.children).data;
	}).then(embed);
}

module.exports = {
	'reddit': {
		aliases: ['rdt','/r/'],
		category: 'Fun',
		title: 'Reddit',
		info: 'Retrieve a random reddit post from a sub of your choice or one at random.',
		parameters: ['[subreddit]'],
		fn({client, arg, channel}) {
			return Reddit(arg);
		},
		subcommands: {
			'new': {
				title: 'Reddit | New',
				info: 'Get the newest posts of a subreddit.',
				parameters: ['[subreddit]'],
				fn({client, arg, channel}) {
					return Reddit(arg, 'new');
				}
			},
			'rising': {
				title: 'Reddit | Rising',
				info: 'Get the rising posts of a subreddit.',
				parameters: ['[subreddit]'],
				fn({client, arg, channel}) {
					return Reddit(arg, 'rising');
				}
			},
			'top': {
				title: 'Reddit | Top',
				info: 'Get the top posts of a subreddit from the last __day__, __week__, __month__, __year__, or from __all__ time.',
				parameters: ['[subreddit]', '[filter]'],
				fn({client, args, channel}) {
					return Reddit(args[0], 'top', args[1]);
				}
			},
			'controversial': {
				title: 'Reddit | Controversial',
				info: 'Get the controversial posts of a subreddit from the last __day__, __week__, __month__, __year__, or from __all__ time.',
				parameters: ['[subreddit]', '[filter]'],
				fn({client, args, channel}) {
					return Reddit(args[0], 'controversial', args[1]);
				}
			}
		}
	}
};
