const chan = require('./chan');

module.exports = {
	'4chan': {
		aliases: ['chan', '4ch', '4'],
		category: 'Fun',
		title: '4chan Shitpost Roulette',
		info: 'Gets a random post from one of the boards on 4chan.org (You can specify which board, else one is chosen at random)',
		parameters: ['[board]'],
		permissions: 'inclusive',
		fn({client, args, channelID}) {
			chan._4chan(args[0])
			.then(embed => client.send(channelID, '', embed))
		}
	}
}

