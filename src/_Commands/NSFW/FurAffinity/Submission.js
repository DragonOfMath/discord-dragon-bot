const {Markdown:md} = require('../../../Utils');

class Submission {
	constructor(submission) {
		if (submission) Object.assign(this, submission);
	}
	embed(preview = false) {
		if (!this.download) {
			return {
				title: this.title,
				url: this.link,
				color: 0x2e3b41,
				image: {
					url: this.thumbnail
				}
			};
		}
		
		var e = {
			title: `"${this.title}" by ${this.name}`,
			url: this.link,
			color: 0x2e3b41,
			description: '',
			timestamp: this.posted_at
		};
		if (this.keywords.length) {
			e.footer = {
				text: 'Keywords: ' + this.keywords.join(' ')
			};
		}
		
		var tidbits = [];
		switch (this.rating) {
			case 'General':
				tidbits.push('✅ General');
				break;
			case 'Mature':
				tidbits.push('⚠ Mature');
				break;
			case 'Adult':
				tidbits.push('🔞 Adult');
				break;
			default:
				tidbits.push('❔ Unrated');
				break;
		}
		tidbits.push(':eye: ' + this.views);
		tidbits.push(':heart: ' + this.favorites);
		tidbits.push(':speech_balloon: ' + this.comments);
		if (/.png|.jpe?g|.gif$/.test(this.download)) {
			tidbits.push('🖼 ' + this.resolution);
			e.image = {
				url: this.download
			};
		} else {
			tidbits.push('📥 ' + md.link('Download', this.download));
			e.thumbnail = {
				url: this.thumbnail
			};
		}
		e.description = tidbits.join(' | ');
		
		return e;
	}
}

module.exports = Submission;
