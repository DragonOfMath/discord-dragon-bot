const Post = require('./Post');
const Pool = require('./Pool');
const Artist = require('./Artist');
const PoolViewer = require('./PoolViewer');
const BooruError = require('./BooruError');

const {fetch} = require('../../../Utils');

// some of these endpoints are obsolete, will have to keep checking for new API docs
const Endpoints = {
	posts: {
		index: {
			url: '/posts.json',
			params: ['tags','page','limit']
		},
		show: {
			url: '/posts/{id}.json',
			params: ['id']
		},
		check_md5: {
			url: '/posts/check_md5.json',
			params: ['md5']
		}
	},
	pools: {
		index: {
			url: '/pools.json',
			params: ['query','page']
		},
		show: {
			url: '/pools/{id}.json',
			params: ['id']
		}
	},
	tags: {
		index: {
			url: '/tags.json',
			params: ['limit','page','order','after_id','show_empty_tags','name','name_pattern']
		},
		show: {
			url: '/tags/{id}.json',
			params: ['id']
		},
		related: {
			url: '/tags/related.json',
			params: ['tags','type']
		},
		aliases: {
			url: '/tag_aliases.json',
			params: ['page','order','query']
		},
		implications: {
			url: '/tag_implications.json',
			params: ['page','order','query']
		},
		history: {
			obsolete: true,
			url: '/tag_history.json',
			params: ['post_id','date_start','date_end','user_id','user_name','source','tags','reason','description','limit','before','after']
		}
	},
	artists: {
		index: {
			url: '/artists.json',
			params: ['name','limit','order','page']
		}
	},
	comments: {
		index: {
			url: '/comments.json',
			params: ['post_id','page','status']
		},
		show: {
			url: '/comments/{id}.json',
			params: ['id']
		},
		search: {
			obsolete: true,
			url: '/comments/search.json',
			params: ['query','results','date_start','date_end','order','post_id','page','user','user_id','status']
		},
	},
	wiki: {
		index: {
			url: '/wiki_pages.json',
			params: ['query','page','order','limit']
		},
		show: {
			url: '/wiki_pages/{title}.json',
			params: [' title','version']
		}
	},
	users: {
		index: {
			url: '/users.json',
			params: ['id','name','level','order']
		},
		show: {
			url: '/users/{id}.json',
			params: ['id','name']
		}
	},
	favorites: {
		list_users: {
			obsolete: true,
			url: '/favorites/list_users.json',
			params: ['id']
		}
	}
};

class Booru {
	static infixParams(endpoint, params) {
		endpoint = endpoint.url || endpoint;
		for (let key in params) {
			if (key == 'query') {
				//key = 'q';
				//delete params['query'];
			}
			if (endpoint.indexOf('{'+key+'}') > -1) {
				endpoint = endpoint.replace('{'+key+'}',params[key]);
				delete params[key];
			}
		}
		return endpoint;
	}
	static get(endpoint, params) {
		if (endpoint.obsolete) {
			throw endpoint.url + ' is obsolete.';
		}
		endpoint = this.infixParams(endpoint, params);
		return fetch(this.host + endpoint, {qs: params});
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
		
		posts = posts.map(p => new Post(p, this));
		
		// before applying the blacklist, remove any content that is not allowed by Discord ToS
		posts = posts.filter(post => {
			return !(post.isUnderage || post.isViolent);
		});
		
		if (posts.length == 0) {
			throw new BooruError(this, 'All of the posts found are in violation of Discord ToS.');
		}
		
		// filter posts using the blacklist
		if (blacklist.length > 0) {
			let blacklistedTags = [];
			posts = posts.filter(p => (p.tags.every(t => {
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
		
		return posts;
	}
	static async reverseSearch(hash) {
		let response = await this.checkMD5(hash)
		if (response.exists) {
			return this.getPost(response.post_id)
			.then(post => {
				if (post.isViolent || post.isUnderage) {
					throw new BooruError(this, 'Post violates Discord ToS.');
				} else {
					return post;
				}
			});
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
