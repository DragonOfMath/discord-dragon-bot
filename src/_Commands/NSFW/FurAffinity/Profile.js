const {Markdown:md,innerHTML} = require('../../../Utils');

class Profile {
	constructor(user) {
		if (user) Object.assign(this, user);
	}
	embed() {
		var e = {
			title: this.name + '\'s Profile',
			url: this.profile,
			color: 0x2e3b41,
			thumbnail: {
				url: this.avatar
			},
			description: '',
			fields: []
		};
		e.description += `${md.bold('Full Name:')} ${this.full_name}\n`;
		//e.description += `${md.bold('Title:')} ${this.artist_type}\n`; // artist_type has been replaced with user_title
		e.description += `${md.bold('Registered since:')} ${this.registered_since}\n`;
		e.description += `${md.bold('Current mood:')} ${this.current_mood}\n`;
		e.description += `${md.bold('Page Visits:')} ${this.pageviews}\n`;
		e.description += `${md.bold('Submissions:')} ${this.submissions}\n`;
		e.description += `${md.bold('Comments Received:')} ${this.comments_received}\n`;
		e.description += `${md.bold('Comments Given:')} ${this.comments_given}\n`;
		e.description += `${md.bold('Journals:')} ${this.journals}\n`;
		e.description += `${md.bold('Favorites:')} ${this.favorites}\n`;
		e.description += `${md.bold('Watchers:')} ${this.watchers.count}\n`;
		e.description += `${md.bold('Watching:')} ${this.watching.count}\n`;
		
		if (this.artist_information) {
			var info = '';
			loop: for (var key in this.artist_information) {
				switch (key) {
					case 'Favorite website':
						this.artist_information[key] = innerHTML(this.artist_information[key]);
						break;
					case 'Favorite artist':
						continue loop;
				}
				info += `${md.bold(key)}: ${this.artist_information[key]}\n`;
			}
			if (info) {
				e.fields.push({
					name: 'Misc Information',
					value: info
				});
			}
		}
		if (this.featured_submission) {
			e.fields.push({
				name: 'Featured Submission',
				value: md.link(this.featured_submission.title, this.featured_submission.link),
				inline: true
			});
		}
		if (this.profile_id) {
			e.fields.push({
				name: 'Profile ID',
				value: md.link(this.profile_id.id, this.profile_id.link),
				inline: true
			});
		}
		
		return e;
	}
}

module.exports = Profile;
