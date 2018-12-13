const {quote,kwsearch,paginate} = require('../../Utils');

function search(query) {
	return kwsearch(require('../../static/discorddocs.json'), query, doc => doc.keywords);
}

module.exports = {
	'ddocs': {
		aliases: ['discorddocs'],
		category: 'Programming',
		title: 'Discord Docs',
		info: 'Too lazy to look for a specific piece of documentation on the Discord API? Search it here and get the relevant stuff instantly.',
		parameters: ['[topic]'],
		permissions: 'inclusive',
		fn({client, arg}) {
			if (!arg) {
				// get the whole docs themselves if there's nothing to search for
				return 'https://discordapp.com/developers/docs/';
			}
			arg = arg.toLowerCase();//.replace(/[_\s]+/g, '-');
			let matches = search(arg);
			if (matches.length > 0) {
				if (matches.length == 1) {
					// if there is exactly one match, display this alone
					let doc = matches[0].item;
					return md.bold(doc.topic) + '\n' + doc.url;
				}
				let embed = paginate(matches, 1, 20, (matches, i, match) => {
					return {
						name: `[+${match.score}] ${match.item.topic}`,
						value: match.item.url
					};
				});
				embed.title = 'Topics found with ' + quote(arg);
				embed.description = 'Ordered by relevancy';
				return embed;
			} else {
				return 'Couldn\'t find a matching topic. :confused:';
			}
		}
	}
};