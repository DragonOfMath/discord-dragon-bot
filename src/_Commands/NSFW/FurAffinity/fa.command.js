const FAExport = require('./FAExport');
const FA = require('./FurAffinity');

function sanitizeUsername(name) {
	return name.toLowerCase().replace(/[^\w\d\-\.~]/g, '');
}

module.exports = {
	'fa': {
		aliases: ['furaffinity'],
		category: 'NSFW',
		title: 'FurAffinity',
		info: 'Search submissions on FurAffinity.',
		parameters: ['query'],
		flags: ['page','perpage','order_by','order_direction','range','mode','rating','type'],
		permissions: 'inclusive',
		nsfw: true,
		fn({client, context, arg, flags}) {
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
			for (let o in options) {
				if (flags.has(o)) {
					options[o] = flags.get(o);
				}
			}
			return FAExport.search(arg, options)
			.then(data => {
				if (data.error) throw data.error;
				let gv = new FA.ContentViewer(context, data.map(sub => new FA.Submission(sub)), {
					displayName: `${FA.ContentViewer.CONFIG.displayName} | Search Results for ${query}`
				});
				gv.startBrowser(client);
			});
		},
		subcommands: {
			'user': {
				aliases: ['profile','artist','creator','username'],
				title: 'FurAffinity',
				info: 'View information about a user.',
				parameters: ['user'],
				fn({client, args}) {
					var user = sanitizeUsername(args[0]);
					return FAExport.getUser(user)
					.then(data => {
						if (data.error) throw data.error;
						let profile = new FA.Profile(data);
						return profile.embed();
					});
				}
			},
			'gallery': {
				aliases: ['submissions'],
				title: 'FurAffinity',
				info: 'List a user\'s submissions.',
				parameters: ['user', '[page]'],
				fn({client, context, args}) {
					var user = sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getGallery(user, page)
					.then(data => {
						if (data.error) throw data.error;
						let gv = new FA.ContentViewer(context, data.map(sub => new FA.Submission(sub)), {
							displayName: `${FA.ContentViewer.CONFIG.displayName} | ${user}'s Gallery`
						});
						gv.startBrowser(client);
					});
				}
			},
			'scraps': {
				title: 'FurAffinity',
				info: 'List a user\'s scrapped submissions.',
				parameters: ['user','[page]'],
				fn({client, context, args}) {
					var user = sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getScraps(user, page)
					.then(data => {
						if (data.error) throw data.error;
						let gv = new FA.ContentViewer(context, data.map(sub => new FA.Submission(sub)), {
							displayName: `${FA.ContentViewer.CONFIG.displayName} | ${user}'s Scraps`
						});
						gv.startBrowser(client);
					});
				}
			},
			'favorites': {
				aliases: ['faves'],
				title: 'FurAffinity',
				info: 'List a user\'s favorite submissions. (currently only works for the first page)',
				parameters: ['user','[page]'],
				fn({client, context, args}) {
					var user = sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getFavorites(user, page)
					.then(data => {
						if (data.error) throw data.error;
						let gv = new FA.ContentViewer(context, data.map(sub => new FA.Submission(sub)), {
							displayName: `${FA.ContentViewer.CONFIG.displayName} | ${user}'s Favorites`
						});
						gv.startBrowser(client);
					});
				}
			},
			'journals': {
				title: 'FurAffinity',
				info: 'List journals by a user.',
				parameters: ['user','[page]'],
				fn({client, context, args}) {
					var user = sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getJournals(user, page)
					.then(data => {
						if (data.error) throw data.error;
						let tv = new FA.TextViewer(context, data.map(jnl => new FA.Journal(jnl)), {
							displayName: `${FA.TextViewer.CONFIG.displayName} | ${user}'s Journals`
						});
						tv.startBrowser(client);
					});
				}
			},
			'watchers': {
				aliases: ['followers'],
				info: 'List users watching a user',
				parameters: ['user', '[page]'],
				fn({client, context, args}) {
					var user = sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getWatchers(user, page)
					.then(data => {
						if (data.error) throw data.error;
						let wv = new FA.WatchlistViewer(context, data, {
							displayName:  `${FA.WatchlistViewer.CONFIG.displayName} | ${user}'s Watchers`
						});
						wv.startBrowser(client);
					});
				}
			},
			'watching': {
				aliases: ['watchlist', 'following'],
				info: 'List users that a user is watching.',
				parameters: ['user', '[page]'],
				fn({client, context, args}) {
					var user = sanitizeUsername(args[0]);
					var page = args[1] || 1;
					return FAExport.getWatchlist(user, page)
					.then(data => {
						if (data.error) throw data.error;
						
						var e = FA.embedList(data);
						let wv = new FA.WatchlistViewer(context, data, {
							displayName:  `${FA.WatchlistViewer.CONFIG.displayName} | ${user}'s Watchlist`
						});
						wv.startBrowser(client);
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
						return new FA.Submission(data).embed();
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
						return new FA.Journal(data).embed();
					});
				}
			}
		}
	}
};
