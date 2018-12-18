const {quote,parseCSV} = require('../../../Utils');

// commands migrated from my f-list bot
module.exports = {
	'flist': {
		category: 'NSFW',
		title: 'F-List',
		info: 'Retrieve an F-List character.',
		parameters: ['name|id'],
		permissions: 'inclusive',
		nsfw: true,
		fn({client, arg}) {
			let flist = client.flist;
			if (!flist || !flist.ticket) throw 'Feature not supported!';
			
			return flist.getCharacter(arg)
			.then(character => character.embed(flist));
		},
		subcommands: {
			'kinks': {
				aliases: ['fetishes'],
				title: 'F-List',
				info: 'Display a list of kink groups, or kinks in a specified group.',
				parameters: ['[group]'],
				fn({client, arg}) {
					let flist = client.flist;
					if (!flist || !flist.ticket) throw 'Feature not supported!';
					
					if (arg) {
						let group = flist.getKinkGroup(arg);
						if (!group) {
							throw 'Unknown kink group: ' + quote(arg);
						}
						return group.embed();
					} else {
						return flist.embed();
					}
				}
			},
			'kink': {
				aliases: ['fetish'],
				title: 'F-List',
				info: 'Retrieve a description of the specified kink, by name or ID.',
				parameters: ['[kink]'],
				fn({client, arg}) {
					let flist = client.flist;
					if (!flist || !flist.ticket) throw 'Feature not supported!';
					
					let kink = flist.getKink(arg);
					if (!kink) {
						throw 'Unknown kink: ' + quote(arg);
					}
					return kink.embed();
				}
			},
			'search': {
				aliases: ['find', 'lookup', 'query'],
				title: 'F-List',
				info: 'Search for kinks matching the given keywords.',
				parameters: ['[...kinks]'],
				fn({client, args}) {
					let flist = client.flist;
					if (!flist || !flist.ticket) throw 'Feature not supported!';
					
					let kinkQuery = parseCSV(args);
					let results = flist.searchKinks(kinkQuery);
					if (results.length) {
						return {
							title: 'Kink matches for ' + kinkQuery.map(quote).join(', '),
							description: results.map(kink => kink.toString()).join('\n')
						};
					} else {
						throw 'No kinks matched your query.';
					}
				}
			}
		}
	}
};
