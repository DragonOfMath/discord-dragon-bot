module.exports = {
	id: 'goodbot-badbot',
	info: 'Who\'s a good bot?!',
	resolver({message}) {
		try {
			let adjective = message.match(/^(\w+) bot.?$/i)[1].toLowerCase();
			if (['good','awesome','best','great','nice','cool','amazing','sweet'].includes(adjective)) {
				return 'goodbot';
			}
			if (['bad','terrible','awful','stupid','dumb','worst','dumbass','idiot','retarded'].includes(adjective)) {
				return 'badbot';
			}
		} catch (e) {}
	},
	events: {
		goodbot() {
			return ':grinning:';
		},
		badbot() {
			return ':sob:';
		}
	}
};
