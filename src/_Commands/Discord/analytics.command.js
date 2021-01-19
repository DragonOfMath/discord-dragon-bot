const Graph = require('../Image/Graph/Graph');
const {Markdown:md} = require('../../Utils');

module.exports = {
	'analytics': {
		category: 'Discord',
		title: 'Analytics',
		info: 'Display statistics about bot command usage in this server. Use the flag `-a` or `-all` for global analytics and `-t` or `-temp` for temporary analytics (since the bot was online).',
		parameters: ['[...commands]'],
		flags: ['a|all|global','t|temp'],
		permissions: 'inclusive',
		fn({client, context, serverID, args, flags}) {
			let commands = client.commands.get(...args).map(c => c.fullID);
			let temp = flags.has('t') || flags.has('temp');
			if (flags.has('a') || flags.has('all') || flags.has('global')) {
				serverID = '';
			}
			
			let analytics = client.analytics.get(client.database, serverID, temp).filter(commands).sort();
			analytics.view(context);
		},
		subcommands: {
			'delete': {
				aliases: ['remove', 'rem', 'del'],
				title: 'Analytics | Delete',
				info: 'Deletes specific items from the analytics table.',
				parameters: ['...items'],
				flags: ['a|all'],
				permissions: 'private',
				fn({client, args, flags, serverID}) {
					let commands = args;
					
					if (flags.has('a') || flags.has('all') || flags.has('global')) {
						serverID = '';
					}
					
					client.analytics.delete(client.database, commands, serverID);
					return 'Items successfully deleted.';
				}
			},
			'merge': {
				title: 'Analytics | Merge',
				info: 'Merges two or more items in the analytics table, for cleaning up legacy commands. (You can use JSON to quickly merge multiple things, just do {keyToMerge: [...items to merge]})',
				parameters: ['dest','[...src]'],
				flags: ['a|all'],
				permissions: 'private',
				fn({client, arg, args, flags, channelID, serverID}) {
					let items;
					try {
						if (typeof(args[0]) === 'object') {
							items = args[0];
						} else {
							items = JSON.parse(arg);
						}
					} catch (e) {
						items = {[args[0]]: args.slice(1)};
					}
					
					if (flags.has('a') || flags.has('all') || flags.has('global')) {
						serverID = '';
					}
					
					client.analytics.merge(client.database, items, serverID);
					return 'Items successfully merged.';
				}
			},
			'sort': {
				title: 'Analytics | Sort',
				info: 'Sorts analytics items alphabetically (or by any way specified)',
				parameters: ['[<key|key-desc|value|value-desc>]'],
				flags: ['a|all'],
				permissions: 'private',
				fn({client, arg, channelID, serverID}) {
					client.analytics.sort(client.database, serverID, arg);
					return 'Items successfully sorted.';
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
	},
	'membercount': {
		aliases: ['membergrowth','servergrowth'],
		category: 'Discord',
		info: 'Displays the server\'s growing member count over the past 100 days.',
		permissions: 'inclusive',
		fn({client, server}) {
			let growth = client.database.get('servers').get(server.id).growth;
			let graph = Graph.createLineGraph(growth, {
				title: 'Member Count Over 100 Days',
				xaxis: 'Days',
				yaxis: 'Members',
				borders: true,
				grid: true,
				minimumY: 0
			}).image;
			if (client.DARK_MODE) graph = graph.invert();
			return graph.getBufferAs('membercount.png');
		}
	}
};

