const FList = require('./FList');

module.exports = {
	id: 'flist-heartbeat',
	category: 'NSFW',
	info: 'Maintains the API connection to F-List.',
	events: {
		tick(client) {
			if (!client.flist) {
				let auth = client.apiKeys['F-List'];
				client.flist = new FList(auth.account, auth.password);
			}
		}
	}
};
