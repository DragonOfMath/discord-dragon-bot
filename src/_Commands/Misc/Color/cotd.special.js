const {Color} = require('../../../Utils');
const {DAY} = require('../../../Constants/Time');

module.exports = {
	id: 'color-of-the-day',
	events: {
		tick(client) {
			var now = Date.now(), 
			    cotd = client.storage.cotd || {
				tick: 0,
				color: null
			};
			if (now - cotd.tick >= DAY) {
				cotd.tick = now;
				cotd.color = Color.random();
				client.storage = {cotd};
				client.log('New Color of the Day: ', cotd.color);
			}
		}
	}
};
