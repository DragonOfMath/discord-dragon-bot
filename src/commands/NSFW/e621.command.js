const e621 = require('./e621');
const {random} = require('../../Utils');

module.exports = {
	'e621': {
		aliases: ['e6','porn','pr0n','yiff'],
		category: 'NSFW',
		info: 'Search something on e621.net, maximum of 5 tags. (The `order:random` specifier will be automatically added)',
		parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
		permissions: 'inclusive',
		fn({client, args, userID, channelID, serverID}) {
			var title = args.join(', ');
			var blacklist = client.database.get('servers').get(serverID).blacklist || [];
			
			return e621.search([...args, 'order:random'], blacklist)
			.then(random)
			.then(post => e621.embed(post, title));
		},
		subcommands: {
			'source': {
				aliases: ['src', 'sauce', 'saucepls', 'reverseimagesearch'],
				info: 'When given only the direct link to an image on e621, it can be tough locating the source. This command will help to locate a post with only its hash, usually given in the filename.',
				parameters: ['hash|imagelink'],
				fn({client, args, userID, channelID}) {
					return e621.reverseSearch(args[0])
					.then(post => e621.embed(post, 'Reverse Search'));
				}
			},
			'new': {
				aliases: ['newest','recent','latest'],
				info: 'Search the newest posts on e621.',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, channelID, serverID}) {
					var title = args.join(', ');
					var blacklist = client.database.get('servers').get(serverID).blacklist || [];
					
					return e621.search(args, blacklist)
					.then(random)
					.then(post => e621.embed(post, title));
				}
			},
			'top': {
				aliases: ['best','bestof'],
				info: 'Search the best posts on e621.',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, channelID, serverID}) {
					var title = args.join(', ');
					var blacklist = client.database.get('servers').get(serverID).blacklist || [];
					
					return e621.search([...args, 'order:score'], blacklist)
					.then(random)
					.then(post => e621.embed(post, title));
				}
			},
			'old': {
				aliases: ['oldest'],
				info: 'Search the oldest posts on e621.',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, channelID, serverID}) {
					var title = args.join(', ');
					var blacklist = client.database.get('servers').get(serverID).blacklist || [];
					
					return e621.search([...args, 'order:id_asc'], blacklist)
					.then(random)
					.then(post => e621.embed(post, title));
				}
			},
			'bad': {
				aliases: ['worst','worstof'],
				info: 'Search the *worst* posts on e621. Beware these treacherous waters, because your blacklist won\'t apply!',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, channelID, serverID}) {
					var title = args.join(', ');
					
					return e621.search([...args, 'order:score_asc'])
					.then(random)
					.then(post => e621.embed(post, title));
				}
			}
		}
	}
};