/*
const {Markdown:md} = require('../../Utils');

module.exports = {
	'hof': {
		aliases: ['halloffame'],
		category: 'Discord',
		title: 'Hall of Fame',
		info: 'Gets/Sets the Hall-of-Fame channel that is colinked to the current channel. The Hall-of-Fame is a channel meant for curating excellent posts from another channel (or several channels) that would normally exceed the limit of 50 pinned messages.',
		parameters: ['[channel]'],
		permissions: 'privileged',
		fn({client, server, channel, args}) {
			var hofChannelID;
			if (args.length) {
				hofChannelID = md.channelID(args[0]);
				if (!hofChannelID) {
					throw 'No Hall-of-Fame provided.';
				}
				if (hofChannelID == channel.id) {
					throw 'Hall-of-Fame must be a different channel than the current one.';
				}
				client.database.get('channels').modify(channel.id, (chanData) => {
					chanData.hof = hofChannelID;
					return chanData;
				}).save();
				return 'Hall-of-Fame channel set to ' + md.channel(hofChannelID);
			} else {
				hofChannelID = client.database.get('channels').get(channel.id).hof;
				if (!hofChannelID) {
					throw 'No Hall-of-Fame channel set.';
				}
				return 'Hall-of-Fame channel: ' + md.channel(hofChannelID);
			}
		}
	}
};
*/