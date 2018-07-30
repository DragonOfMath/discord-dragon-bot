const {Markdown:md,Format:fmt,fetch,truncate} = require('../../Utils');

const MB = 1048576;

const FIELD_PENDING = {
	name: '🤔 Pending',
	value: 'This post is pending approval from a moderator.'
};
const FIELD_LARGE_IMAGE = {
	name: 'Large File Size (>10MB)',
	value: 'This is a very large image file and may crash your browser when viewing it!'
};
const FIELD_SOUND_WARNING = {
	name: 'Sound',
	value: 'You should adjust your audio output before playing.'
};

const Endpoints = {
	post: {
		index: {
			url: '/post/index.json',
			params: ['tags','page','limit']
		},
		show: {
			url: '/post/show.json',
			params: ['id']
		},
		check_md5: {
			url: '/post/check_md5.json',
			params: ['md5']
		}
	},
	pool: {
		index: {
			url: '/pool/index.json',
			params: ['query','page']
		},
		show: {
			url: '/pool/show.json',
			params: ['id']
		}
	},
	tag: {
		index: {
			url: '/tag/index.json',
			params: ['limit','page','order','after_id','show_empty_tags','name','name_pattern']
		},
		show: {
			url: '/tag/show.json',
			params: ['id']
		},
		related: {
			url: '/tag/related.json',
			params: ['tags','type']
		},
		aliases: {
			url: '/tag_alias/index.json',
			params: ['page','order','query']
		},
		implications: {
			url: '/tag_implication/index.json',
			params: ['page','order','query']
		},
		history: {
			url: '/tag_history/index.json',
			params: ['post_id','date_start','date_end','user_id','user_name','source','tags','reason','description','limit','before','after']
		}
	},
	artist: {
		index: {
			url: '/artist/index.json',
			params: ['name','limit','order','page']
		}
	},
	comment: {
		index: {
			url: '/comment/index.json',
			params: ['post_id','page','status']
		},
		show: {
			url: '/comment/show.json',
			params: ['id']
		},
		search: {
			url: '/comment/search.json',
			params: ['query','results','date_start','date_end','order','post_id','page','user','user_id','status']
		},
	},
	wiki: {
		index: {
			url: '/wiki/index.json',
			params: ['query','page','order','limit']
		},
		show: {
			url: '/wiki/show.json',
			params: [' title','version']
		}
	},
	user: {
		index: {
			url: '/user/index.json',
			params: ['id','name','level','order']
		},
		show: {
			url: '/user/show.json',
			params: ['id','name']
		}
	},
	favorite: {
		list_users: {
			url: '/favorite/list_users.json',
			params: ['id']
		}
	}
};

