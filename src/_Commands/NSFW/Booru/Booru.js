const Post = require('./Post');
const Pool = require('./Pool');
const Artist = require('./Artist');
const PoolViewer = require('./PoolViewer');
const BooruError = require('./BooruError');

const {fetch} = require('../../../Utils');

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

class Booru {
	static get(endpoint, params) {
		return fetch(this.host + (endpoint.url||endpoint), {qs: params});
	}
	static get endpoints() {
		return Endpoints;
	}
	
	static get host() {
		throw new BooruError(this, 'Need to override host property!');
	}
	static get color() {
		throw new BooruError(this, 'Need to override color property!');
	}
	static get icon32() {
		return this.host + '/favicon-32x32.png';
	}
	static get icon16() {
		return this.host + '/favicon-16x16.png';
	}
	static get authorEmbedInfo() {
		return {
			name: this.name,
			url: this.host,
			icon_url: this.icon32
		};
	}
	
	static sanitizeTags(tags) {
		return tags.map(x => x.replace(/ /g,'_').toLowerCase().trim());
	}
	
	static async getPost(id) {
		let post = await this.get(Endpoints.post.show, {id});
		return new Post(post, this);
	}
	static async getPool(id) {
		let pool = await this.get(Endpoints.pool.show, {id});
		return new Pool(pool, this);
	}
	static async checkMD5(md5) {
		return this.get(Endpoints.post.check_md5, {md5});
	}
	
	static async search(tags = [], blacklist = []) {
		let posts = await this.get(Endpoints.post.index, {
			tags: this.sanitizeTags(tags).join(' ')
		});
		
		if (posts.length == 0) {
			throw new BooruError(this, 'No posts found. Try different search tags.');
		}
		
		// filter posts using the blacklist
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
				throw new BooruError(this, 'All or most of the posts found contained the following blacklisted tags: ' + blacklistedTags.join('/') + '.\nTry different search tags or edit the current blacklist.');
			}
		}
		
		return posts.map(p => new Post(p, this));
	}
	static async reverseSearch(hash) {
		let response = await this.checkMD5(hash)
		if (response.exists) {
			return this.getPost(response.post_id);
		} else {
			throw new BooruError(this, 'Post does not exist.');
		}
	}
}

Booru.Post = Post;
Booru.Pool = Pool;
Booru.PoolViewer = PoolViewer;
Booru.Artist = Artist;

module.exports = Booru;
