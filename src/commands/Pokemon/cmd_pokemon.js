const PokemonGame = require('./Pokemon');
const {Markdown:md} = require('../../Utils');

function resolveTargetUser(args, userID) {
	let id = md.userID(args[0]);
	if (id) args.splice(0,1);
	else id = userID;
	return id;
}

module.exports = {
	'pokemon': {
		aliases: ['pkmn'],
		category: 'Fun',
		title: PokemonGame.header,
		info: `Catches a random Pokémon every ${PokemonGame.catchCooldownTime}.`,
		fn({client, userID, serverID}) {
			return PokemonGame.catchPokemon(client, userID);
		},
		subcommands: {
			'inventory': {
				aliases: ['inv', 'pokedex'],
				title: PokemonGame.header,
				info: 'Displays all the Pokémon you have caught.',
				parameters: ['[user]','[page]'],
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.inventory(client, userID, args[0]);
				}
			},
			'legendaries': {
				aliases: ['lgds'],
				title: PokemonGame.header,
				info: 'Displays all legendary Pokémon you have caught.',
				parameters: ['[user]','[page]'],
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.inventoryLegendaries(client, userID, args[0]);
				}
			},
			'favorites': {
				aliases: ['faves'],
				title: PokemonGame.header,
				info: 'Displays all your faved Pokémon.',
				parameters: ['[user]','[page]'],
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.inventoryFavorites(client, userID, args[0]);
				}
			},
			'id': {
				title: PokemonGame.header + ' | PokeID',
				info: 'Displays information about a Pokémon from your inventory.',
				parameters: ['...ID|name'],
				fn({client, arg, userID}) {
					return PokemonGame.displayPokemon(client, userID, arg);
				}
			},
			'gif': {
				title: PokemonGame.header + ' | GIF',
				info: 'Embeds a GIF of a Pokémon. (if none selected, one is chosen at random)',
				parameters: ['[...pokeID|name]'],
				fn({client, arg}) {
					return PokemonGame.GIF(arg);
				}
			},
			'rename': {
				title: PokemonGame.header + ' | Rename',
				info: 'Give a Pokémon in your inventory a new name (limited to 40 characters).',
				parameters: ['ID', '...name'],
				fn({client, args, userID}) {
					let [ID, ...name] = args;
					name = name.join(' ').substring(0, 40);
					return PokemonGame.renamePokemon(client, userID, ID, name);
				}
			},
			'howmany': {
				aliases: ['count'],
				title: PokemonGame.header + ' | How Many',
				info: 'Tells you how many Pokémon there are.',
				parameters: [],
				fn() {
					return `There are **${PokemonGame.pokemon.length}** Pokémon.`;
				}
			},
			'refresh': {
				aliases: ['f5'],
				title: PokemonGame.header + ' | Refresh Cooldown',
				info: 'Instantly bypass the cooldown wait. Only the bot owner may do this B)',
				parameters: ['[user]'],
				permissions: {
					type: 'private'
				},
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.refreshCooldown(client, userID);
				}
			},
			'reset': {
				aliases: ['clear'],
				title: PokemonGame.header + ' | Reset',
				info: 'Clears all Pokémon you have caught.',
				parameters: ['[user]'],
				permissions: {
					type: 'private'
				},
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.resetInventory(client, userID);
				}
			},
			'free': {
				aliases: ['release'],
				title: PokemonGame.header + ' | Release',
				info: 'Remove a Pokémon from your inventory by its ID. If you do so, your cooldown will decrease by an hour.',
				parameters: ['ID'],
				fn({client, args, userID}) {
					return PokemonGame.releasePokemon(client, userID, args[0]);
				}
			},
			'trade': {
				aliases: ['give'],
				title: PokemonGame.header + ' | Trade',
				info: 'Trade Pokémon and items with a friend! (Name is reset upon trading)',
				parameters: ['user', '...ID|name'],
				fn({client, args, userID}) {
					let [targetUserID, ...pokeID] = args;
					pokeID = pokeID.join('');
					return PokemonGame.tradePokemon(client, userID, targetUserID, pokeID);
				}
			},
			'sell': {
				title: PokemonGame.header + ' | Sell',
				info: 'Sell Pokémon or items for cash.',
				parameters: ['...ID|name'],
				fn({client, arg, userID}) {
					return PokemonGame.sellPokemon(client, userID, arg);
				}
			},
			'fave': {
				aliases: ['fav', 'favorite', 'favourite'],
				title: PokemonGame.header + ' | Fave',
				info: 'Favorite a Pokémon in your inventory.',
				parameters: ['...ID|name'],
				fn({client, arg, userID}) {
					return PokemonGame.favoritePokemon(client, userID, arg);
				}
			},
			'unfave': {
				aliases: ['unfav', 'unfavorite', 'unfavourite'],
				title: PokemonGame.header + ' | Fave',
				info: 'Un-favorite a Pokémon in your inventory.',
				parameters: ['...ID|name'],
				fn({client, arg, userID}) {
					return PokemonGame.unfavoritePokemon(client, userID, arg);
				}
			},
			
			'battle': {
				title: PokemonGame.header + ' | Battle!',
				info: 'Battle against the bot or another player!',
				fn() {
					return 'Coming Soon: Pokémon battles, items, and training.';
				}
			},
			'item': {
				title: PokemonGame.header + ' | Item',
				info: 'Scavenge for items that you can use in battle or sell for cash!',
				fn() {
					return 'Coming Soon: Pokémon battles, items, and training.';
				}
			}
		}
	}
};