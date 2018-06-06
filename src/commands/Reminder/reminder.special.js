const Reminder = require('./Reminder');

module.exports = {
	id: 'reminder-scheduler',
	title: 'Reminder',
	info: 'Processes reminders in queue.',
	permissions: {
		type: 'public'
	},
	events: {
		tick(client) {
			var clientTable = client.database.get('client');
			var reminders = clientTable.get(client.id).reminders;
			var changed = false;
			var now = Date.now();
			for (var r = 0; r < reminders.length;) {
				var rem = reminders[r];
				if (now > rem.when) {
					console.log('Fulfilled',rem);
					client.send(rem.who, '**Reminder!** ' + rem.what);
					reminders.splice(r, 1);
					changed = true;
				} else ++r;
			}
			if (changed) {
				clientTable.save();
			}
		}
	}
};

