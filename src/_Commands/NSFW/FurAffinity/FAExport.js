const {fetch} = require('../../../Utils');

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
		return fetch(Endpoints.Search(), {qs: o});
	}
}

module.exports = FAExport;
