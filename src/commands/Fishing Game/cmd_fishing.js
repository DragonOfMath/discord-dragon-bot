const Bank = require('../../Bank');
const {Fishing,FishingAccount} = require('./Fishing');
const {Markdown:md,random,strcmp} = require('../../Utils');

module.exports = {
	'fish': {
		aliases: ['fishy', 'fishing', 'feesh'],
		category: 'Fun',
		title: Fishing.header,
		info: `Catch critters of the sea to win big prizes! Each try costs ${Bank.formatCredits(Fishing.cost)} and you must wait ${Bank.formatTime(Fishing.cooldown)} between tries.`,
		fn({client, userID}) {
			return Bank.modify(client, userID, (bank, user) => {
				// create fishing account instance
				user.fishing = new FishingAccount(user.fishing);
				
				// check bank credits
				if (bank.credits < Fishing.cost) {
					throw `You need at least ${Bank.formatCredits(Fishing.cost)} to fish!`;
				}
				
				// check fishing cooldown
				let now = Date.now();
				let timeRemaining = user.fishing.cooldown - now;
				if (timeRemaining > 0) {
					throw `Wait **${Math.round(timeRemaining/100)/10} seconds** before fishing again!`;
				}
				
				// fish for something
				let fish = Fishing.cast();
				let fishEmoji, reward, message;
				if (fish) {
					fishEmoji = random(fish.things);
					reward = Fishing.cost * fish.value;

					if (fish.type == 'bird') {
						message = `You were about to catch something, but a **${fish.name}** ${fishEmoji} swooped down and stole it! ${Bank.formatCredits(reward)}.`;
					} else {
						message = `You ${random('caught','reeled in','hooked','snagged','got')} a **${fish.name}** ${fishEmoji}! `;
						if (fish.type == 'chest') {
							if (user.fishing.hasType('key')) {
								user.fishing.removeType('key');
								message += `\nYou opened it with a **Key** and received ${Bank.formatCredits(reward)}!\n(1 **Key** was removed from your inventory)`;
							} else {
								reward  = 0;
								message += `\nUnfortunately, you couldn't open it without a **Key**. Oh well...`;
							}
						} else {
							user.fishing.add(fishEmoji);
							if (fish.type == 'key') {
								message += '\nA **Key** can open a **Chest** you might catch in the future.';
							} else {
								message += '\nCatch Value: ' + (reward ? Bank.formatCredits(reward) : '__Nothing__');
							}
						}
					}
				} else {
					reward  = 0;
					message = random(
						'Sorry, you didn\'t catch anything...',
						'You cast your reel, but nothing bites...',
						'The sea is quiet...',
						'You wait, but no fish comes...'
					);
				}
				user.fishing.cooldown = now + Fishing.cooldown;
				bank.credits         += reward - Fishing.cost;
				
				return message;
			})
		},
		subcommands: {
			'inventory': {
				aliases: ['inv','catches'],
				title: Fishing.header,
				info: 'Displays how many of each type of fish you\'ve caught.',
				parameters: ['[user]'],
				fn({client, args, userID}) {
					let id = md.userID(args[0]) || userID;
					let u = client.database.get('users').get(id);
					u.fishing   = new FishingAccount(u.fishing);
					let embed   = u.fishing.displayInventory();
					embed.title = `${client.users[id].username}'s Inventory`;
					return embed;
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
			}
		}
	}
};
