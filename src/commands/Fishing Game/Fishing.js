const Bank    = require('../../Bank');
const Session = require('../../Session');
const {Markdown:md,Format:fmt,random,strcmp,paginate} = require('../../Utils');
const BaseFishTable = require('./fishes.json');

const COOLDOWN = 20000; // TODO: reduce to 15000?
const COST     = 5;
const HEADER   = ':fishing_pole_and_fish:Fishing Game:tropical_fish:';
const COLOR    = 0x0080ff;
const EVENT_CHANCE = 0.10; // % chance of a fishing event starting

function getFishByName(table, name) {
	return table.find(f => strcmp(f.name,name));
}
function getFishByType(table, type) {
	return table.find(f => strcmp(f.type,type));
}

class FishingAccount {
	constructor(f) {
		if (f) {
			this.inventory = f.inventory || {};
			this.cooldown  = f.cooldown  || 0;
			this.chests    = f.chests || 0;
			this.birds     = f.birds  || 0;
		} else {
			this.inventory = {};
			this.cooldown  = 0;
			this.chests = 0;
			this.birds  = 0;
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
		let fish = getFishByType(BaseFishTable, type);
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
		var fish = getFishByType(BaseFishTable, type);
		var thing = fish.things.find(f => !!this.inventory[f]);
		if (thing) {
			this.remove(thing);
		} else {
			throw `You do not have a ${type} in your inventory!`;
		}
	}
	catch(fish) {
		var reward = fish.value;
		var f = random(fish.things);
		if (fish.type == 'bird') {
			this.birds++;
			return {
				reward,
				message: `was about to catch something, but a **${fish.name}** ${f} swooped down and stole it! ${Bank.formatCredits(reward)}.`
			};
		}
		
		var message = `${random('caught','reeled in','hooked','snagged','got')} a **${fish.name}** ${f}! `;
		if (fish.type == 'chest') {
			try {
				this.removeType('key');
				this.chests++;
				message += `\nYou opened it with a **Key** and received ${Bank.formatCredits(reward)}!\n(1 **Key** was removed from your inventory)`;
			} catch (e) {
				reward  = 0;
				message += `\nUnfortunately, you couldn't open it without a **Key**. Oh well...`;
			}
		} else {
			this.add(f);
			if (fish.type == 'key') {
				message += '\nA **Key** can open a **Chest** you might catch in the future.';
			} else {
				message += '\nCatch Value: ' + (reward ? Bank.formatCredits(reward) : '__Nothing__');
			}
		}
		
		return {reward,message};
	}
	displayInventory(category) {
		var embed = {
			color: COLOR,
			description: '',
			footer: { text: `Total: ${this.total} | Chests Unlocked: ${this.chests} | Birds Attacked By: ${this.birds}` }
		};
		
		if (category) {
			embed.fields = [];
			
			var fishing = this;
			function addThings(fish) {
				var keys = [];
				for (var f of fish.things) {
					if (fishing.inventory[f]) {
						keys.push(f);
					}
				}
				if (keys.length) {
					embed.fields.push({
						name: fish.name,
						value: keys.map(k => `${k}x${fishing.inventory[k]}`).join('  ')
						//,inline: true
					});
				}
			}
			
			var fish = getFishByName(BaseFishTable, category);
			if (fish) {
				addThings(fish);
			} else {
				BaseFishTable.forEach(addThings);
			}
		} else {
			var keys = Object.keys(this.inventory);
			if (keys.length) {
				embed.description = keys.filter(e => this.inventory[e]).map(e => `${e}x${this.inventory[e]}`).join('  ');
			} else {
				embed.description = 'Your inventory is empty! Try fishing for some.';
			}
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
				fish:       random(BaseFishTable),
				type:       random('rarity','value'),
				multiplier: 0 // allow this value to be rolled until it is nonzero
			},
			permissions: {
				type: 'inclusive',
				servers: [serverID]
			},
			settings: {
				expires: random(1,10) * 60000, // 1 to 10 minutes
				silent: false
			},
			events: {
				goodbye() {
					return {
						title: 'Fishing Event Ended',
						description: this.toString(),
						color: COLOR
					};
				}
			}
		});
		this.last_channel_id = channelID;
		//console.log(this.data);
		
		// don't waste this event on worthless uneventful items
		while (this.data.fish[this.data.type] == 0) {
			this.data.fish = random(BaseFishTable);
		}
		
		// slight chance the event is a powerful one
		if (random() < 0.1) {
			// +500% to +1000%
			this.data.multiplier = random(20,40)/4;
		} else while (this.data.multiplier == 0) {
			// -100% to +400% boost in catch rate/value
			this.data.multiplier = random(-4,16)/4;
		}
		
		// slight chance the event is long-lasting one
		if (random() < 0.1) {
			// 10 to 60 minutes
			this.settings.expires = random(1,6) * 600000;
		}
	}
	toField() {
		var field = {};
		field.value = 'Expires: ' + md.bold(fmt.time(this.remaining));
		field.name  = this.toString();
		return field;
	}
	toString() {
		var {type,fish,multiplier} = this.data;
		if (type == 'rarity') {
			return `${fish.name} is ${fmt.percent(Math.abs(multiplier),0)} ${multiplier>0?'more':'less'} common`;
		} else {
			return `${fish.name} is worth ${fmt.percent(Math.abs(multiplier),0)} ${multiplier>0?'more':'less'}`;
		}
	}
}

