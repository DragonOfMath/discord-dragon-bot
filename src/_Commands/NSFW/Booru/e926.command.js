const e926 = require('./e926');
const PoolViewer = require('./PoolViewer');
const {random,md5} = require('../../../Utils');

module.exports = {
	'e926': {
		aliases: ['e9','sfwporn','sfwpr0n'],
		category: 'NSFW',
		info: 'Search something on e926.net (the SFW alternative of e621.net), maximum of 5 tags. (The `order:random` specifier will be automatically added)',
		parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
		permissions: 'inclusive',
		fn({client, args, userID, serverID}) {
			var blacklist = client.database.get('servers').get(serverID).blacklist;
			
			return e926.search([...args, 'order:random'], blacklist)
			.then(random)
			.then(post => post.embed(args.join(', ')));
		},
		subcommands: {
			'source': {
				aliases: ['src', 'sauce', 'saucepls', 'reverseimagesearch'],
				info: 'When given only the direct link to an image on e926, it can be tough locating the source. This command will help to locate a post with only its hash, usually given in the filename.',
				parameters: ['hash|imagelink'],
				fn({client, args, userID}) {
					let hash = md5(args[0]);
					if (!hash) {
						throw 'Invalid MD5 hash.';
					}
					return e926.reverseSearch(hash)
					.then(post => post.embed('Reverse Search'));
				}
			},
			'pool': {
				info: 'Browse the posts of a pool.',
				parameters: ['poolID'],
				fn({client, context, args}) {
					return e926.getPool(String(args[0]).match(/pool\/show\/(\d+)/)[1])
					.then(pool => {
						let pv = new PoolViewer(context, pool);
						pv.startBrowser(client);
					});
				}
			},
			'new': {
				aliases: ['newest','recent','latest'],
				info: 'Search the newest posts on e926.',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, serverID}) {
					let blacklist = client.database.get('servers').get(serverID).blacklist;
					
					return e926.search(args, blacklist)
					.then(random)
					.then(post => post.embed(args.join(', ')));
				}
			},
			'top': {
				aliases: ['best','bestof'],
				info: 'Search the best posts on e926.',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, serverID}) {
					let blacklist = client.database.get('servers').get(serverID).blacklist;
					
					return e926.search([...args, 'order:score'], blacklist)
					.then(random)
					.then(post => post.embed(args.join(', ')));
				}
			},
			'old': {
				aliases: ['oldest'],
				info: 'Search the oldest posts on e926.',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, serverID}) {
					let blacklist = client.database.get('servers').get(serverID).blacklist;
					
					return e926.search([...args, 'order:id_asc'], blacklist)
					.then(random)
					.then(post => post.embed(args.join(', ')));
				}
			},
			'bad': {
				aliases: ['worst','worstof'],
				info: 'Search the *worst* posts on e926. Beware these treacherous waters, because your blacklist won\'t apply!',
				parameters: ['tag1','[tag2]','[tag3]','[tag4]','[tag5]'],
				fn({client, args, userID, serverID}) {
					return e926.search([...args, 'order:score_asc'])
					.then(random)
					.then(post => post.embed(args.join(', ')));
				}
			}
		}
	}
};