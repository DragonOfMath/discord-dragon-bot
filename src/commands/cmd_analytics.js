/**
	cmd_analytics.js
	Command file for retrieving and modifying Analytics tables.
*/

const Analytics = require('../Analytics');

function filterAnalytics(analytics, commands) {
	for (let cmd in analytics) {
		if (commands.includes(cmd)) {
			continue;
		} else {
			analytics.delete(cmd);
		}
	}
	
	return analytics.embed(false);
}

module.exports = {
	'analytics': {
		category: 'Misc',
		title: 'Analytics',
		info: 'Display statistics about bot command usage in this server.',
		parameters: ['[...commands]'],
		fn({client, args, serverID}) {
			var commands = client.commands.get(...args).map(c => c.fullID);
			var analytics = Analytics.retrieve(client, serverID);
			return filterAnalytics(analytics, commands);
		},
		subcommands: {
			'delete': {
				aliases: ['remove', 'rem', 'del'],
				title: 'Analytics | Delete',
				info: 'Deletes specific items from the analytics table.',
				parameters: ['...items'],
				permissions: {
					type: 'private'
				},
				fn({client, args, channelID, serverID}) {
					var commands = args;
					/*
					for (var a of args) {
						try {
							commands = commands.concat(client.commands.get(a).map(c => c.fullID))
						} catch (e) {
							commands.push(a)
						}
					}
					*/
					Analytics.delete(client, serverID, commands);
					return 'Items successfully deleted.';
				}
			},
			'merge': {
				title: 'Analytics | Merge',
				info: 'Merges two or more items in the analytics table, for cleaning up legacy commands. (You can use JSON to quickly merge multiple things, just do {keyToMerge: [...items to merge]})',
				parameters: ['mainitem','[...items]'],
				permissions: {
					type: 'private'
				},
				fn({client, arg, args, channelID, serverID}) {
					var things;
					try {
						things = JSON.parse(arg);
					} catch (e) {
						things = {[args[0]]: args.slice(1)};
					}
					Analytics.merge(client, serverID, things);
					return 'Items successfully merged.';
				}
			},
			'sort': {
				title: 'Analytics | Sort',
				info: 'Sorts analytics items alphabetically (or by any way specified by `sortMethod`: `key|key-desc|value|value-desc`)',
				parameters: ['[sortMethod]'],
				permissions: {
					type: 'private'
				},
				fn({client, arg, channelID, serverID}) {
					Analytics.sort(client, serverID, arg);
					return 'Items successfully sorted.';
				}
			},
			'all': {
				title: 'Analytics | All',
				info: 'Retrieves command analytics from all servers.',
				parameters: ['[...commands]'],
				permissions: {
					type: 'private'
				},
				fn({client, args, channelID}) {
					var commands = client.commands.get(...args).map(c => c.fullID);
					var analytics = Analytics.retrieve(client);
					return filterAnalytics(analytics, commands);
				}
			}
		}
	}
};