/**
	Creates a copy of the base fish table with event modifiers applied
*/
class FishTable {
	constructor(fevents) {
		this.table = BaseFishTable.map(f => Object.assign({}, f));
		if (fevents) for (var {data} of fevents) {
			this.getFishByName(data.fish.name)[data.type] *= (1 + data.multiplier);
		}
		for (var f of this.table) {
			f.value *= COST;
		}
	}
	get totalRarity() {
		return this.table.reduce((r,f) => (r + f.rarity), 0);
	}
	get randomFish() {
		var magicNumber = this.totalRarity * random();
		return this.table.find(f => {
			if (magicNumber > f.rarity) {
				magicNumber -= f.rarity;
				return false;
			} else {
				return true;
			}
		});
	}
	getFishByName(name) {
		return getFishByName(this.table, name);
	}
	getFishByType(type) {
		return getFishByType(this.table, type);
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
	static createModifiedFishTable(client, serverID) {
		var events = this.getEvents(client, serverID);
		return new FishTable(events);
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
			
			// copy the base fishing table and apply event modifiers
			var ft = this.createModifiedFishTable(client, serverID);
			
			// catch a random fish
			var {reward,message} = fishing.catch(ft.randomFish);

			// apply reward and restriction
			fishing.cooldown = now + Fishing.cooldown;
			bank.credits    += reward - Fishing.cost;
			
			// roll for a random fishing event
			if (random() < EVENT_CHANCE) {
				var evt = new FishingEvent(serverID, channelID);
				client.sessions.start(evt);
				message = `${md.mention(userID)} ${message}`;
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
	static inventory(client, userID, category) {
		let embed   = this.get(client, userID).displayInventory(category);
		embed.title = `${client.users[userID].username}'s Inventory`;
		return embed;
	}
	static showFishInfo(client, serverID, fname) {
		var ft = this.createModifiedFishTable(client, serverID);
		var fish = ft.getFishByName(fname) || ft.getFishByType(fname);
		if (!fish) {
			return `\`${fname}\` is not a recognized fish type, or name.`;
		}
		
		return {
			title: 'Fish Info',
			color: COLOR,
			fields: [
				{
					name: 'Name',
					value: fish.name,
					inline: true
				},
				{
					name: 'Type',
					value: fish.type,
					inline: true
				},
				{
					name: 'Description',
					value: fish.info
				},
				{
					name: 'Catches',
					value: fish.things.join(' ')
				},
				{
					name: 'Value',
					value: Bank.formatCredits(fish.value),
					inline: true
				},
				{
					name: 'Rarity',
					value: `**${fmt.percent(fish.rarity / ft.totalRarity, 2)}** chance to catch`,
					inline: true
				}
			]
		};
	}
	static showFishCategories() {
		return {
			title: 'Fish Categories',
			color: COLOR,
			fields: BaseFishTable.map(fish => {
				return {
					name: fish.name,
					value: fish.things.join(' '),
					inline: true
				};
			})
		};
	}
	static showFishTable(client, serverID, sortBy = 'chance') {
		var ft = this.createModifiedFishTable(client, serverID);
		var tr = ft.totalRarity;
		
		switch (sortBy.toLowerCase()) {
			case '%':
			case 'chance':
			case 'chances':
			case 'rarity':
			case 'rarities':
			case 'rareness':
			case 'probability':
			case 'probabilities':
				ft.table = ft.table.sort((a,b) => {
					if (a.rarity > b.rarity) return -1;
					if (a.rarity < b.rarity) return 1;
					return 0;
				});
				break;
			case '$':
			case 'value':
			case 'values':
			case 'price':
			case 'prices':
				ft.table = ft.table.sort((a,b) => {
					if (a.value > b.value) return -1;
					if (a.value < b.value) return 1;
					return 0;
				});
				break;
			case 'name':
			case 'names':
				ft.table = ft.table.sort((a,b) => {
					if (a.name > b.name) return -1;
					if (a.name < b.name) return 1;
					return 0;
				});
				break;
		}
		
		var nameColumn = ['--------'], valueColumn = ['--------'], rarityColumn = ['--------'];
		
		for (let fish of ft.table) {
			nameColumn.push(fish.name);
			valueColumn.push(md.bold(fmt.currency(fish.value,'$',1)));
			rarityColumn.push(md.bold(fmt.percent(fish.rarity/tr, 2)));
		}
		
		return {
			title: 'Fish Probabilities',
			color: COLOR,
			fields: [
				{
					name: 'Name',
					value: nameColumn.join('\n'),
					inline: true
				},
				{
					name: 'Value',
					value: valueColumn.join('\n'),
					inline: true
				},
				{
					name: '% Chance',
					value: rarityColumn.join('\n'),
					inline: true
				}
			]
		};
	}
	static showEvents(client, serverID) {
		var events = this.getEvents(client, serverID);
		//console.log(events);
		var embed = paginate(events, 1, 20, (e,i) => {
			if (!e[i]) {
				console.error(e,i);
				throw 'Uhhhhh, invalid event? Index: ' + i;
			}
			return e[i].toField();
		});
		embed.title = 'Fishing Events';
		embed.color = COLOR;
		return embed;
	}
}

module.exports = Fishing;
