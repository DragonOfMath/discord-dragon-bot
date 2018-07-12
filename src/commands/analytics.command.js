/**
	cmd_analytics.js
	Command file for retrieving and modifying Analytics tables.
*/

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
		permissions: 'inclusive',
		fn({client, args, serverID}) {
			var commands = client.commands.get(...args).map(c => c.fullID);
			var analytics = client.analytics.retrieve(client, serverID);
			return filterAnalytics(analytics, commands);
		},
		subcommands: {
			'delete': {
				aliases: ['remove', 'rem', 'del'],
				title: 'Analytics | Delete',
				info: 'Deletes specific items from the analytics table.',
				parameters: ['...items'],
				permissions: 'private',
				fn({client, args, channelID, serverID}) {
					var commands = args;
					client.analytics.delete(client, serverID, commands);
					return 'Items successfully deleted.';
				}
			},
			'merge': {
				title: 'Analytics | Merge',
				info: 'Merges two or more items in the analytics table, for cleaning up legacy commands. (You can use JSON to quickly merge multiple things, just do {keyToMerge: [...items to merge]})',
				parameters: ['dest','[...src]'],
				permissions: 'private',
				fn({client, arg, args, channelID, serverID}) {
					var things;
					try {
						things = JSON.parse(arg);
					} catch (e) {
						things = {[args[0]]: args.slice(1)};
					}
					client.analytics.merge(client, serverID, things);
					return 'Items successfully merged.';
				}
			},
			'sort': {
				title: 'Analytics | Sort',
				info: 'Sorts analytics items alphabetically (or by any way specified)',
				parameters: ['[<key|key-desc|value|value-desc>]'],
				permissions: 'private',
				fn({client, arg, channelID, serverID}) {
					client.analytics.sort(client, serverID, arg);
					return 'Items successfully sorted.';
				}
			},
			'all': {
				title: 'Analytics | All',
				info: 'Retrieves command analytics from all servers.',
				parameters: ['[...commands]'],
				permissions: 'private',
				fn({client, args, channelID}) {
					var commands = client.commands.get(...args).map(c => c.fullID);
					var analytics = client.analytics.retrieve(client);
					return filterAnalytics(analytics, commands);
				}
			},
			'session': {
				aliases: ['current', 'temp'],
				title: 'Analytics | This Session',
				info: 'Retrieve command analytics since this application started.',
				parameters: ['[...commands]'],
				fn({client, args, serverID}) {
					var commands = client.commands.get(...args).map(c => c.fullID);
					var analytics = client.analytics.retrieveTemp(serverID);
					return filterAnalytics(analytics, commands);
				},
				subcommands: {
					'all': {
						title: 'Analytics | This Session | All',
						info: 'Retrieves command analytics for this session across all servers.',
						parameters: ['[...commands]'],
						permissions: 'private',
						fn({client, args, channelID}) {
							var commands = client.commands.get(...args).map(c => c.fullID);
							var analytics = client.analytics.retrieveTemp();
							return filterAnalytics(analytics, commands);
						}
					}
				}
			},
			'toggle': {
				aliases: ['enable','disable'],
				title: 'Analytics | Enable/Disable',
				info: 'Toggle command usage tracking.',
				permissions: 'private',
				fn({client}) {
					return `Analytics is now **${client.analytics.toggle()?'enabled':'disabled'}**.`;
				}
			}
		}
	}
};

