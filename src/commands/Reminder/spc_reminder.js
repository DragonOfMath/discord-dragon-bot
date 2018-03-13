const Reminder = require('./Reminder.js');

module.exports = {
	id: 'reminder-scheduler',
	title: 'Reminder',
	info: 'Processes reminders in queue.',
	permissions: {
		type: 'public'
	},
	events: {
		tick(client) {
			var reminders = client.database.get('client').get(client.id).reminders || [];
			var changed = false;
			for (var r = 0; r < reminders.length;) {
				var rem = new Reminder(r);
				if (rem.expired) {
					rem.resolve(client);
					reminders.splice(r, 1);
					changed = true;
				} else ++r;
			}
			if (changed) {
				client.database.get('client').modify(client.id, DATA => {
					DATA.reminders = reminders;
				}).save();
			}
		}
	}
};

