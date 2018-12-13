const Birthday = require('./Birthday');
const {Array} = require('../../../Utils');

var celebrating = false;

module.exports = {
	id: 'birthday-scheduler',
	title: 'Happy Birthday!',
	info: 'Celebrates birthdays across Discord every noon!',
	permissions: 'public',
	events: {
		tick(client) {
			if (celebrating) return; // semaphore to avoid overlapping celebrations
			let td = new Date();
			if (td.getHours() == 12 && td.getMinutes() == 0 && td.getSeconds() == 0) {
				let bdays = Birthday.getTodaysBirthdays(client);
				if (bdays.length) {
					celebrating = true;
					Array.forEachAsync(bdays, ({user,bday}) => {
						return Birthday.celebrate(client, user, bday);
					})
					.then(() => {
						celebrating = false;
					});
				}
			}
		}
	}
};