class Artist {
	constructor(user) {
		if (typeof(user) === 'object') {
			this.id      = user.id;
			this.name    = user.name;
			this.aliases = user.other_names.split(', ');
			this.group   = user.group_name;
			this.active  = user.is_active;
			this.urls    = user.urls;
			this.version    = user.version;
			this.updater_id = user.updater_id;
		} else {
			this.name = user;
		}
	}
	get url() {
		return '/post?tags=' + this.name;
	}
}
class Media {
	constructor(url, width, height) {
		this.url    = url;
		this.width  = width;
		this.height = height;
	}
	get size() {
		return `${this.width}x${this.height}`;
	}
}
class Post {
	constructor(post) {
		this.id        = post.id;
		this.score     = post.score;
		this.faves     = post.fav_count;
		this.rating    = post.rating;
		this.status    = post.status;
		this.delreason = post.delreason;
		this.filesize  = post.file_size || 0; // in bytes
		this.filetype  = post.file_ext  || '';
		this.tags      = post.tags.split(' ');
		this.sources   = post.sources || [];
		this.artists   = (post.artist || ['unknown_artist']).map(a => new Artist(a));
		this.file      = new Media(post.file_url,    post.width,         post.height);
		this.preview   = new Media(post.preview_url, post.preview_width, post.preview_height);
		this.sample    = new Media(post.sample_url,  post.sample_width,  post.sample_height);
		this.date_created = new Date(post.created_at.s * 1000);
	}
	get url() {
		return '/post/show/' + this.id;
	}
	get download() {
		return this.file.url;
	}
	get isImage() {
		return this.filetype === 'png' || this.filetype === 'jpg' || this.filetype === 'jpeg' || this.filetype === 'gif';
	}
	get isVideo() {
		return this.filetype === 'webm' || this.filetype === 'mp4';
	}
	get isFlash() {
		return this.filetype === 'swf';
	}
	get pending() {
		return this.status === 'pending';
	}
	get approved() {
		return this.status === 'approved';
	}
	get flagged() {
		return this.status === 'flagged';
	}
	get deleted() {
		return this.status === 'deleted';
	}
	get safe() {
		return this.rating === 's';
	}
	get questionable() {
		return this.rating === 'q';
	}
	get explicit() {
		return this.rating === 'e';
	}
	get size() {
		return this.file.size;
	}
	get bytes() {
		return fmt.bytes(this.filesize);
	}
	get color() {
		return getEmbedColor.call(this);
	}
	getArtistLinks(booru) {
		return this.artists.map(a => md.link(a.name, booru.host + a.url));
	}
	metrics(booru) {
		return `${this.score<0?'👎':'👍'} ${this.score} | ❤ ${this.faves} | ${getRatingString(this.rating)} | by ${this.getArtistLinks(booru).join(', ')}`;
	}
}
class Pool {
	constructor(pool) {
		this.id = pool.id;
		this.name = pool.name.replace(/_/g, ' ');
		this.description = pool.description;
		this.date_created = new Date(pool.created_at.s * 1000);
		this.date_updated = new Date(pool.updated_at.s * 1000);
		this.count = pool.post_count;
		this.posts = pool.posts.map(post => new Post(post));
		this.score = this.posts.reduce((score, post) => score += post.score, 0);
		this.faves = this.posts.reduce((faves, post) => faves += post.faves, 0);
		this.artists = this.posts.reduce((artists, post) => {
			for (let artist of post.artists) {
				if (!artists.find(a => a.name == artist.name)) {
					artists.push(artist);
				}
			}
			return artists;
		}, []);
		this.sources = this.posts.reduce((sources, post) => {
			if (post.sources.length) {
				// only find sources which are common to all posts (this gets rid of individual sources)
				sources = sources.filter(s => post.sources.includes(s));
			}
			return sources;
		}, this.first.sources);
		this.rating = this.posts.reduce((rating, post) => {
			if (post.explicit) {
				return post.rating;
			} else if (rating == 's' && post.questionable) {
				return post.rating;
			}
		}, this.first.rating);
	}
	get first() {
		return this.posts[0];
	}
	get last() {
		return this.posts[this.posts.length - 1];
	}
	get url() {
		return '/pool/show/' + post.id;
	}
	get safe() {
		return this.rating === 's';
	}
	get questionable() {
		return this.rating === 'q';
	}
	get explicit() {
		return this.rating === 'e';
	}
	get color() {
		return getEmbedColor.call(this);
	}
	getArtistLinks(booru) {
		return this.artists.map(a => md.link(a.name, booru.host + a.url));
	}
	getPostLinks(booru, max = 10) {
		return this.posts.slice(0, max).map(post => md.link('#'+post.id, booru.host + post.url));
	}
	metrics(booru) {
		return `${this.score<0?'👎':'👍'} ${this.score} | ❤ ${this.faves} | ${getRatingString(this.rating)} | by ${this.getArtistLinks(booru).join(', ')}`;
	}
}

class Booru {
	static get(endpoint, params) {
		return fetch(this.host + (endpoint.url||endpoint), {qs: params});
	}
	static get endpoints() {
		return Endpoints;
	}
	
	static get host() {
		throw 'Need to override host property!';
	}
	static get color() {
		throw 'Need to override color property!';
	}
	static get icon32() {
		return this.host + '/favicon-32x32.png';
	}
	static get icon16() {
		return this.host + '/favicon-16x16.png';
	}
	
	static sanitizeTags(tags) {
		return tags.map(x => x.replace(/ /g,'_').toLowerCase().trim());
	}
	
	static getPost(id) {
		return this.get(Endpoints.post.show, {id});
	}
	static getPool(id) {
		return this.get(Endpoints.pool.show, {id});
	}
	static checkMD5(md5) {
		return this.get(Endpoints.post.check_md5, {md5});
	}
	
	static search(tags = [], blacklist = []) {
		return this.get(Endpoints.post.index, {
			tags: this.sanitizeTags(tags).join(' ')
		})
		// filter posts using the blacklist
		.then(posts => {
			if (posts.length == 0) {
				throw 'No posts found. Try different search tags.';
			}
			// apply blacklist
			if (blacklist.length > 0) {
				let blacklistedTags = [];
				posts = posts.filter(p => (p.tags.split(' ').every(t => {
					if (!blacklist.includes(t)) {
						return true;
					} else if (!blacklistedTags.includes(t)) {
						blacklistedTags.push(t);
					}
					return false;
				})));
				if (posts.length == 0) {
					throw 'All or most of the posts found contained ' + blacklistedTags.join('/') + '. Try different search tags or edit the current blacklist.';
				}
			}
			return posts;
		});
	}
	static reverseSearch(hash) {
		try {
			return this.checkMD5(hash)
			.then(response => {
				if (response.exists) {
					return this.getPost(response.post_id);
				} else {
					throw 'Post does not exist.';
				}
			});
		} catch (e) {
			return Promise.reject(e);
		}
	}
	
