const {MINUTE} = require('../../Constants/Time');

module.exports = {
	id: 'last-online-tracker',
	events: {
		tick(client) {
			// check the last tick
			var tick = client.storage.lastOnlineTick || 0,
				now = Date.now();
			if (now - tick >= MINUTE) {
				// update the user table for online users
				var utable = client.database.get('users');
				for (var sID in client.servers) {
					var onlineUsers = client.dutils.getUsersByStatus(client.servers[sID], 'online');
					for (var member of onlineUsers) {
						utable.set(member.id, {lastOnline: now});
					}
				}
				utable.save();
				
				client.storage = {lastOnlineTick: now};
			}
		}
	}
};
