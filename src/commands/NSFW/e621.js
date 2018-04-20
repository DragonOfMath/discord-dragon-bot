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
const POST_REGEX = /https?:\/\/e621\.net\/post\/show\/(\d+)/;
const DIRECT_REGEX = /e621.net\/.*\/([0-9a-f]{32})/;
const HASH_REGEX = /[0-9a-f]{32}/;
const POST_ID_REGEX = /#(\d+)/;

module.exports = class E621 {
	static get postRegex() {
		return POST_REGEX;
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
			id, score, fav_count, 
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
				text: 'Sources: ' + ((sources instanceof Array && sources.length) ? sources.join(' | ') : 'N/A')
			}
		};
		
		if (/(webm|mp4)$/.test(file_url)) {
			// webms and mp4s have preview thumbnails that can be used
			embed.image = {
				url:    sample_url,
				width:  sample_width,
				height: sample_height
			};
			
			embed.fields.push({name: 'Video', value: '*This is a video. Visit the title link to view it.*'});
			
			// Warn the user if there is sound
			if (tags.includes('sound')) {
				embed.fields.push({name: 'Sound', value: '*Content contains audio. Mute before playing if you need to.*'});
			}
		} else if (/swf$/.test(file_url)) {
			// flash animations have no previews yet
			embed.image = {
				url:    preview_url,
				width:  preview_width,
				height: preview_height
			};
			
			embed.fields.push({name: 'Flash', value: '*This is a Flash file. Visit the title link to view it.*'});
			
			// Warn the user if there is sound
			if (tags.includes('sound')) {
				embed.fields.push({name: 'Sound', value: '*Content contains audio. Mute before playing if you need to.*'});
			}
		
			// add tags to assist describing the content
			embed.fields.push({name: 'Tags', value: truncate(tags.join(', '),1000)});
		} else {
			// large filesizes have difficulty embedding
			embed.image = {
				url:    (tags.includes('hi_res') || file_size > HI_RES) ? sample_url : file_url,
				width:  sample_width,
				height: sample_height
			};
			
			if (tags.includes('absurd_res') || file_size > ABSURD_RES) {
				embed.fields.push({name: 'Large Image Size', value: '*This is a very large image and may take a while to load!*'});
			}
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
}

