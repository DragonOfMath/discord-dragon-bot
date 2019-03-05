const {fetch} = require('../../Utils');

module.exports = {
	'google': {
		category: 'Web',
		title: 'Google Search',
		info: 'Enter a basic search query for Google.',
		parameters: ['query'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			return 'https://google.com/search?q=' + args.join('+');
		}
	},
	'bing': {
		category: 'Web',
		title: 'Bing Search',
		info: 'Enter a basic search query for Bing.',
		parameters: ['query'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			throw 'Feature not supported!';
			return 'https://bing.com/search?q=' + args.join('+');
		}
	},
	'yahoo': {
		category: 'Web',
		title: 'Yahoo Search',
		info: 'Enter a basic search query for Yahoo.',
		parameters: ['query'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			throw 'Feature not supported!';
			return 'https://yahoo.com/search?q=' + args.join('+');
		}
	},
	'duckduckgo': {
		aliases: ['ddg'],
		category: 'Web',
		title: 'DuckDuckGo Search',
		info: 'Enter a basic search query for DuckDuckGo.',
		parameters: ['query'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			throw 'Feature not supported!';
			return 'https://duckduckgo.com/search?q=' + args.join('+');
		}
	},
	'wikipedia': {
		aliases: ['wiki'],
		category: 'Web',
		title: 'Wikipedia Search',
		info: 'Enter a basic search query for Wikipedia. Or get a random Wikipedia page.',
		parameters: ['[query]'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			throw 'Feature not supported!';
			if (args.length) {
				return 'https://en.wikipedia.org/search?q=' + args.join('+');
				
			} else {
				return 'https://en.wikipedia.org/wiki:Random';
			}
		}
	},
	'youtube': {
		aliases: ['yt'],
		category: 'Web',
		title: 'YouTube Search',
		info: 'Enter a basic search query for YouTube.',
		parameters: ['query'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			throw 'Feature not supported!';
			return 'https://www.youtube.com/search?q=' + args.join('+');
		}
	},
	'vimeo': {
		category: 'Web',
		title: 'Vimeo Search',
		info: 'Enter a basic search query for Vimeo.',
		parameters: ['query'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			throw 'Feature not supported!';
			return 'https://vimeo.com/search?q=' + args.join('+');
		}
	},
	'soundcloud': {
		category: 'Web',
		title: 'SoundCloud Search',
		info: 'Enter a basic search query for SoundCloud.',
		parameters: ['query'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			throw 'Feature not supported!';
			return 'https://soundcloud.com/search?q=' + args.join('+');
		}
	},
	'lmgtfy': {
		category: 'Web',
		title: 'LMGTFY Search',
		info: 'Enter a query.',
		parameters: ['query'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			throw 'Feature not supported!';
			return 'https://lmgtfy.com/search?q=' + args.join('+');
		}
	},
	'steam': {
		category: 'Web',
		title: 'Steam Search',
		info: 'Enter a game you would like to search.',
		parameters: ['query'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, args}) {
			throw 'Feature not supported!';
			
		}
	}
};