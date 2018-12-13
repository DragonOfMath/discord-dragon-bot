const Constants = require('../../Constants/Reddit');
const {truncate,unescapeHTMLEntities} = require('../../Utils');

class RedditPost {
	constructor(post) {
		Object.assign(this, post);
		
		if (this.url) {
			this.url = unescapeHTMLEntities(this.url);
		}
		if (this.permalink) {
			this.permalink = Constants.URL + this.permalink;
		}
	}
	get timestamp() {
		return new Date(this.created * 1000);
	}
	get isImage() {
		if (this.post_hint == 'image') {
			return true;
		}
		var filePart = this.url.split('/').pop();
		return Constants.Post.IMAGE_DOMAINS.includes(this.domain) || Constants.Post.IMAGE_FORMATS.some(f => filePart.includes(f));
	}
	get isVideo() {
		if (this.post_hint == 'video') {
			return true;
		}
		var filePart = this.url.split('/').pop();
		return Constants.Post.VIDEO_DOMAINS.includes(this.domain) || Constants.Post.VIDEO_FORMATS.some(f => filePart.includes(f));
	}
	get crosspost() {
		return this.crosspost_parent_list && this.crosspost_parent_list[0];
	}
	embed(minimal = false) {
		if (typeof(this.subreddit) === 'undefined' || typeof(this.author) === 'undefined') {
			console.error('Undefined post\n', this);
		}
		let e = {
			color: Constants.COLOR,
			timestamp: this.timestamp
		};
		if (this.url && /^http/.test(this.url)) {
			e.url = this.url;
		}
		
		if (minimal) {
			e.title = truncate(this.title, 180);
			e.url   = this.permalink || this.url;
			if (this.is_self) {
				e.description = truncate(this.selftext, 1800);
			} else if (this.isVideo) {
				//e.video = {url: this.url};
				e.description = '**Video**: ' + this.url;
			} else if (this.isImage) {
				// stupid imgur embed fix
				if (this.domain.includes('imgur.com')) {
					// stupid imgur album embed workaround
					var images = getImgurImages(this);
					if (images instanceof Array) {
						e.description = `Imgur Album: **${images.length}** image(s)`;
						this.url = images[0];
					} else {
						this.url = images;
					}
				}
				e.image = {url: this.url};
			} else {
				if (this.thumbnail) {
					e.thumbnail = {url:this.thumbnail};
				}
				e.description = this.url;
			}
			
		} else {
			e.title = `[/r/${this.subreddit||'[deleted]'}] ${this.over_18 ? '🔞' : ''} ${truncate(this.title, 180)} - by ${('/u/'+this.author)||'[deleted]'}`;
			e.description = '';
			
			if (this.score) {
				e.description += `${this.score<0?'⬇':'⬆'} ${this.score}`;
			}
			if (this.gilded) {
				e.description += ` | ${Constants.Post.GILDED} ${this.gilded}`;
			}
			if (this.num_comments) {
				e.description += ' | 💬 ' + this.num_comments;
			}
			
			if (this.permalink && this.permalink != this.url) {
				e.description += ` | [Permalink](${this.permalink})`;
			}
			
			if (this.spoiler) {
				e.description += '\n\n' + '**Spoiler alert!** This this may contain spoilers, so please click the permalink.';
				
			} else if (this.is_self) {
				e.description += '\n\n' + truncate(this.selftext, 1000);
				
			} else if (this.isVideo) {
				e.description += '\n\n' + '**Cannot embed video.** :confused:';
				e.video = { url: this.url };
					
			} else if (this.isImage) {
				// stupid imgur embed fix
				if (this.domain.includes('imgur.com')) {
					// stupid imgur album embed workaround
					var images = getImgurImages(this);
					if (images instanceof Array) {
						e.description += '\n\n' + `This Imgur album contains **${images.length}** image(s). Click the permalink to view the full album.`;
						this.url = images[0];
					} else {
						this.url = images;
					}
				}
				e.image = {url: this.url};
				
			} else {
				if (this.thumbnail) {
					e.thumbnail = {url:this.thumbnail};
				}
				e.description += '\n\n' + this.url;
			}
		}

		return e;
	}
}

// TODO: fix getting gallery images
function getImgurImages(post) {
	if (post.url.includes('/a/') || post.url.includes('/gallery/')) {
		if (post.preview) {
			return post.preview.images.map(img => img.source.url);
		} else {
			// now how am I supposed to get images?
			console.log('Post preview is undefined', post);
			return post.url;
		}
	} else if (post.domain == 'i.imgur.com') {
		return post.url;
	} else {
		return 'https://i.imgur.com/' + post.url.split('/').pop() + '.jpg'; // .png, .jpg, doesn't matter
	}
}

module.exports = RedditPost;
