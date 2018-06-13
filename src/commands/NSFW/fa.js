const {Markdown:md,random,paginate,tableify,bufferize,truncate,fetch,innerHTML} = require('../../Utils');

const COLOR = 0x2e3b41;

// http://faexport.boothale.net/docs
const Endpoints = {
	host: 'https://faexport.boothale.net',
	join(...x) {
		return Endpoints.host + '/' + x.join('/') + '.json';
	},
	Home() {
		return Endpoints.join('home');
	},
	Search() {
		return Endpoints.join('search');
	},
	User(username) {
		return {
			ID:          Endpoints.join('user', username),
			Watchlist:   Endpoints.join('user', username, 'watching'),
			Watchers:    Endpoints.join('user', username, 'watchers'),
			Journals:    Endpoints.join('user', username, 'journals'),
			Shouts:      Endpoints.join('user', username, 'shouts'),
			Commissions: Endpoints.join('user', username, 'commissions'),
			Gallery:     Endpoints.join('user', username, 'gallery'),
			Scraps:      Endpoints.join('user', username, 'scraps'),
			Favorites:   Endpoints.join('user', username, 'favorites')
		};
	},
	Journal(id) {
		return {
			ID:       Endpoints.join('journal', id),
			Comments: Endpoints.join('journal', id, 'comments')
		};
	},
	Submission(id) {
		return {
			ID:       Endpoints.join('submission', id),
			Comments: Endpoints.join('submission', id, 'comments')
		};
	}
};

class FAExport {
	static getHome() {
		return fetch(Endpoints.Home());
	}
	static getUser(username) {
		return fetch(Endpoints.User(username).ID);
	}
	static getWatchlist(username, page = 1) {
		var options = {qs:{}};
		if (page > 1) options.qs.page = page;
		return fetch(Endpoints.User(username).Watchlist, options);
	}
	static getWatchers(username, page = 1) {
		var options = {qs:{}};
		if (page > 1) options.qs.page = page;
		return fetch(Endpoints.User(username).Watchers, options);
	}
	static getShouts(username) {
		return fetch(Endpoints.User(username).Shouts);
	}
	static getCommissions(username) {
		return fetch(Endpoints.User(username).Commissions);
	}
	static getJournals(username, page = 1) {
		var options = {qs: {full:1}};
		if (page > 1) options.qs.page = page;
		return fetch(Endpoints.User(username).Journals, options);
	}
	static getGallery(username, page = 1) {
		var options = {qs: {full:1}};
		if (page > 1) options.qs.page = page;
		return fetch(Endpoints.User(username).Gallery, options);
	}
	static getScraps(username, page = 1) {
		var options = {qs: {full:1}};
		if (page > 1) options.qs.page = page;
		return fetch(Endpoints.User(username).Scraps, options);
	}
	static getFavorites(username, page = 1) {
		var options = {qs: {full:1}};
		if (page > 1) optios.qs.page = page;
		return fetch(Endpoints.User(username).Favorites, options);
	}
	static getSubmission(id) {
		return fetch(Endpoints.Submission(id).ID);
	}
	static getSubmissionComments(id) {
		return fetch(Endpoints.Submission(id).Comments);
	}
	static getJournal(id) {
		return fetch(Endpoints.Journal(id).ID);
	}
	static getJournalComments(id) {
		return fetch(Endpoints.Journal(id).Comments);
	}
	static search(query, o = {}) {
		o.q = query;
		o.full = 1;
		var options = {qs: o};
		return fetch(Endpoints.Search(), options);
	}
}

