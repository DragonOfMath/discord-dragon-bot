const Resource = require('../../Resource');
//const Subscription = require('../../Subscription');
const {fetch,truncate,unescapeHTMLEntities} = require('../../Utils');

const TYPE = ['','hot','new','rising','top','controversial']; // '' and 'hot' are the same
const TIME = ['hour','day','week','month','year','all'];
const REDDIT = 'https://www.reddit.com';
const COLOR = 0xd25a32;
const SUBSCRIPTION_TEMPLATE = {
	pollInterval: 60000,
	lastPollTime: (t) => t || Date.now(),
	active: true,
	options: {
		type: 'hot',
		time: 'all',
		limit: 200
	},
	subs: {}
};

const VIDEO_DOMAINS = ['v.redd.it','gfycat.com','youtube.com','youtu.be'];
const VIDEO_FORMATS = ['.gifv','.mp4','.webm'];
const IMAGE_DOMAINS = ['i.redd.it','i.reddituploads.com','imgur.com','i.imgur.com'];
const IMAGE_FORMATS = ['.png','.jpg','.jpeg','.gif'];

class Reddit {
	static getSubreddit(sr, options = {}) {
		if (!sr) sr   = 'random';
		options.type  = TYPE.includes(options.type) ? options.type : TYPE[0];
		options.time  = TIME.includes(options.time) ? options.time : TIME[2];
		options.limit = options.limit || 100;
		var url = `${REDDIT}/r/${sr}/${options.type}.json`;
		return fetch(url, {
			qs: {t: options.time, limit: options.limit}
		})
		// extract the posts
		.then(response => response.data.children.map(c => c.data))
		// filter out sticked posts/announcements
		.then(posts => posts.filter(p => !p.stickied))
		// sort posts by ID descending
		.then(posts => posts.sort((a,b) => (a.id<b.id)-(a.id>b.id)));
	}
	static getPost(sr, id) {
		var url = `${REDDIT}/r/${sr}/comments/${id}/.json`;
		return fetch(url)
		.then(response => response[0].data);
	}
	static isImage(post) {
		var filePart = post.url.split('/').pop();
		return IMAGE_DOMAINS.includes(post.domain) || IMAGE_FORMATS.some(f => filePart.includes(f));
	}
	static isVideo(post) {
		var filePart = post.url.split('/').pop();
		return VIDEO_DOMAINS.includes(post.domain) || VIDEO_FORMATS.some(f => filePart.includes(f));
	}
	static isXpost(post) {
		return post.domain && post.domain.includes('reddit.com');
	}
	static getImgurImages(post) {
		if (post.url.includes('/a/') || post.url.includes('/gallery/')) {
			return post.preview.images.map(i => i.source.url);
		} else {
			return 'https://i.imgur.com/' + post.url.split('/').pop() + '.jpg'; // .png, .jpg, doesn't matter
		}
	}
	static embed(post) {
		if (typeof(post.subreddit) === 'undefined' || typeof(post.author) === 'undefined') {
			console.error(post);
		}
		var e = {
			title: `[/r/${post.subreddit||'[deleted]'}] ${post.over_18 ? '[NSFW]' : ''} ${truncate(post.title, 180)} - by ${('/u/'+post.author)||'[deleted]'}`,
			description: '',
			color: COLOR,
			footer: {
				text: new Date(post.created * 1000).toLocaleString()
			}
		};
		if (post.score) {
			e.description += `${post.score<0?':arrow_down:':':arrow_up:'} ${post.score}`;
		}
		if (post.gilded) {
			e.description += ' | <:redditgold:303781934813675520> ' + post.gilded;
		}
		if (post.num_comments) {
			e.description += ' | :speech_balloon: ' + post.num_comments;
		}
		if (post.url) {
			post.url = unescapeHTMLEntities(post.url);
			if (/^http/.test(post.url)) {
				e.url = post.url;
			}
		}
		if (post.permalink) {
			post.permalink = REDDIT + post.permalink;
			if (post.permalink != post.url) {
				e.description += ` | [Permalink](${post.permalink})`;
			}
		}
		if (post.spoiler) {
			e.description += '\n\n' + '**Spoiler alert!** This post may contain spoilers, so please click the permalink.';
			
		} else if (post.is_self) {
			e.description += '\n\n' + truncate(post.selftext, 1800);
			
		} else if (this.isVideo(post)) {
			e.description += '\n\n' + '**Cannot embed video.** :confused:';
			e.video = {
				url: post.url
			};
			
		} else if (this.isXpost(post)) {
			e.description += '\n\n' + '**Cannot embed X-post.** :confused:';
			
		} else if (this.isImage(post)) {
			// stupid imgur embed fix
			if (post.domain == 'imgur.com') {
				// stupid imgur album embed workaround
				var images = this.getImgurImages(post);
				if (images instanceof Array) {
					e.description += '\n\n' + `This Imgur album contains **${images.length}** image(s). Click the permalink to view the full album.`;
					post.url = images[0];
				} else {
					post.url = images;
				}
			}
			e.image = {
				url: post.url
			};
			
		} else {
			// nothing else works
			e.description += '\n\n' + post.url;
		}
		return e;
	}
	static quickEmbed(post) {
		var e = {
			title: truncate(post.title, 180),
			url: post.permalink ? REDDIT + post.permalink : post.url,
			description: '',
			color: COLOR,
			timestamp: new Date(post.created * 1000),
			footer: {text: ''}
		};
		if (post.is_self) {
			e.description = truncate(post.selftext, 1800);
		} else if (this.isVideo(post)) {
			e.description = '**Video**: ' + post.url;
		} else if (this.isImage(post)) {
			// stupid imgur embed fix
			if (post.domain == 'imgur.com') {
				// stupid imgur album embed workaround
				var images = this.getImgurImages(post);
				if (images instanceof Array) {
					e.description = `Imgur Album: **${images.length}** image(s)`;
					post.url = images[0];
				} else {
					post.url = images;
				}
			}
			e.image = {
				url: post.url
			};
		} else {
			// nothing else works
			post.url = unescapeHTMLEntities(post.url);
			e.description = post.url;
		}
		return e;
	}
}

