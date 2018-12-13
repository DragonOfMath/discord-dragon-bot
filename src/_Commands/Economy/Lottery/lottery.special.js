const Lottery = require('./Lottery');

module.exports = {
	id: 'lottery',
	title: ':confetti_ball: Lottery',
	info: 'Lottery scheduler.',
	events: {
		tick(client) {
			Lottery.main(client);
		}
	}
};
