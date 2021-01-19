const Reminder = require('./Reminder');
const {Format:fmt} = require('../../../Utils');

module.exports = {
	id: 'reminder-scheduler',
	title: 'Reminder',
	info: 'Processes reminders in queue.',
	permissions: 'public',
	events: {
		tick(client) {
			let reminders = client.storage.reminders || [];
			let changed = false;
			let now = Date.now();
			for (let r = 0; r < reminders.length;) {
				let rem = reminders[r];
				if (now > rem.when) {
					let timePassed = now - rem.when;
					client.send(rem.who, `**Reminder!** ${timePassed > 5000 ? fmt.time(timePassed) + ' ago' : 'Right now'}: ${rem.what}`)
					.catch(e => client.error(e));
					if (rem.repeat > 0) {
						client.log('Repeating', rem);
						rem.when += rem.repeat * Math.ceil(timePassed / rem.repeat);
					} else {
						client.log('Fulfilled',rem);
						reminders.splice(r, 1);
					}
					changed = true;
				} else ++r;
			}
			if (changed) {
				client.database.get('client').save();
			}
		}
	}
};

