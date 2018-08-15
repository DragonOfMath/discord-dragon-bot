const {Markdown:md} = require('../Utils');

module.exports = {
	'prefix': {
		aliases: ['cprefix','customprefix','prefixes','cprefixes','customprefixes','prfx','cprfx','cprfxs'],
		category: 'Misc',
		title: ':exclamation: Custom Prefix',
		info: 'Add a custom prefix for the server.',
		parameters: ['x'],
		permissions: 'privileged',
		fn({client, server, arg}) {
			if (arg == client.PREFIX) {
				throw 'That is the default prefix!';
			}
			client.database.get('servers').modify(server.id, s => {
				s.prefixes = s.prefixes || [];
				if (s.prefixes.includes(arg)) {
					throw 'Already using that custom prefix in this server.';
				}
				s.prefixes.push(arg);
				return s;
			}).save();
			return 'Added: ' + md.code(arg);
		},
		subcommands: {
			'List': {
				aliases: ['view','show'],
				info: 'List all custom prefixes used in this server.',
				permissions: 'public',
				fn({client, server}) {
					return {
						title: ':exclamation: Custom Prefixes for ' + server.name,
						description: (client.database.get('servers').get(server.id).prefixes || []).join('\n') || 'No custom prefixes set.',
						footer: {
							text: 'Default prefix: ' + client.PREFIX
						}
					};
				}
			},
			'Remove': {
				aliases: ['delete'],
				info: 'Remove a custom prefix from the server.',
				parameters: ['x'],
				fn({client, server, arg}) {
					if (arg == client.PREFIX) {
						throw 'Cannot remove the default prefix!';
					}
					client.database.get('servers').modify(server.id, s => {
						s.prefixes = s.prefixes || [];
						let idx = s.prefixes.indexOf(arg);
						if (idx < 0) {
							throw 'Server does not have that prefix.';
						}
						s.prefixes.splice(idx, 1);
						return s;
					}).save();
					return 'Removed: ' + md.code(arg);
				}
			},
			'Clear': {
				aliases: ['deleteall','removeall'],
				info: 'Remove all custom prefixes from the server.',
				fn({client, server}) {
					client.database.get('servers').modify(server.id, s => {
						s.prefixes = [];
						return s;
					}).save();
					return 'All custom prefixes for the server removed.';
				}
			}
		}
	}
};