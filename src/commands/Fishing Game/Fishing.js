const Bank    = require('../../Bank');
const Session = require('../../Session');
const {Markdown:md,Format:fmt,random,strcmp,paginate} = require('../../Utils');
const FishTable = require('./fishes.json');

const COOLDOWN = 20000;
const COST     = 5;
const HEADER   = ':fishing_pole_and_fish:Fishing Game:tropical_fish:';
const COLOR    = 0x0080ff;
const EVENT_CHANCE = 0.08; // % chance of a fishing event starting

function getFishType(type) {
	return FishTable.find(f => strcmp(f.type,type));
}
function getFishName(name) {
	return FishTable.find(f => strcmp(f.name,name));
}
function calculateTotalRarity() {
	let r = 0;
	for (let fish of FishTable) {
		r += fish._rarity || fish.rarity;
	}
	return r;
}

class FishingAccount {
	constructor(f) {
		if (f) {
			this.inventory = f.inventory || {};
			this.cooldown  = f.cooldown  || 0;
			this.chests    = f.chests || 0;
		} else {
			this.inventory = {};
			this.cooldown  = 0;
			this.chests = 0;
		}
	}
	get total() {
		let sum = 0;
		for (let e in this.inventory) {
			sum += this.inventory[e];
		}
		return sum;
	}
	has(fish) {
		return !!this.inventory[fish];
	}
	hasType(type) {
		let fish = getFishType(type);
		if (!fish) {
			throw 'Invalid Fish type: ' + fish;
		}
		return fish.things.some(f => !!this.inventory[f]);
	}
	add(fish) {
		if (!this.inventory[fish]) {
			this.inventory[fish] = 1;
		} else {
			this.inventory[fish] += 1;
		}
	}
	remove(fish) {
		if (!this.inventory[fish]) {
			throw `${fish} is not in your inventory!`;
		}
		this.inventory[fish] -= 1;
		return fish;
	}
	removeType(type) {
		let fish = getFishType(type);
		let thing = fish.things.find(f => !!this.inventory[f]);
		if (thing) {
			this.remove(thing);
		} else {
			throw `You do not have a ${type} in your inventory!`;
		}
	}
	displayInventory() {
		let embed = {
			color: COLOR,
			description: ''
		};
		let keys = Object.keys(this.inventory);
		if (keys.length) {
			embed.footer = { text: `Total: ${this.total} | Chests Unlocked: ${this.chests}` };
			embed.description = keys.filter(e => this.inventory[e] > 0).map(e => `${e}x${this.inventory[e]}`).join('    ');
		} else {
			embed.description = 'Your inventory is empty! Try fishing for some.';
		}
		
		return embed;
	}
}

class FishingEvent extends Session {
	constructor(serverID, channelID) {
		super({
			id: String(Date.now()),
			category: 'fishing',
			info: 'A fishing event is happening!',
			data: {
				fish:       random(FishTable),
				type:       random('rarity','value'),
				multiplier: random(-4,16)/4  // -100% to +400% boost in catch rate/value
			},
			permissions: {
				type: 'inclusive',
				servers: [serverID]
			},
			settings: {
				expires: random(1,10) * 60000 // 1 to 10 minutes
			}
		});
		this.last_channel_id = channelID;
		console.log(this.data);
	}
	toField() {
		var field = {};
		field.value = 'Expires in ' + fmt.time(this.remaining);
		field.name  = this.toString();
		return field;
	}
	toString() {
		var {type,fish,multiplier} = this.data;
		if (type == 'rarity') {
			return `${fish.name} is ${fmt.percent(multiplier)} ${multiplier>0?'more':'less'} common`;
		} else {
			return `${fish.name} is worth ${fmt.percent(multiplier)} ${multiplier>0?'more':'less'}`;
		}
	}
}

