const {Markdown:md} = require('../../Utils');

const MAX_PREFIXES      = 10;
const MAX_PREFIX_LENGTH = 30;

module.exports = {
	'prefix': {
		aliases: ['cprefix','customprefix','prefixes','cprefixes','customprefixes'],
		category: 'Discord',
		title: ':exclamation: Custom Prefixes',
		info: 'Add a custom prefix for the server or list the currently used prefixes.',
		parameters: ['[x]'],
		permissions: 'privileged',
		fn({client, server, arg}) {
			let serverTable = client.database.get('servers');
			if (arg) {
				if (arg == client.PREFIX) {
					throw 'That is the default prefix!';
				}
				if (arg.length > MAX_PREFIX_LENGTH) {
					throw `That prefix is too long! Keep it ${MAX_PREFIX_LENGTH} characters or under.`;
				}
				serverTable.modify(server.id, s => {
					s.prefixes = s.prefixes || [];
					if (s.prefixes.length == MAX_PREFIXES) {
						throw `Maximum of ${MAX_PREFIXES} custom prefixes, please!`;
					}
					if (s.prefixes.includes(arg)) {
						throw 'Already using that custom prefix in this server.';
					}
					s.prefixes.push(arg);
					return s;
				}).save();
				return 'Added: ' + md.code(arg);
			} else {
				return {
					title: ':exclamation: Custom Prefixes for ' + server.name,
					description: (serverTable.get(server.id).prefixes || []).join('\n') || 'No custom prefixes set.',
					footer: {
						text: 'Default prefix: ' + client.PREFIX
					}
				};
			}
		},
		subcommands: {
			'remove': {
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
			'clear': {
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