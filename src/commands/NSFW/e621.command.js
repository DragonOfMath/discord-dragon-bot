const e621 = require('./e621');
const {random} = require('../../Utils');

module.exports = {
	'e621': {
		aliases: ['e6','porn','pr0n','yiff'],
		category: 'NSFW',
		info: 'Search something on e621.net, maximum of 5 tags. (The `order:random` specifier will be automatically added)',
		parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
		fn({client, args, userID, channelID, serverID}) {
			let title = args.join(', ');
			let blacklist = client.database.get('servers').get(serverID).blacklist || [];
			
			return e621.searchRandom(args, blacklist)
			.then(random)
			.then(post => e621.embed(post, title));
		},
		subcommands: {
			'source': {
				aliases: ['src', 'sauce', 'saucepls', 'reverseimagesearch'],
				info: 'When given only the direct link to an image on e621, it can be tough locating the source. This command will help to locate a post with only its hash, usually given in the filename.',
				parameters: ['hash|imagelink'],
				fn({client, args, userID, channelID}) {
					return e621.reverseSearch(args[0]);
				}
			},
			'new': {
				aliases: ['newest','recent','latest'],
				info: 'Search the newest submissions on e621. Maximum of 5 tags.',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, channelID, serverID}) {
					let title = args.join(', ');
					let blacklist = client.database.get('servers').get(serverID).blacklist || [];
					
					return e621.search(args, blacklist)
					.then(random)
					.then(post => e621.embed(post, title));
				}
			},
			'top': {
				aliases: ['best'],
				info: 'Search the best submissions on e621. Maximum of 5 tags.',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, channelID, serverID}) {
					let title = args.join(', ');
					let blacklist = client.database.get('servers').get(serverID).blacklist || [];
					
					return e621.searchTop(args, blacklist)
					.then(random)
					.then(post => e621.embed(post, title));
				}
			}
		}
	}
};