class Fishing {
	static get cooldown() {
		return COOLDOWN;
	}
	static get cost() {
		return COST;
	}
	static get header() {
		return HEADER;
	}
	static get color() {
		return COLOR;
	}
	static get fishes() {
		return FishTable;
	}
	static get(client, userID) {
		if (!client.users[userID]) {
			throw `Invalid user: \`${userID}\``;
		}
		var user = client.database.get('users').get(userID);
		user.fishing = new FishingAccount(user.fishing);
		return user.fishing;
	}
	static set(client, userID, fishing) {
		if (!client.users[userID]) {
			throw `Invalid user: \`${userID}\``;
		}
		var user = client.database.get('users').get(userID);
		user.fishing = fishing;
		return this;
	}
	static modify(client, userID, fn) {
		if (!client.users[userID]) {
			throw `Invalid user: \`${userID}\``;
		}
		var message = '';
		client.database.get('users').modify(userID, user => {
			user.bank    = Bank.get(client, userID);
			user.fishing = new FishingAccount(user.fishing);
			message = fn(user.fishing, user.bank);
			return user;
		}).save();
		return typeof(message) === 'string' ? `${md.mention(userID)} ${message}` : message;
	}
	static getEvents(client, serverID) {
		var sessionIDs = client.sessions.filter((sID,session) => {
			return session.category == 'fishing' && session.permissions.servers.includes(serverID);
		});
		return sessionIDs.map(sID => client.sessions[sID]);
	}
	static fish(client, userID, channelID, serverID) {
		return this.modify(client, userID, (fishing, bank) => {
			// check bank credits
			if (bank.credits < Fishing.cost) {
				throw `You need at least ${Bank.formatCredits(Fishing.cost)} to fish!`;
			}
			
			// check fishing cooldown
			var now = Date.now();
			var timeRemaining = fishing.cooldown - now;
			if (timeRemaining > 0) {
				throw `Wait **${Math.round(timeRemaining/100)/10} seconds** before fishing again!`;
			}
			
			// get any fishing events on this server
			var events = this.getEvents(client, serverID);
			
			// adjust the fish table with data from the events
			for (var fish of FishTable) {
				fish._rarity = fish.rarity;
				fish._value = fish.value;
			}
			for (var {data} of events) {
				data.fish['_'+data.type] *= (1 + data.multiplier);
			}
			
			// fish for something
			var magicNumber = calculateTotalRarity() * random();
			var fish = FishTable.find(f => {
				if (magicNumber > f._rarity) {
					magicNumber -= f._rarity;
					return false;
				} else {
					return true;
				}
			});
			
			// process catch
			var fishEmoji, reward, message;
			if (fish) {
				fishEmoji = random(fish.things);
				reward = Fishing.cost * fish._value;

				if (fish.type == 'bird') {
					message = `was about to catch something, but a **${fish.name}** ${fishEmoji} swooped down and stole it! ${Bank.formatCredits(reward)}.`;
				} else {
					message = `${random('caught','reeled in','hooked','snagged','got')} a **${fish.name}** ${fishEmoji}! `;
					if (fish.type == 'chest') {
						if (fishing.hasType('key')) {
							fishing.removeType('key');
							message += `\nYou opened it with a **Key** and received ${Bank.formatCredits(reward)}!\n(1 **Key** was removed from your inventory)`;
							fishing.chests++;
						} else {
							reward  = 0;
							message += `\nUnfortunately, you couldn't open it without a **Key**. Oh well...`;
						}
					} else {
						fishing.add(fishEmoji);
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
			
			fishing.cooldown = now + Fishing.cooldown;
			bank.credits    += reward - Fishing.cost;
			
			// roll for a random fishing event
			if (random() < EVENT_CHANCE) {
				var evt = new FishingEvent(serverID, channelID);
				client.sessions.start(evt);
				return {
					message,
					embed: {
						title: 'New Fishing Event Started!',
						color: COLOR,
						fields: [evt.toField()]
					}
				};
			} else {
				return message;
			}
		});
	}
	static inventory(client, userID) {
		let embed   = this.get(client, userID).displayInventory();
		embed.title = `${client.users[userID].username}'s Inventory`;
		return embed;
	}
	static embedFishInfo(fish) {
		let embed = {
			title: 'Fish Info',
			color: COLOR,
			fields: []
		};
		embed.fields.push({
			name: 'Name',
			value: fish.name,
			inline: true
		});
		embed.fields.push({
			name: 'Type',
			value: fish.type,
			inline: true
		});
		embed.fields.push({
			name: 'Description',
			value: fish.info
		});
		embed.fields.push({
			name: 'Catches',
			value: fish.things.join(' ')
		});
		let rarity = fish._rarity || fish.rarity;
		let value = fish._value || fish.value;
		embed.fields.push({
			name: 'Value',
			value: `**\$${value * COST}**`,
			inline: true
		});
		let percent = Math.round(10000 * rarity / calculateTotalRarity()) / 100;
		if (percent < 0.01) {
			percent = '<0.01';
		}
		embed.fields.push({
			name: 'Rarity',
			value: `**${percent}%** chance to catch`,
			inline: true
		});
		
		return embed;
	}
	static showFishCategories() {
		let embed = {
			title: 'Fish Categories',
			color: COLOR,
			fields: []
		};
		for (let fish of FishTable) {
			embed.fields.push({
				name: fish.name,
				value: fish.things.join(' '),
				inline: true
			});
		}
		return embed;
	}
	static showEvents(client, serverID) {
		var events = this.getEvents(client, serverID);
		var embed = paginate(events, 1, 20, (e,i) => e[i].toField());
		embed.title = 'Fishing Events';
		embed.color = COLOR;
		return embed;
	}
}

module.exports = Fishing;
