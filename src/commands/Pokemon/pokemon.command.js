//return;
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
		info: `Catches a random Pokémon. Cooldown: ${PokemonGame.catchCooldownTime}`,
		fn({client, userID, serverID}) {
			return PokemonGame.catchPokemon(client, userID);
		},
		subcommands: {
			'pokedex': {
				aliases: ['pokeinventory','pinventory','pinv'],
				title: PokemonGame.header,
				info: 'Displays your Pokémon. Optionally include a search term to filter Pokémon.',
				parameters: ['[user]','[page]','[search]'],
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					if (args[1]) {
						var query = args[1].toLowerCase();
						return PokemonGame.searchPokemon(client, userID, args[0],
							p => p.name.toLowerCase().includes(query) || p.species.toLowerCase().includes(query));
					} else {
						return PokemonGame.inventory(client, userID, args[0]);
					}
				}
			},
			'legendaries': {
				aliases: ['lgds'],
				title: PokemonGame.header,
				info: 'Displays your legendary Pokémon.',
				parameters: ['[user]','[page]'],
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.inventoryLegendaries(client, userID, args[0]);
				}
			},
			'favorites': {
				aliases: ['faves'],
				title: PokemonGame.header,
				info: 'Displays your faved Pokémon.',
				parameters: ['[user]','[page]'],
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.inventoryFavorites(client, userID, args[0]);
				}
			},
			'shinies': {
				aliases: ['shinys'],
				title: PokemonGame.header,
				info: 'Displays your shiny Pokémon.',
				parameters: ['[user]','[page]'],
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.inventoryShinies(client, userID, args[0]);
				}
			},
			'inventory': {
				aliases: ['items', 'iteminventory', 'iinventory', 'iinv'],
				title: PokemonGame.header,
				info: 'Displays your inventory items.',
				parameters: ['[user]'],
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.inventoryItems(client, userID);
				}
			},
			'info': {
				title: PokemonGame.header + ' | PokeID',
				info: 'Displays info about a Pokémon from your inventory.',
				parameters: ['pokemon'],
				fn({client, args, userID}) {
					return PokemonGame.displayPokemon(client, userID, args[0]);
				}
			},
			'gif': {
				title: PokemonGame.header + ' | GIF',
				info: 'Embeds a GIF of a Pokémon.',
				parameters: ['[pokemon]'],
				fn({client, args}) {
					return PokemonGame.GIF(args[0]);
				}
			},
			'rename': {
				title: PokemonGame.header + ' | Rename',
				info: 'Give one of your Pokémon a new name (limit 40 characters).',
				parameters: ['pokemon', 'name'],
				fn({client, args, userID}) {
					let [pokeID, name] = args;
					name = name.substring(0, 40);//.replace(/\s+/g,'_');
					return PokemonGame.renamePokemon(client, userID, pokeID, name);
				}
			},
			'howmany': {
				aliases: ['count'],
				title: PokemonGame.header + ' | How Many',
				info: 'Shows how many Pokemon you\'ve caught out of the total.',
				fn({client, userID}) {
					return PokemonGame.howMany(client, userID);
				}
			},
			'refresh': {
				aliases: ['f5'],
				title: PokemonGame.header + ' | Refresh Cooldown',
				info: 'Skip cooldown for catching, scavenging, and training.',
				parameters: ['[user]'],
				permissions: {
					type: 'private'
				},
				suppress: true,
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.refreshCooldown(client, userID);
				}
			},
			'reset': {
				aliases: ['clear'],
				title: PokemonGame.header + ' | Reset',
				info: 'Reset Pokémon data.',
				parameters: ['[user]'],
				permissions: {
					type: 'private'
				},
				suppress: true,
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonGame.resetInventory(client, userID);
				}
			},
			'free': {
				aliases: ['release'],
				title: PokemonGame.header + ' | Release',
				info: 'Remove one Pokémon from your inventory by its ID, then decrease your cooldown by up to 1 hour.',
				parameters: ['pokemon'],
				fn({client, args, userID}) {
					return PokemonGame.releasePokemon(client, userID, arg[0]);
				}
			},
			'trade': {
				aliases: ['give'],
				title: PokemonGame.header + ' | Trade',
				info: 'Trade a Pokémon with a friend! (Name is reset upon trading)',
				parameters: ['user', 'pokemon'],
				fn({client, args, userID}) {
					return PokemonGame.tradePokemon(client, userID, ...args);
				}
			},
			'sell': {
				title: PokemonGame.header + ' | Sell',
				info: 'Sell a Pokémon for its value. Leveled Pokémon are worth more.',
				parameters: ['pokemon'],
				fn({client, args, userID}) {
					return PokemonGame.sellPokemon(client, userID, arg[0]);
				}
			},
			'fave': {
				aliases: ['fav', 'favorite', 'favourite'],
				title: PokemonGame.header + ' | Fave',
				info: 'Favorite one of your Pokémon.',
				parameters: ['pokemon'],
				fn({client, args, userID}) {
					return PokemonGame.favoritePokemon(client, userID, args[0]);
				}
			},
			'unfave': {
				aliases: ['unfav', 'unfavorite', 'unfavourite'],
				title: PokemonGame.header + ' | Fave',
				info: 'Un-favorite one of your Pokémon.',
				parameters: ['pokemon'],
				fn({client, args, userID}) {
					return PokemonGame.unfavoritePokemon(client, userID, args[0]);
				}
			},
			
			'battle': {
				title: PokemonGame.header + ' | Battle!',
				info: 'Battle against the bot or another player!',
				fn({client, context, args}) {
					//PokemonGame.startBattle(client, context, args);
					return 'Coming Soon: Pokémon battles. A great way to earn XP or catch more Pokemon!';
				}
			},
			'item': {
				aliases: ['scavenge'],
				title: PokemonGame.header + ' | Scavenge',
				info: `Scavenge for items that you can use in battle or sell for cash! Cooldown: ${PokemonGame.scavengingCooldownTime}`,
				fn({client, userID}) {
					return PokemonGame.scavengeItem(client, userID);
				}
			},
			'candy': {
				title: PokemonGame.header + ' | Use Rare Candy',
				info: 'Use a Rare Candy from your inventory on one of your Pokémon.',
				parameters: ['pokemon'],
				fn({client, userID, args}) {
					return PokemonGame.useRareCandy(client, userID, args[0]);
				}
			},
			'train': {
				title: PokemonGame.header + ' | Train',
				info: `Give **5 XP** to one Pokémon of your choice, or one at random. Cooldown: ${PokemonGame.trainingCooldownTime}`,
				parameters: ['[pokemon]'],
				fn({client, args, userID}) {
					return PokemonGame.trainPokemon(client, userID, args[0]);
				}
			},
			'shop': {
				title: PokemonGame.header + ' | PokéShop',
				info: 'The PokéShop sells Pokéballs, battle items, and rare candies.',
				subcommands: {
					'browse': {
						aliases: ['view', 'inventory', 'inv'],
						title: PokemonGame.header,
						info: 'View the current inventory and prices of the PokéShop.',
						parameters: ['[item]'],
						fn({client, args, userID, serverID}) {
							return PokemonGame.showShopInventory(client, serverID, args[0]);
						}
					},
					'buy': {
						aliases: ['purchase'],
						title: PokemonGame.header,
						info: 'Purchase an item from the PokéShop.',
						parameters: ['item', '[amount]'],
						fn({client, args, userID, serverID}) {
							return PokemonGame.buyFromShop(client, serverID, userID, ...args);
						}
					},
					'sell': {
						title: PokemonGame.header,
						info: 'Sell an item to the PokéShop.',
						parameters: ['item', '[amount]'],
						fn({client, args, userID, serverID}) {
							return PokemonGame.sellToShop(client, serverID, userID, ...args);
						}
					}
				}
			}
		}
	}
};