const BooruContent = require('./BooruContent');
const Artist = require('./Artist');
const Media = require('./Media');
const {Markdown:md,Format:fmt,truncate} = require('../../../Utils');

const MB = 1048576;

const Fields = {
	PENDING: {
		name: '🤔 Pending',
		value: 'This post is pending approval from a moderator.'
	},
	LARGE_IMAGE: {
		name: 'Large File Size (>10MB)',
		value: 'This is a very large image file and may crash your browser when viewing it!'
	},
	SOUND_WARNING: {
		name: 'Sound',
		value: 'You should adjust your audio output before playing.'
	}
};

class Post extends BooruContent {
	constructor(post, booru) {
		super(post, booru);
		if (!post.artist.length) post.artist.push('unknown_artist');
		this.faves     = post.fav_count;
		this.filesize  = post.file_size || 0; // in bytes
		this.filetype  = post.file_ext  || '';
		this.tags      = post.tags.split(' ');
		this.sources   = this.sources || [];
		this.artists   = post.artist.map(a => new Artist(a, booru));
		this.file      = new Media(post.file_url,    post.width,         post.height);
		this.preview   = new Media(post.preview_url, post.preview_width, post.preview_height);
		this.sample    = new Media(post.sample_url,  post.sample_width,  post.sample_height);
		this.date_created = new Date(post.created_at.s * 1000);
	}
	get url() {
		return this.booru.host + '/post/show/' + this.id;
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
	get size() {
		return this.file.size;
	}
	get bytes() {
		return fmt.bytes(this.filesize);
	}
	embed(extra) {
		let title = (extra ? extra + ' | ' : '') + `#${this.id} [${this.size}, ${this.bytes}]`;
		let description = this.metrics;
		
		// prepare embed frame
		let embed = super.embed(title, description, this.color);
		embed.url = this.url;
		embed.timestamp = this.date_created;
		embed.footer.text = 'Sources: ' + (this.sources.join(' | ') || 'N/A');
		
		if (this.delreason) {
			this.delreason = this.delreason.replace(/#(\d+)/, md.link('#$1', this.booru.host + '/post/show/$1'));
		}
		
		if (this.pending) {
			embed.fields.push(Fields.PENDING);
		} else if (this.flagged) {
			embed.fields.push({name: '❗ Flagged For Removal', value: this.delreason});
		} else if (this.deleted) {
			embed.fields.push({name: '❌ File Deleted', value: this.delreason});
			embed.image = this.preview;
			// somehow the deleted image url isn't normalized
			embed.image.url = this.booru.host + embed.image.url;
		}
		
		if (this.isVideo) {
			// webms and mp4s have preview thumbnails that can be used
			// todo: see if embedding videos works now?
			if (!this.deleted) {
				embed.image = this.sample;
			}
			embed.fields.push({
				name: 'Video (download link)',
				value: this.download
			});
			
		} else if (this.isFlash) {
			// flash animations have no previews yet
			if (!this.deleted) {
				embed.image = this.preview;
			}
			// add tags to assist describing the content since no thumbnail is available yet
			// wrap in a code block to avoid discord markdown messing it up
			embed.fields.push({
				name: 'Tags (in lack of Flash preview)',
				value: md.codeblock(truncate(this.tags.join(', '), 992))
			});
			
		} else {
			// large filesizes have difficulty embedding
			if (!this.deleted) {
				embed.image = this.tags.includes('hi_res') ? this.sample : this.file;
			}
			
			// Warn the user about large file sizes that may hog up slow internet lanes
			if (this.filesize > 10 * MB) {
				embed.fields.push(Fields.LARGE_IMAGE);
			}
		}
		
		// Warn the user if there is sound
		if (this.tags.includes('sound')) {
			embed.fields.push(Fields.SOUND_WARNING);
		}

		return embed;
	}
}

module.exports = Post;
