const Constants = require('../../Constants/Pokemon');
const {Markdown:md,Format:fmt,random,strcmp} = require('../../Utils');

const PokemonMain = require('./PokemonMain');

function resolveTargetUser(args, userID) {
	let id = md.userID(args[0]);
	if (id) args.splice(0,1);
	else id = userID;
	return id;
}
function resolveImageArg(args, attachments, embeds) {
	if (args.length && isImage(args[0])) {
		return args[0];
	} else if (attachments.length && isImage(attachments[0].url)) {
		return attachments[0].url;
	} else if (embeds.length && isImage(embeds[0].url)) {
		return embeds[0].url;
	} else if (embeds.length && embeds[0].image) {
		return embeds[0].image.url;
	}
}
function isImage(img) {
	try {
		return /png|jpe?g|gif/i.test(img.split('.').pop().split('?')[0]);
	} catch (e) { return false; }
}

module.exports = {
	'pokemon': {
		aliases: ['pkmn'],
		category: 'Fun',
		title: Constants.HEADER,
		info: `Catches a random Pokémon. Cooldown: ${md.bold(fmt.time(Constants.CATCH_COOLDOWN))}`,
		permissions: 'inclusive',
		fn({client, userID, serverID}) {
			let result = PokemonMain.catchPokemon(client, userID);
			
			let type = result.pokemon.rarity;
			let embed = {
				color: Constants.COLOR,
				url: result.pokemon.wiki,
				image: { url: result.pokemon.gif },
				footer: {
					text: `ID: ${result.id}`
				}
			};
			let name = result.pokemon.species;
			if (result.pokemon.shiny) {
				name = 'Shiny ' + name;
			}
			if (type) {
				embed.description = `${md.mention(userID)} caught the ${md.underline(type)} ${md.bold(name)}!`;
			} else {
				embed.description = `${md.mention(userID)} caught a ${md.bold(name)}!`;
			}
			return embed;
		},
		subcommands: {
			'pokedex': {
				aliases: ['pokeinventory', 'pinventory', 'pinv'],
				title: Constants.HEADER,
				info: 'Displays your Pokémon. Optionally include a search term to filter Pokémon.',
				parameters: ['[query]'],
				fn({context, args}) {
					PokemonMain.displayPokedex(context, {query: args[0]});
				}
			},
			'inventory': {
				aliases: ['items', 'iteminventory', 'iinventory', 'iinv'],
				title: Constants.HEADER,
				info: 'Displays your inventory items.',
				parameters: ['[user]'],
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					return PokemonMain.displayInventory(client, userID);
				}
			},
			'info': {
				title: Constants.HEADER + ' | PokeID',
				info: 'Displays info about a Pokémon from your inventory.',
				parameters: ['pokemon'],
				fn({client, args, userID}) {
					return PokemonMain.displayPokemon(client, userID, args[0]);
				}
			},
			'gif': {
				title: Constants.HEADER + ' | GIF',
				info: 'Embeds a GIF of a Pokémon.',
				parameters: ['[pokemon]'],
				fn({client, args}) {
					return PokemonMain.GIF(args[0]);
				}
			},
			'rename': {
				title: Constants.HEADER + ' | Rename',
				info: 'Give one of your Pokémon a new name (limit 40 characters).',
				parameters: ['pokemon', 'name'],
				fn({client, args, userID}) {
					let [pokeID, name] = args;
					name = name.substring(0, 40);//.replace(/\s+/g,'_');
					let results = PokemonMain.renamePokemon(client, userID, pokeID, name);
					return `${md.mention(userID)}'s ${md.bold(results.prevname)} is now ${md.bold(results.pokemon.name)}!`;
				}
			},
			'howmany': {
				aliases: ['count', 'progress'],
				title: Constants.HEADER + ' | How Many',
				info: 'Shows how many Pokemon you\'ve caught out of the total.',
				fn({client, userID}) {
					let results = PokemonMain.howMany(client, userID);
					return `${md.mention(userID)} You caught ${md.bold(results.count)}/${md.bold(PokemonMain.pokemon.length)} Pokémon, and ${md.bold(results.lgdcount)}/${md.bold(PokemonMain.specialPokemon.length)} legendary Pokémon.`;
				}
			},
			'refresh': {
				aliases: ['f5'],
				title: Constants.HEADER + ' | Refresh Cooldown',
				info: 'Skip cooldown for catching, scavenging, and training.',
				parameters: ['[user]'],
				permissions: 'private',
				suppress: true,
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					PokemonMain.refreshCooldown(client, userID);
					return `${md.mention(userID)}'s cooldowns for catching, scavenging, and training have been skipped.`;
				}
			},
			'reset': {
				aliases: ['clear'],
				title: Constants.HEADER + ' | Reset',
				info: 'Reset Pokémon data.',
				parameters: ['[user]'],
				permissions: 'private',
				suppress: true,
				fn({client, args, userID}) {
					userID = resolveTargetUser(args, userID);
					PokemonMain.resetInventory(client, userID);
					return `${md.mention(userID)}'s entire Pokémon and item collection has been **erased**.`;
				}
			},
			'free': {
				aliases: ['release'],
				title: Constants.HEADER + ' | Release',
				info: 'Remove one Pokémon from your inventory by its ID, then decrease your cooldown by up to 1 hour.',
				parameters: ['pokemon'],
				fn({client, args, userID}) {
					let released = PokemonMain.releasePokemon(client, userID, args[0]);
					return `Your ${md.bold(released.name)} has been set free!`;
				}
			},
			'trade': {
				aliases: ['give','exchange'],
				title: Constants.HEADER + ' | Trade',
				info: 'Trade a Pokémon with a friend! (Name is reset upon trading)',
				parameters: ['user', 'pokemon'],
				fn({client, args, userID}) {
					throw 'Coming Soon: Pokémon Exchange to replace trading. No more one-sided scams!';
					
					let targetUserID = resolveTargetUser(args);
					if (!targetUserID) {
						throw 'Invalid User ID.';
					}
					
					let traded = PokemonMain.tradePokemon(client, userID, targetUserID, args.join(''));
					return `${md.mention(userID)} has given ${md.bold(traded.name)} to ${md.mention(targetUserID)}!`;
				}
			},
			'sell': {
				title: Constants.HEADER + ' | Sell',
				info: 'Sell a Pokémon for its value. Leveled and legendary Pokémon are worth more.',
				parameters: ['pokemon'],
				fn({client, arg, userID}) {
					let results = PokemonMain.sellPokemon(client, userID, arg);
					return `${md.mention(userID)} sold ${md.bold(results.pokemon.name)} ${md.strikethrough('to slavery on the Black PokéMarket')} for ${client.bank.formatCredits(results.value)}.`;
				}
			},
			'fave': {
				aliases: ['fav', 'favorite', 'favourite'],
				title: Constants.HEADER + ' | Fave',
				info: 'Favorite one of your Pokémon.',
				parameters: ['pokemon'],
				fn({client, arg, userID}) {
					let pokemon = PokemonMain.favoritePokemon(client, userID, arg);
					return `${md.mention(userID)} favorited ${md.bold(pokemon.name)}!`;
				}
			},
			'unfave': {
				aliases: ['unfav', 'unfavorite', 'unfavourite'],
				title: Constants.HEADER + ' | Fave',
				info: 'Un-favorite one of your Pokémon.',
				parameters: ['pokemon'],
				fn({client, arg, userID}) {
					let pokemon = PokemonMain.unfavoritePokemon(client, userID, arg);
					return `${md.mention(userID)} unfavorited ${md.bold(pokemon.name)}!`;
				}
			},
			'battle': {
				aliases: ['duel','fight'],
				title: Constants.HEADER + ' | Battle!',
				info: 'Battle against the bot or another player, using your active pokémon!',
				parameters: ['[opponent]'],
				fn({client, context, args}) {
					throw 'Coming Soon: Pokémon battles. A great way to earn XP or catch more pokémon!';
					let targetUserID = resolveTargetUser(args, client.userID);
					//PokemonMain.startBattle(context, targetUserID);
				}
			},
			'item': {
				aliases: ['scavenge'],
				title: Constants.HEADER + ' | Scavenge',
				info: `Scavenge for items that you can use in battle or sell for cash! Cooldown: ${md.bold(fmt.time(Constants.SCAVENGE_COOLDOWN))}`,
				fn({client, userID}) {
					let item = PokemonMain.scavengeItem(client, userID);
					return `${md.mention(userID)} got a ${md.bold(item.name)}!`;
				}
			},
			'candy': {
				title: Constants.HEADER + ' | Use Rare Candy',
				info: 'Use a Rare Candy from your inventory on one of your Pokémon.',
				parameters: ['pokemon'],
				fn({client, userID, args}) {
					let results = PokemonMain.useRareCandy(client, userID, args[0]);
					return `${md.mention(userID)} used a Rare Candy :candy: to level up ${md.bold(results.pokemon.name)} to ${md.bold('Lvl. ' + results.lvl)}!`;
				}
			},
			'active': {
				title: Constants.HEADER + ' | Get/Set Active',
				info: 'Gets or sets your Active Pokémon, which you can use for training and battling.',
				parameters: ['[pokemon]'],
				fn({client, arg, userID}) {
					let active;
					if (arg) {
						active = PokemonMain.setActivePokemon(client, userID, arg);
					} else {
						active = PokemonMain.getActivePokemon(client, userID);
					}
					if (active) {
						return 'Your active Pokémon is: ' + md.bold(active.name);
					} else {
						return 'You have no active Pokémon set!';
					}
				}
			},
			'train': {
				title: Constants.HEADER + ' | Train',
				info: `Give **5 XP** to one Pokémon of your choice, or one at random. Cooldown: ${md.bold(fmt.time(Constants.TRAIN_COOLDOWN))}`,
				parameters: ['[pokemon]'],
				fn({client, arg, userID}) {
					let results = PokemonMain.trainPokemon(client, userID, arg);
					return `${md.mention(userID)} you trained ${md.bold(results.pokemon.name)} for ${md.bold(results.xp + ' XP')}!`;
				}
			},
			'shop': {
				title: Constants.HEADER + ' | PokéShop',
				info: 'The PokéShop sells Pokéballs, battle items, and rare candies.',
				subcommands: {
					'browse': {
						aliases: ['view', 'inventory', 'inv'],
						title: Constants.HEADER,
						info: 'View the current inventory and prices of the PokéShop.',
						parameters: ['[item]'],
						fn({client, args, userID, serverID}) {
							return PokemonMain.showShopInventory(client, serverID, args[0]);
						}
					},
					'buy': {
						aliases: ['purchase'],
						title: Constants.HEADER,
						info: 'Purchase an item from the PokéShop.',
						parameters: ['item', '[amount]'],
						fn({client, args, userID, serverID}) {
							return PokemonMain.buyFromShop(client, serverID, userID, ...args);
						}
					},
					'sell': {
						title: Constants.HEADER,
						info: 'Sell an item to the PokéShop.',
						parameters: ['item', '[amount]'],
						fn({client, args, userID, serverID}) {
							return PokemonMain.sellToShop(client, serverID, userID, ...args);
						}
					}
				}
			},
			'identify': {
				title: Constants.HEADER + ' | Identify',
				info: 'Identify a pokémon based on its picture. Either link the image or upload it.',
				parameters: ['[imageURL]'],
				fn({client, args, attachments, embeds}) {
					let pokemonImageURL = resolveImageArg(args, attachments, embeds);
					if (!pokemonImageURL) {
						throw 'Please link to or upload an image.';
					}
					return PokemonMain.identify(pokemonImageURL)
					.then(pokemon => {
						if (pokemon) {
							return `It's... ${md.bold(pokemon)}!`;
						} else {
							return 'I couldn\'t identify the pokémon... try using one from the wiki.';
						}
					});
				}
			}
		}
	}
};