class RedditSubscription extends Resource {
	constructor(subscription = {}) {
		super(SUBSCRIPTION_TEMPLATE, subscription);
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
		return post.id == this.subs[post.subreddit.toLowerCase()];
	}
	updatePostCache(post) {
		this.subs[post.subreddit.toLowerCase()] = post.id;
	}
	poll() {
		return Reddit.getSubreddit(this.toRedditString(), this.options)
		.then(posts => {
			// eliminate crossposting to avoid as many duplicates as possible
			// eliminate posts below a score threshold
			posts = posts.filter(post => !Reddit.isXpost(post) && post.score > 0);
			if (!posts.length) return undefined;
			
			// group the posts by subreddit
			var subreddits = {};
			for (var post of posts) {
				var sub = post.subreddit;
				subreddits[sub] = subreddits[sub] || [];
				subreddits[sub].push(post);
			}
			
			// find the next post of each subreddit pool
			var selectedPosts = [];
			for (var sub in subreddits) {
				var cache = this.subs[sub.toLowerCase()];
				var pool  = subreddits[sub].filter(post => !cache || post.id > cache);
				var next  = pool.pop();
				if (next && next.id != cache) {
					//console.log(`Next post from ${sub}: ${next.id} (previous: ${cache})`);
					selectedPosts.push(next);
				}
			}
			
			return selectedPosts;
		});
	}
	toString() {
		return Object.keys(this.subs).map(r => '/r/'+r).join(', ');
	}
	toRedditString() {
		return Object.keys(this.subs).join('+');
	}
}

module.exports = {
	Reddit,
	RedditSubscription
};
