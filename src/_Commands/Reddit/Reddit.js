const Constants = require('../../Constants/Reddit');
const RedditPost    = require('./Post');
const RedditComment = require('./Comment');
const RedditViewer  = require('./RedditViewer');
const RedditSubscription = require('./Subscription');
const SubscriptionViewer = require('./SubscriptionViewer');
const {fetch,RSS} = require('../../Utils');

const RIPSAVE = 'https://ripsave.com';
const LEWLA = 'https://lew.la/reddit';

class Reddit {
	static async GET(href, opts = {}) {
		if (!href.startsWith('/')) {
			href = '/' + href;
		}
		if (!href.endsWith('/')) {
			href = href + '/';
		}
		return fetch(Constants.URL + href + '.json', opts);
	}
	static async getSubreddit(subreddit, options = {}) {
		if (!subreddit) subreddit = 'random';
		options.type  = Constants.TYPES.includes(options.type) ? options.type : Constants.TYPES[0];
		options.time  = Constants.TIME.includes(options.time) ? options.time : Constants.TIME[2];
		options.limit = options.limit || 100;
		
		let response = await this.GET(`/r/${subreddit}/${options.type}/`, {
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
	static async getPost(subreddit, id) {
		let response = await this.GET(`/r/${subreddit}/comments/${id}/`);
		return new RedditPost(response[0].data);
	}
	static async getComments(subreddit = 'random', postID, limit = 100) {
		let response, comments;
		if (postID) {
			response = await this.GET(`/r/${subreddit}/comments/${postID}/`, {qs:{limit}});
			comments = response[1].data.children;
		} else {
			response = await this.GET(`/r/${subreddit}/comments/`, {qs:{limit}});
			comments = response[0].data.children;
		}
		
		return comments.map(c => new RedditComment(c.data));
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
	static parseLink(link) {
		let match = link.match(/\/r\/([^\/\s]+)\/?(comments)?\/?([^\/\s]+)?/);
		if (match) return [match[1],match[3]];
		match = link.match(/v\.redd\.it\/([^\/\s]+)/);
		if (match) return ['?',match[1]];
		throw 'Invalid Reddit link.';
	}
	static async downloadVideo(video) {
		if (typeof(video) !== 'object') {
			let id = this.parseLink(video)[1];
			video = {
				id: id,
				url: 'https://v.redd.it/' + id
			};
		}
		try {
			return await getLewlaDownload(video);
		} catch (e) {
			console.log(e);
		}
		try {
			return await getRipsaveDownload(video);
		} catch (e) {
			console.log(e);
		}
		// Cannot download from third-party websites, falling back to v.redd.it
		return video.url + '/DASH_1080?source=fallback';
	}
}

async function getLewlaDownload(video) {
	let res = await fetch(LEWLA + '/download', {qs: {url: video.url}});
	if (res) {
		return `${LEWLA}/clips/${res}.mp4`;
	} else {
		throw 'Unable to get download via lew.la.';
	}
}
async function getRipsaveDownload(video) {
	for (let quality of ['1080','720','480','360','240','96']) {
		try {
			let res = await fetch(RIPSAVE + '/genlink', {
				qs: {
					s:  'reddit',
					v:  video.url + '/DASH_' + quality,
					a:  video.url + '/audio',
					id: video.id,
					q:  quality,
					t:  video.id
				}
			});
			if (res) {
				return `${RIPSAVE}/download?t=${video.id}&f=${video.id}_${quality}.mp4`;
			} else {
				throw res;
			}
		} catch (e) {
			console.log(e);
		}
	}
	throw 'Unable to get download via ripsave.com.';
}

Reddit.Post = RedditPost;
Reddit.Comment = RedditComment;
Reddit.Viewer = RedditViewer;
Reddit.Subscription = RedditSubscription;

module.exports = Reddit;
