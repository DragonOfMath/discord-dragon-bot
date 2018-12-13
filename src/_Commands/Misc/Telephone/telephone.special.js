const Telephone = require('./Telephone');

module.exports = {
	id: 'telephone-operator',
	category: 'telephone',
	info: 'Operates the telephone connections.',
	data: {
		connections: []
	},
	permissions: 'public',
	resolver({client, channel, user, isDM, message}) {
		if (isDM) for (let telephone of this.data.connections) {
			if (telephone.active && telephone.isConnected(user)) {
				telephone.send(client, user, message);
				return;
			}
		}
	}
};