	static embedTemplate(title = this.name, description = '', color = this.color, url = this.host) {
		return {
			title,
			description,
			color,
			url,
			timestamp: new Date(),
			fields: [],
			author: {
				name: this.name,
				url: this.host,
				icon_url: this.icon32
			},
			footer: {
				text: ''
			}
		};
	}
	static embedPost(post, title = this.name.toLowerCase()) {
		post = new Post(post);
		
		title = `${title} | #${post.id} [${post.size}, ${post.bytes}]`;
		
		// collect info such as score, faves, rating, and artists
		let description = post.metrics(this);
		
		// prepare embed frame
		let embed = this.embedTemplate(title, description, post.color);
		embed.url += post.url;
		embed.timestamp = this.date_created;
		embed.footer.text = 'Sources: ' + (post.sources.join(' | ') || 'N/A');
		
		if (post.delreason) {
			post.delreason = post.delreason.replace(/#(\d+)/, md.link('#$1', this.host + '/post/show/$1'));
		}
		
		if (post.pending) {
			embed.fields.push(FIELD_PENDING);
		} else if (post.flagged) {
			embed.fields.push({name: '❗ Flagged For Removal', value: post.delreason});
		} else if (post.deleted) {
			embed.fields.push({name: '❌ File Deleted', value: post.delreason});
			embed.image = post.preview;
		}
		
		if (post.isVideo) {
			// webms and mp4s have preview thumbnails that can be used
			// todo: see if embedding videos works now?
			if (!post.deleted) {
				embed.image = post.sample;
			}
			embed.fields.push({
				name: 'Video (download link)',
				value: post.download
			});
			
		} else if (post.isFlash) {
			// flash animations have no previews yet
			if (!post.deleted) {
				embed.image = post.preview;
			}
			// add tags to assist describing the content since no thumbnail is available yet
			// wrap in a code block to avoid discord markdown messing it up
			embed.fields.push({
				name: 'Tags (in lack of Flash preview)',
				value: md.codeblock(truncate(post.tags.join(', '), 992))
			});
			
		} else {
			// large filesizes have difficulty embedding
			if (!post.deleted) {
				embed.image = post.tags.includes('hi_res') ? post.sample : post.file;
			}
			
			// Warn the user about large file sizes that may hog up slow internet lanes
			if (post.filesize > 10 * MB) {
				embed.fields.push(FIELD_LARGE_IMAGE);
			}
		}
		
		// Warn the user if there is sound
		if (post.tags.includes('sound')) {
			embed.fields.push(FIELD_SOUND_WARNING);
		}

		return embed;
	}
	static embedPool(pool) {
		pool = new Pool(pool);
		
		let title = `${this.name} | Pool #${pool.id}: ${pool.name}`;
		let description = pool.metrics(this) + '\n\n' + pool.description;
		
		let postsField = {
			name: `Posts (${pool.count})`,
			value: pool.getPostLinks(this).join(', '),
			inline: true
		};
		if (posts.length > 10) {
			postsField.value += `, + ${pool.count - 10} more...`;
		}
		
		let embed = this.embedTemplate(title, description, pool.color);
		embed.url += pool.url;
		embed.timestamp = pool.date_created;
		embed.footer.text = 'Sources: ' + (pool.sources.join(' | ') || 'N/A');
		embed.image = pool.first.sample;
		embed.fields.push(postsField);
		
		return embed;
	}
}

function getRatingString(rating) {
	switch (rating) {
		case 'e':
			return '🔞 **Explicit**';
		case 'q':
			return '⚠ *Questionable*';
		case 's':
			return '👌 Safe';
	}
}
function getEmbedColor() {
	if (this.pending) {
		return 0x0000ff;
	} else if (this.flagged || this.deleted) {
		return 0x000000;
	} else if (this.explicit) {
		return 0xff0000;
	} else if (this.questionable) {
		return 0xffff00;
	} else if (this.safe) {
		return 0x008800;
	}
}

module.exports = Booru;
