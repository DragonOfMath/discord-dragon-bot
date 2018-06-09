const {FAExport,FurAffinity:FA} = require('./fa');

module.exports = {
	'fa': {
		aliases: ['furaffinity'],
		category: 'NSFW',
		title: 'FurAffinity',
		info: 'Search FurAffinity. Options you may set include: `page`, `perpage`, `order_by`, `order_direction`, `range`, `mode`, `rating`, and `type`.',
		parameters: ['...query', '[...option:value]'],
		fn({client, args}) {
			var query = [];
			var options = {
				page: 1,
				perpage: 48,
				order_by: 'date',
				order_direction: 'desc',
				range: 'all',
				mode: 'extended',
				rating: 'general,mature,adult',
				type: 'art,flash,photo,music,story,poetry'
			};
			for (var a of args) {
				if (/^.+:.+$/.test(a)) {
					var [opt,value] = a.split(':');
					if (opt in options) {
						options[opt] = value;
					}
				} else {
					query.push(a);
				}
			}
			query = query.join(' ');
			return FAExport.search(query, options)
			.then(data => {
				if (data.error) throw data.error;
				var e = FA.embedContents(data);
				e.title = 'Search Results for ' + query;
				return e;
			});
		},
		subcommands: {
			'user': {
				aliases: ['artist','creator','username'],
				title: 'FurAffinity',
				info: 'View information about a user.',
				parameters: ['user'],
				fn({client, args}) {
					var user = FA.sanitizeUsername(args[0]);
					return FAExport.getUser(user)
					.then(data => {
						if (data.error) throw data.error;
						return FA.embedProfile(data);
					});
				}
			},
			'gallery': {
				aliases: ['submissions'],
				title: 'FurAffinity',
				info: 'List a user\'s submissions.',
				parameters: ['user','[page]'],
				fn({client, args}) {
					var user = FA.sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getGallery(user, page)
					.then(data => {
						if (data.error) throw data.error;
						var e = FA.embedContents(data);
						e.title  = user + '\'s Gallery';
						e.footer = {text: 'Page ' + page};
						return e;
					});
				}
			},
			'scraps': {
				title: 'FurAffinity',
				info: 'List a user\'s scrapped submissions.',
				parameters: ['user','[page]'],
				fn({client, args}) {
					var user = FA.sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getScraps(user, page)
					.then(data => {
						if (data.error) throw data.error;
						var e = FA.embedContents(data);
						e.title  = user + '\'s Scraps';
						e.footer = {text: 'Page ' + page};
						return e;
					});
				}
			},
			'favorites': {
				aliases: ['faves'],
				title: 'FurAffinity',
				info: 'List a user\'s favorite submissions. (currently only works for the first page)',
				parameters: ['user','[page]'],
				fn({client, args}) {
					var user = FA.sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getFavorites(user, page)
					.then(data => {
						if (data.error) throw data.error;
						var e = FA.embedContents(data);
						e.title  = user + '\'s Favorites';
						e.footer = {text: 'Page ' + page};
						return e;
					});
				}
			},
			'journals': {
				title: 'FurAffinity',
				info: 'List journals by a user.',
				parameters: ['user','[page]'],
				fn({client, args}) {
					var user = FA.sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getJournals(user, page)
					.then(data => {
						if (data.error) throw data.error;
						var e = FA.embedContents(data);
						e.title  = user + '\'s Journals';
						e.footer = {text: 'Page ' + page};
						return e;
					});
				}
			},
			'watchers': {
				aliases: ['followers'],
				info: 'List users watching a user',
				parameters: ['user', '[page]'],
				fn({client, args}) {
					var user = FA.sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getWatchers(user, page)
					.then(data => {
						if (data.error) throw data.error;
						var e = FA.embedList(data);
						e.title  = user + '\'s Watchers';
						e.footer = {text: 'Page ' + page};
						return e;
					});
				}
			},
			'watching': {
				aliases: ['watchlist', 'following'],
				info: 'List users that a user is watching.',
				parameters: ['user', '[page]'],
				fn({client, args}) {
					var user = FA.sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getWatchlist(user, page)
					.then(data => {
						if (data.error) throw data.error;
						var e = FA.embedList(data);
						e.title  = user + '\'s Watchlist';
						e.footer = {text: 'Page ' + page};
						return e;
					});
				}
			},
			'view': {
				aliases: ['submission', 'content'],
				title: 'FurAffinity | View Submission',
				info: 'Display a submission and its stats.',
				parameters: ['id'],
				fn({client, args}) {
					var id = String(args[0]).match(/\d+/);
					return FAExport.getSubmission(id)
					.then(data => {
						if (data.error) throw data.error;
						return FA.embedSubmission(data);
					});
				}
			},
			'read': {
				aliases: ['journal'],
				title: 'FurAffinity | Read Journal',
				info: 'Display a journal. (broken at the moment)',
				parameters: ['id'],
				fn({client, args}) {
					var id = String(args[0]).match(/\d+/);
					return FAExport.getJournal(id)
					.then(data => {
						if (data.error) throw data.error;
						return FA.embedJournal(data);
					});
				}
			}
		}
	}
};
