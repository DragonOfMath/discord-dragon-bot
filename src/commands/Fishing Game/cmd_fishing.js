const Fishing = require('./Fishing');
const {Markdown:md,Format:fmt,strcmp} = require('../../Utils');

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
				parameters: ['[user]'],
				fn({client, args, userID}) {
					let id = resolveTargetUser(args, userID);
					return Fishing.inventory(client, id);
				}
			},
			'info': {
				aliases: ['fish'],
				title: Fishing.header,
				info: 'Displays information about a fish by its type, name, or emoji. If no argument is passed, displays the types of fish to catch.',
				parameters: ['[...fishtype|fishname|:fish:]'],
				fn({client, arg, args, userID}) {
					let fish = arg.trim().toLowerCase();
					if (fish) {
						for (let f of Fishing.fishes) {
							if (strcmp(f.name,fish) || strcmp(f.type,fish) || f.things.includes(fish)) {
								return Fishing.embedFishInfo(f);
							}
						}
						return `\`${fish}\` is not a recognized fish type, name, or emoji.`;
					} else {
						return Fishing.showFishCategories();
					}
				}
			},
			'events': {
				aliases: ['event', 'evts', 'evt'],
				title: Fishing.header,
				info: 'Displays any fishing events on this server.',
				fn({client, serverID}) {
					return Fishing.showEvents(client, serverID);
				}
			}
		}
	}
};
