const Fishing = require('./Fishing');
const {Markdown:md,Format:fmt} = require('../../Utils');

function resolveTargetUser(args, userID) {
	let id = md.userID(args[0]);
	if (id) args.splice(0,1);
	else id = userID;
	if (id) return id;
	else throw 'Invalid user ID.';
}

module.exports = {
	'fish': {
		aliases: ['fishy', 'fishing', 'feesh'],
		category: 'Fun',
		title: Fishing.header,
		info: `Catch critters of the sea to win big prizes! Each try costs **${Fishing.cost} credits** and you must wait **${fmt.time(Fishing.cooldown)}** between tries. :new: Events are here! For a limited time, fish will be harder/easier to catch, or be more/less valuable!`,
		fn({client, userID, channelID, serverID}) {
			return Fishing.fish(client, userID, channelID, serverID);
		},
		subcommands: {
			'inventory': {
				aliases: ['inv','catches'],
				title: Fishing.header,
				info: 'Displays how many of each type of fish you\'ve caught.',
				parameters: ['[user]', '[...category]'],
				fn({client, args, userID}) {
					let id = resolveTargetUser(args, userID);
					return Fishing.inventory(client, id, args.join(' '));
				}
			},
			'info': {
				aliases: ['fish'],
				title: Fishing.header,
				info: 'Displays information about a fish by its type, name, or emoji. If no argument is passed, displays the types of fish to catch.',
				parameters: ['[...fishtype|fishname|:fish:]'],
				fn({client, arg, userID, serverID}) {
					let fish = arg.trim().toLowerCase();
					if (fish) {
						return Fishing.showFishInfo(client, serverID, fish);
					} else {
						return Fishing.showFishCategories();
					}
				}
			},
			'events': {
				aliases: ['evts'],
				title: Fishing.header,
				info: 'Displays any fishing events on this server.',
				fn({client, serverID}) {
					return Fishing.showEvents(client, serverID);
				}
			},
			'event': {
				aliases: ['evt', 'artifact'],
				title: Fishing.header,
				info: 'Consumes an Artifact in your inventory to generate a random Fishing Event.',
				fn({client, userID, channelID, serverID}) {
					return Fishing.consumeArtifact(client, userID, serverID, channelID);
				}
			},
			'table': {
				title: Fishing.header,
				info: 'Displays the current catch rates of all fish types. Can sort by name, value, chance, or type.',
				parameters: ['[sortby]'],
				fn({client, args, serverID}) {
					return Fishing.showFishTable(client, serverID, args[0]);
				}
			},
			'newevent': {
				title: Fishing.header,
				info: '(Admin only) Starts a new fishing event, either from given parameters or randomized.',
				parameters: ['[...fish name]','[<rarity|value>]','[multiplier]', '[expires]'],
				permissions: {
					type: 'private'
				},
				fn({client, args, channelID, serverID}) {
					var fish, type, multiplier, expires;
					type = args.find(a => a=='rarity'||a=='value');
					if (type) {
						var idx = args.indexOf(type);
						fish       = args.slice(0,idx).join(' ');
						multiplier = args[idx+1];
						expires    = args[idx+2];
					}
					return Fishing.createFishingEvent(client, serverID, channelID, {fish, type, multiplier, expires});
				}
			},
			'hittable': {
				title: Fishing.header,
				info: 'Calculates the probability of hitting a bird, given a few sample Ammo values and the current hit percentage.',
				parameters: ['[user]','[ammo]'],
				fn({client, args, userID}) {
					let id = resolveTargetUser(args, userID);
					return Fishing.hitProbabilityTable(client, id, args[0]);
				}
			}
		}
	}
};