class FurAffinity {
	static sanitizeUsername(name) {
		return name.toLowerCase().replace(/[^\w\d\-\.~]/g, '');
	}
	static embedProfile(user) {
		var e = {
			title: user.name + '\'s Profile',
			url: user.profile,
			color: COLOR,
			thumbnail: {
				url: user.avatar
			},
			description: '',
			fields: []
		};
		e.description += `${md.bold('Full Name:')} ${user.full_name}\n`;
		//e.description += `${md.bold('Title:')} ${user.artist_type}\n`; // artist_type has been replaced with user_title
		e.description += `${md.bold('Registered since:')} ${user.registered_since}\n`;
		e.description += `${md.bold('Current mood:')} ${user.current_mood}\n`;
		e.description += `${md.bold('Page Visits:')} ${user.pageviews}\n`;
		e.description += `${md.bold('Submissions:')} ${user.submissions}\n`;
		e.description += `${md.bold('Comments Received:')} ${user.comments_received}\n`;
		e.description += `${md.bold('Comments Given:')} ${user.comments_given}\n`;
		e.description += `${md.bold('Journals:')} ${user.journals}\n`;
		e.description += `${md.bold('Favorites:')} ${user.favorites}\n`;
		e.description += `${md.bold('Watchers:')} ${user.watchers.count}\n`;
		e.description += `${md.bold('Watching:')} ${user.watching.count}\n`;
		
		if (user.artist_information) {
			var info = '';
			loop: for (var key in user.artist_information) {
				switch (key) {
					case 'Favorite website':
						user.artist_information[key] = innerHTML(user.artist_information[key]);
						break;
					case 'Favorite artist':
						continue loop;
				}
				info += `${md.bold(key+':')} ${user.artist_information[key]}\n`;
			}
			e.fields.push({
				name: 'Misc Information',
				value: info
			});
		}
		if (user.featured_submission) {
			e.fields.push({
				name: 'Featured Submission',
				value: md.link(user.featured_submission.title, user.featured_submission.link),
				inline: true
			});
		}
		if (user.profile_id) {
			e.fields.push({
				name: 'Profile ID',
				value: md.link(user.profile_id.id, user.profile_id.link),
				inline: true
			});
		}
		
		return e;
	}
	static embedContents(contents) {
		contents = contents.map(item => md.link(item.title, item.link));
		return bufferize(contents);
	}
	static embedComments(comments, page) {
		var e = paginate(comments, page, 20, function (comment) {
			return {
				name: `#${comment.id}: ${comment.name}`,
				value: truncate(comment.text, 300)
			};
		});
		e.color = COLOR;
		return e;
	}
	static embedList(list) {
		var e = bufferize(list, ', ');
		e.color = COLOR;
		return e;
	}
	static embedSubmission(submission) {
		var e = {
			title: `"${submission.title}" by ${submission.name}`,
			url: submission.link,
			color: COLOR,
			description: '',
			timestamp: submission.posted_at
		};
		if (submission.keywords.length) {
			e.footer = {
				text: 'Keywords: ' + submission.keywords.join(' ')
			};
		}
		
		var tidbits = [];
		switch (submission.rating) {
			case 'General':
				tidbits.push(':white_check_mark: General');
				break;
			case 'Mature':
				tidbits.push(':warning: Mature');
				break;
			case 'Adult':
				tidbits.push(':underage: Adult');
				break;
		}
		tidbits.push(':eye: ' + submission.views);
		tidbits.push(':heart: ' + submission.favorites);
		tidbits.push(':speech_balloon: ' + submission.comments);
		if (/.png|.jpe?g|.gif$/.test(submission.download)) {
			tidbits.push(':frame_photo: ' + submission.resolution);
			e.image = {
				url: submission.download
			};
		} else {
			tidbits.push(':inbox_tray: ' + md.link('Download', submission.download));
			e.image = {
				url: submission.thumbnail
			};
		}
		e.description = tidbits.join(' | ');
		
		return e;
	}
	static embedJournal(journal) {
		var e = {
			title: `"${journal.title}" by ${journal.name}`,
			url: journal.link,
			color: COLOR,
			description: truncate(journal.text || journal.description, 2000),
			timestamp: journal.posted_at
		};
		return e;
	}
}

module.exports = {
	FAExport,
	FurAffinity
};
