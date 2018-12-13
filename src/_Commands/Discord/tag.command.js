const {Markdown:md} = require('../../Utils');

const TAG_LIMIT = 10;

module.exports = {
	'tag': {
		aliases: ['t','tags'],
		category: 'Discord',
		title: 'Get Tag',
		info: 'Get a server tag.',
		parameters: ['name'],
		permissions: 'privileged',
		fn({client, serverID, args}) {
			let name = args[0].toLowerCase();
			let tags = client.database.get('servers').get(serverID).tags;
			if (tags && name in tags) {
				return tags[name];
			} else {
				throw 'No tag found with the name ' + md.code(name);
			}
		},
		subcommands: {
			'set': {
				aliases: ['make','create','assign'],
				title: 'Set Tag',
				info: 'Set a server tag (maximum of 10).',
				parameters: ['name','...data'],
				fn({client, serverID, args}) {
					let [name, ...data] = args;
					name = name.toLowerCase();
					data = data.join(' ');
					client.database.get('servers').modify(serverID, serverData => {
						serverData.tags = serverData.tags || {};
						let length = Object.keys(serverData.tags);
						if (length >= TAG_LIMIT) throw `Limit of ${TAG_LIMIT} tags.`;
						serverData.tags[name] = data;
						return serverData;
					}).save();
					return 'Tag saved: ' + md.code(name);
				}
			},
			'list': {
				aliases: ['show','all'],
				title: 'List Tags',
				info: 'List server tags.',
				fn({client, serverID}) {
					let tags = client.database.get('servers').get(serverID).tags;
					if (tags) {
						return Object.keys(tags).map(md.code).join(', ');
					} else {
						return 'No tags saved.';
					}
				}
			},
			'delete': {
				aliases: ['remove','del','rem'],
				title: 'Delete Tag',
				info: 'Delete a server tag.',
				parameters: ['name'],
				fn({client, serverID, args}) {
					let name = args[0].toLowerCase();
					client.database.get('servers').modify(serverID, serverData => {
						if (serverData.tags && name in serverData.tags) {
							delete serverData.tags[name];
						} else {
							throw 'No tag found with the name ' + md.code(name);
						}
						return serverData;
					}).save();
					return 'Tag deleted: ' + md.code(name);
				}
			},
			'clear': {
				title: 'Clear Tags',
				info: 'Delete all server tags.',
				fn({client, serverID}) {
					client.database.get('servers').modify(serverID, serverData => {
						delete serverData.tags;
						return serverData;
					}).save();
					return 'Server tags cleared.';
				}
			}
		}
	}
};
