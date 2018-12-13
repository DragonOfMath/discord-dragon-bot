const BooruContent = require('./BooruContent');
const Post = require('./Post');
const {Markdown:md} = require('../../../Utils');

class Pool extends BooruContent {
	constructor(pool, booru) {
		super(pool, booru);
		
		this.name = pool.name.replace(/_/g, ' ');
		this.date_created = new Date(pool.created_at.s * 1000);
		this.date_updated = new Date(pool.updated_at.s * 1000);
		this.count = pool.post_count;
		
		this.posts = pool.posts.map(post => new Post(post, booru));
		
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
			} else {
				return rating;
			}
		}, this.first.rating);
	}
	get first() {
		return this.posts[0];
	}
	get last() {
		return this.posts[this.posts.length-1];
	}
	get url() {
		return this.booru.host + '/pool/show/' + this.id;
	}
	getPostLinks(max = 10) {
		return this.posts.slice(0, max).map(post => md.link('#'+post.id, post.url));
	}
	embed(extra) {
		let title = (extra ? extra + ' | ' : '') + `Pool #${this.id}: ${this.name}`;
		let description = this.metrics + '\n\n' + this.description;
		
		let postsField = {
			name: `Posts (${this.count})`,
			value: this.getPostLinks(10).join(', '),
			inline: true
		};
		if (this.count > 10) {
			postsField.value += `, + ${this.count - 10} more...`;
		}
		
		let embed = super.embed(title, description);
		embed.url = this.url;
		embed.timestamp = this.date_created;
		embed.footer.text = 'Sources: ' + (this.sources.join(' | ') || 'N/A');
		embed.image = this.first.sample;
		embed.fields.push(postsField);
		
		return embed;
	}
}

module.exports = Pool;
