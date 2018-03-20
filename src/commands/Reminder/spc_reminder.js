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
			var now = Date.now();
			for (var r = 0; r < reminders.length;) {
				var rem = new Reminder(reminders[r]);
				if (now > rem.when) {
					console.log('Fulfilled',rem);
					client.sendMessage({
						to: rem.who,
						message: '**Reminder!** ' + rem.what
					});
					reminders.splice(r, 1);
					changed = true;
				} else ++r;
			}
			if (changed) {
				client.database.get('client').modify(client.id, DATA => {
					DATA.reminders = reminders;
					return DATA;
				}).save();
			}
		}
	}
};

