const {Format:fmt,fetch,truncate} = require('../../Utils');

const KB = 1024;
const MB = 1024 * KB;

const HI_RES = 2 * MB;
const ABSURD_RES = 10 * MB;

const STATUS_COLOR = {
	SAFE:         0x008800,
	QUESTIONABLE: 0xffff00,
	EXPLICIT:     0xff0000,
	PENDING:      0x0000ff,
	FLAGGED:      0x000000
};

const E621_URL = 'https://e621.net/post/index.json?tags='; // additional params: limit, page
const E621_POOL_URL = 'https://e621.net/pool/show.json?id=';
const POST_REGEX = /https?:\/\/e621\.net\/post\/show\/(\d+)/;
const POOL_REGEX = /https?:\/\/e621\.net\/pool\/show\/(\d+)/;
const DIRECT_REGEX = /e621.net\/.*\/([0-9a-f]{32})/;
const HASH_REGEX = /[0-9a-f]{32}/;
const POST_ID_REGEX = /#(\d+)/;

module.exports = class E621 {
	static get postRegex() {
		return POST_REGEX;
	}
	static get poolRegex() {
		return POOL_REGEX;
	}
	static get directRegex() {
		return DIRECT_REGEX;
	}
	static get hashRegex() {
		return HASH_REGEX;
	}
	static sanitizeTags(tags) {
		return tags.map(x => x.replace(/ /g,'_').toLowerCase().trim());
	}
	static getHash(link) {
		return link.match(HASH_REGEX);
	}
	static search(tags = [], blacklist = []) {
		return fetch(E621_URL + this.sanitizeTags(tags).join(' '))
		.then(response => {
			if (typeof(response) === 'object') {
				return response;
			} else {
				return JSON.parse(response);
			}
		})
		.then(posts => {
			if (posts.length == 0) {
				throw 'No posts found. Try different search tags.';
			}
			// apply blacklist
			var blacklistedTags = [];
			if (blacklist.length > 0) {
				posts = posts.filter(p => (p.tags.split(' ').every(t => {
					if (!blacklist.includes(t)) {
						return true;
					} else if (!blacklistedTags.includes(t)) {
						blacklistedTags.push(t);
					}
					return false;
				})));
			}
			if (posts.length == 0) {
				throw 'All or most of the posts found contained ' + blacklistedTags.join(', ') + '. Try different search tags or edit the current blacklist.';
			}
			return posts;
		});
	}
	static searchRandom(tags = [], blacklist = []) {
		return this.search([...tags, 'order:random'], blacklist);
	}
	static searchTop(tags = [], blacklist = []) {
		return this.search([...tags, 'order:score'], blacklist);
	}
	static reverseSearch(url) {
		try {
			let hash = this.getHash(url);
			if (!hash) {
				throw 'Invalid MD5 hash.';
			}
			return this.search([`md5:${hash[0]}`]).then(posts => this.embed(posts[0], 'Reverse Search'));
		} catch (e) {
			console.error(e);
			return e;
		}
	}
	static embed(post, title = 'e621') {
		let {
			id, score, fav_count, created_at,
			file_url,  width, height,
			sample_url, sample_width, sample_height,
			preview_url, preview_width, preview_height, 
			file_size, tags, rating, status, artist, sources,
			delreason
		} = post;
		
		tags = tags.split(' ');
		
		// prepare embed frame
		let embed = {
			title: `${title} | #${id} [${width} x ${height}, ${fmt.bytes(file_size)}]`,
			url: 'https://e621.net/post/show/' + id,
			description: 'No description available',
			fields: [],
			footer: {
				timestamp: new Date(created_at.s * 1000),
				text: 'Sources: ' + ((sources instanceof Array && sources.length) ? sources.join(' | ') : 'N/A')
			}
		};
		
		if (/(webm|mp4)$/.test(file_url)) {
			// webms and mp4s have preview thumbnails that can be used
			// todo: see if embedding videos works now?
			embed.image = {
				url:    preview_url,
				width:  sample_width,
				height: sample_height
			};
			embed.fields.push({name: 'Video', value: '(Sorry, video embedding doesn\'t quite work yet)\n' + file_url});
			
		} else if (/swf$/.test(file_url)) {
			// flash animations have no previews yet
			embed.image = {
				url:    preview_url,
				width:  preview_width,
				height: preview_height
			};
			
			// add tags to assist describing the content since no thumbnail is available yet
			embed.fields.push({name: 'Tags', value: truncate(tags.join(', '),1000)});
		} else {
			// large filesizes have difficulty embedding
			embed.image = {
				url:    (tags.includes('hi_res') || file_size > HI_RES) ? sample_url : file_url,
				width:  sample_width,
				height: sample_height
			};
		}
		// Warn the user about large file sizes that may hog up slow internet lanes
		if (tags.includes('absurd_res') || file_size > ABSURD_RES) {
			embed.fields.push({name: 'Large File Size', value: '*This is a very large file and may take a while to load!*'});
		}
		// Warn the user if there is sound
		if (tags.includes('sound')) {
			embed.fields.push({name: 'Sound Warning', value: '*Content contains audio. Mute before playing if you need to.*'});
		}
		
		// collect info such as score, faves, rating, and artists
		let t = []
		t.push(`${score<0?'\uD83D\uDC4E':'\uD83D\uDC4D'} ${score}`);
		t.push(`\u2764 ${fav_count}`);
		switch (rating) {
			case 'e':
				t.push('\uD83C\uDF46 **Explicit**');
				embed.color = STATUS_COLOR.EXPLICIT;
				break;
			case 'q':
				t.push('\u26A0 Questionable');
				embed.color = STATUS_COLOR.QUESTIONABLE;
				break;
			case 's':
				t.push('\uD83D\uDC4C Safe');
				embed.color = STATUS_COLOR.SAFE;
				break;
		}
		switch (status) {
			case 'pending':
				embed.color = STATUS_COLOR.PENDING;
				embed.fields.push({name: ':thinking: Pending', value: 'This post is requesting approval from a moderator.'});
				break;
			case 'flagged':
				embed.color = STATUS_COLOR.FLAGGED;
				delreason = delreason.replace(POST_ID_REGEX, '[#$1](https://e621.net/post/show/$1)');
				embed.fields.push({name: ':x: Flagged For Removal', value: delreason});
				break;
			case 'active':
				break;
		}
		
		if (artist && artist.length) {
			t.push('by '+artist.map(x => `[${x}](https://e621.net/post?tags=${x})`).join(', '));
		} else {
			t.push(`by [unknown artist](https://e621.net/post?tags=unknown_artist)`);
		}
		
		embed.description = t.join(' | ');
		
		return embed;
	}
	static getPool(id) {
		if (!id) throw 'Invalid pool ID.';
		return fetch(E621_POOL_URL+id)
		.then(response => {
			if (typeof(response) === 'object') {
				return response;
			} else {
				return JSON.parse(response);
			}
		})
		.then(this.embedPool);
	}
	static embedPool(pool) {
		let {
			id, name, description, created_at, updated_at, post_count, posts
		} = pool;
		let firstPost = posts[0], lastPost = posts[posts.length-1];
		
		// correct the pool name
		name = name.replace(/_/g, ' ');
		
		// process posts
		let artist = [], sources = posts[0].sources, totalScore = 0, totalFaves = 0, overallRating = 's';
		for (var post of posts) {
			if (post.artist && post.artist.length) {
				for (var a of post.artist) {
					if (!artist.includes(a)) artist.push(a);
				}
			}
			// only find sources which are common to all posts (this gets rid of individual sources)
			if (post.sources && post.sources.length) {
				sources = sources.filter(s => post.sources.includes(s));
			}
			totalScore += post.score;
			totalFaves += post.fav_count;
			if (post.rating == 'e' || (post.rating == 'q' && overallRating == 's')) {
				overallRating = post.rating;
			}
		}
		
		var embed = {
			title: `Pool #${id} - ${name}`,
			url: `https://e621.net/pool/show/${id}/`,
			image: {
				url: firstPost.sample_url,
				width: firstPost.sample_width,
				height: firstPost.sample_height
			},
			fields: [
				{
					name: `Posts (${post_count})`,
					value: posts.slice(0, 10).map(post => `[#${post.id}](https://e621.net/post/show/${post.id})`).join(', '),
					inline: true
				}
			],
			footer: {
				timestamp: new Date(created_at.s * 1000),
				text: 'Sources: ' + (sources.join(' | ') || 'None found?')
			}
		};
		if (posts.length > 10) {
			embed.fields[0].value += `, + ${post_count - 10} more...`;
		}
		
		var t = [];
		t.push(`${totalScore<0?'\uD83D\uDC4E':'\uD83D\uDC4D'} ${totalScore}`);
		t.push(`\u2764 ${totalFaves}`);
		switch (overallRating) {
			case 'e':
				t.push('\uD83C\uDF46 **Explicit**');
				embed.color = STATUS_COLOR.EXPLICIT;
				break;
			case 'q':
				t.push('\u26A0 Questionable');
				embed.color = STATUS_COLOR.QUESTIONABLE;
				break;
			case 's':
				t.push('\uD83D\uDC4C Safe');
				embed.color = STATUS_COLOR.SAFE;
				break;
		}
		if (artist && artist.length) {
			t.push('by '+artist.map(x => `[${x}](https://e621.net/post?tags=${x})`).join(', '));
		} else {
			t.push(`by [unknown artist](https://e621.net/post?tags=unknown_artist)`);
		}

		embed.description = t.join(' | ');
		if (description) {
			embed.description += '\n\n' + description;
		}
		return embed;
	}
}

