/**
	cmd_info.js
	Command file for getting information about the bot.
*/

const {Markdown:md,Format:fmt} = require('../Utils');

function commands(client) {
	var total = client.commands.get().length;
	var topcmds = client.commands.length;
	var subcmds = total - topcmds;
	return [{
		name: ':dragon: Prefix',
		value: client.PREFIX,
		inline: true
	},
	{
		name: ':keyboard: Commands',
		value: `${total} (main: ${topcmds} | sub: ${subcmds})`,
		inline: true
	}];
}
function developer(client) {
	return [{
		name: ':cowboy: Owner/Developer',
		value: md.mention(client.ownerID),
		inline: true
	}];
}
function uptime(client) {
	return [{
		name: ':timer: Uptime',
		value: fmt.timestamp(client.uptime),
		inline: true
	}];
}
function ping(client, p) {
	return [{
		name: ':stopwatch: Ping',
		value: fmt.time(p),
		inline: true
	}];
}
function memory(client) {
	return [{
		name: ':control_knobs: Memory Usage',
		value: fmt.bytes(client.memory.rss),
		inline: true
	}];
}
function performance(client, p) {
	return [
		...uptime(client),
		...ping(client, p),
		...memory(client)
	];
}
function version(client) {
	return [{
		name: ':white_check_mark: Version',
		value: 'DragonBot ' + client.VERSION,
		inline: true
	},
	{
		name: ':package: Library',
		value: 'discord.io ' + client.internals.version,
		inline: true
	}];
}
function sourcecode(client) {
	return [{
		name: ':file_cabinet: GitHub',
		value: `[Repository Link](${client.SOURCE_CODE})`,
		inline: true
	}];
}
function stats(client) {
	return [{
		name: ':homes: Guilds',
		value: Object.keys(client.servers).length,
		inline: true
	},
	{
		name: ':mega: Channels',
		value: Object.keys(client.channels).length,
		inline: true
	},
	{
		name: ':busts_in_silhouette: Users',
		value: Object.keys(client.users).length,
		inline: true
	}];
}

module.exports = {
	'info': {
		aliases: ['information','bot','botinfo'],
		category: 'Info',
		info: 'Shows bot info, such as command count, uptime, ping, memory usage, and version, as well as a count of guilds, channels, and users.',
		permissions: {
			type: 'public'
		},
		fn({client, channelID}) {
			return client.ping(channelID).then(p => {
				return {
					fields: [
						...commands(client),
						...developer(client),
						...stats(client),
						...performance(client, p),
						...version(client),
						...sourcecode(client)
					]
				};
			});
		},
		subcommands: {
			'commands': {
				aliases: ['cmds'],
				info: 'Displays the number of commands currently registered.',
				permissions: {
					type: 'public'
				},
				fn({client}) {
					return {fields: commands(client)};
				}
			},
			'developer': {
				aliases: ['dev','owner'],
				info: 'Displays the bot\'s developer.',
				permissions: {
					type: 'public'
				},
				fn({client}) {
					return {fields: developer(client)};
				}
			},
			'performance': {
				info: 'Displays uptime, pint, and memory usage.',
				permissions: {
					type: 'public'
				},
				fn({client, channelID}) {
					return client.ping(channelID).then(p => ({fields: performance(client, p)}));
				}
			},
			'uptime': {
				aliases: ['up'],
				info: 'Displays how long the bot has been running.',
				permissions: {
					type: 'public'
				},
				fn({client}) {
					return {fields: uptime(client)};
				}
			},
			'ping': {
				aliases: ['ms'],
				info: 'Checks bot latency.',
				permissions: {
					type: 'public'
				},
				fn({client, channelID}) {
					return client.ping(channelID).then(p => ({fields: ping(client, p)}));
				}
			},
			'memory': {
				aliases: ['mem'],
				info: 'Checks bot memory usage.',
				permissions: {
					type: 'public'
				},
				fn({client}) {
					return {fields: memory(client)};;
				}
			},
			'version': {
				info: 'Shows bot and library versions.',
				permissions: {
					type: 'public'
				},
				fn({client}) {
					return {fields: version(client)};
				}
			},
			'src': {
				aliases: ['source','sourcecode','repo','github'],
				info: 'Gives link to GitHub repository that has the bot\'s source code, for whatever reason.',
				permissions: {
					type: 'public'
				},
				fn({client}) {
					return {fields: sourcecode(client)};
				}
			},
			'stats': {
				info: 'Shows how many guilds, channels, and users the bot is connected to.',
				permissions: {
					type: 'public'
				},
				fn({client}) {
					return {fields: stats(client)};
				}
			}
		}
	}
};

