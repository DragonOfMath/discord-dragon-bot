function sanitizeTags(args) {
	return args.map(x => x.replace(/ /g,'_').toLowerCase().trim());
}

module.exports = {
	'blacklist': {
		aliases: ['bl'],
		category: 'NSFW',
		title: 'e621 Tag Blacklist',
		info: 'Manage the tag blacklist for e621 content. Tags are separated by spaces; tags that *would* have spaces in them, use an underscore `_` instead (e.g. `sonic_(series)`.',
		permissions: 'privileged',
		subcommands: {
			'replace': {
				aliases: ['set'],
				title: 'e621 Tag Blacklist | Replace',
				info: 'Replace the current blacklist with the given `tags` (no tags given will clear the blacklist)',
				parameters: ['[...tags]'],
				fn({client, args, userID, serverID}) {
					var tags = sanitizeTags(args);

					client.database.get('servers').modify(serverID, server => {
						server.blacklist = tags;
						return server;
					}).save();
					return 'Updated.';
				}
			},
			'add': {
				title: 'e621 Tag Blacklist | Add',
				info: 'Add `tags` to blacklist when retrieving content from e621.',
				parameters: ['...tags'],
				fn({client, args, userID, serverID}) {
					var tags = sanitizeTags(args);
					//var tagsAdded = [];
					
					client.database.get('servers').modify(serverID, server => {
						server.blacklist = server.blacklist || [];
						for (let t of tags) {
							if (!t) continue;
							if (server.blacklist.indexOf(t) > -1) continue;
							//tagsAdded.push(t);
							server.blacklist.push(t);
						}
						return server;
					}).save();
					return 'Updated.';
				}
			},
			'remove': {
				title: 'e621 Tag Blacklist | Remove',
				info: 'Remove `tags` from the blacklist.',
				parameters: ['...tags'],
				fn({client, args, userID, serverID}) {
					args = sanitizeTags(args);
					//var tagsRemoved = [];
					
					client.database.get('servers').modify(serverID, server => {
						server.blacklist = server.blacklist || [];
						for (let t of args) {
							if (!t) continue;
							var id = server.blacklist.indexOf(t);
							if (id > -1) {
								server.blacklist.splice(id,1);
								//tagsRemoved.push(t);
							}
						}
						return server;
					}).save();
					return 'Updated.';
				}
			},
			'getblacklist':  {
				aliases: ['get'],
				title: 'e621 Tag Blacklist | Show',
				info: 'Display the current blacklist.',
				fn({client, args, userID, serverID}) {
					let server = client.database.get('servers').get(serverID);
					if (server.blacklist && server.blacklist.length) {
						return 'Total Tags: ' + server.blacklist.length + '\n```\n' + server.blacklist.join(', ') + '\n```';
					} else {
						return 'No tags in blacklist.';
					}
				}
			},
			'clearblacklist': {
				aliases: ['clear'],
				title: 'e621 Tag Blacklist | Clear',
				info: 'Removes all tags in the blacklist.',
				fn({client, args, userID, serverID}) {
					client.database.get('servers').modify(serverID, server => {
						server.blacklist = [];
						return server;
					}).save();
					return 'Updated.';
				}
			}
		}
	}
}

