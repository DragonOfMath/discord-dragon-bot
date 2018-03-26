const Bank     = require('../../Bank');
const Resource = require('../../Resource');
const Session  = require('../../Session');
const {Markdown:md,Format:fmt,random,strcmp,paginate,tableify} = require('../../Utils');
const BaseFishTable = require('./fishes.json');

var   COOLDOWN = 20000; // TODO: reduce to 15000?
const COST     = 5;
const HEADER   = ':fishing_pole_and_fish:Fishing Game:tropical_fish:';
const COLOR    = 0x0080ff;
const EVENT_CHANCE      = 0.05; // % chance of a fishing event starting on any catch
const RARE_EVENT_CHANCE = 0.10; // % chance of a fishing event being rare
const HIT_CHANCE        = 0.20; // % chance of shooting a bird

const FISHING_TEMPLATE = {
	inventory: {},
	cooldown: 0,
	chests: 0,
	birds: 0,
	artifacts: 0
};

function getFishByName(table, name) {
	return table.find(f => strcmp(f.name,name));
}
function getFishesByType(table, type) {
	return table.filter(f => strcmp(f.type,query));
}
function getFishes(table, query) {
	query = query.toLowerCase();
	return table.filter(f => strcmp(f.name,query) || strcmp(f.type,query));
}

function times(x) {
	switch (x) {
		case 0: return 'none';
		case 1: return 'once';
		case 2: return 'twice';
		//case 3: return 'thrice';
		default: return x + ' times';
	}
}
function a(x) {
	if ('aeiou'.indexOf(x[0].toLowerCase()) > -1) {
		return 'an';
	} else {
		return 'a';
	}
}
function plural(x,noun) {
	if (x > 1) {
		return `${x} ${noun}s`;
	} else if (x == 1) {
		return `${x} ${noun}`;
	} else {
		return `no ${noun}s`;
	}
}

function calculateHitChance(ammo) {
	return 1 - Math.pow(1 - HIT_CHANCE, ammo);
}

class FishingAccount extends Resource {
	constructor(f) {
		super(FISHING_TEMPLATE, f);
	}
	get total() {
		let sum = 0;
		for (let e in this.inventory) {
			sum += this.inventory[e];
		}
		return sum;
	}
	get ammo() {
		return this.inventory[':gun:'] || 0;
	}
	has(fish) {
		return !!this.inventory[fish];
	}
	hasName(name) {
		let fish = getFishByName(BaseFishTable, name);
		if (!fish) {
			throw 'Invalid fish type: ' + fish;
		}
		return fish.things.some(f => !!this.inventory[f]);
	}
	hasType(type) {
		let fishes = getFishesByType(BaseFishTable, type);
		if (!fishes.length) {
			throw 'Invalid Fish type: ' + type;
		}
		return fishes.some(fish => fish.things.some(f => !!this.inventory[f]));
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
	removeByName(name) {
		var fish = getFishByName(BaseFishTable, name);
		var thing = fish.things.find(f => !!this.inventory[f]);
		if (thing) {
			this.remove(thing);
		} else {
			throw `You do not have ${a(name)} ${name} in your inventory!`;
		}
	}
	removeByType(type) {
		var fishes = getFishesByType(BaseFishTable, type);
		var things = fishes.reduce((t,f) => t.concat(f.things), []);
		var thing  = things.find(f => !!this.inventory[f]);
		if (thing) {
			this.remove(thing);
		} else {
			throw `You do not have ${a(type)} ${type} in your inventory!`;
		}
	}
	catch(table) {
		var message = '', reward = 0, bonus = 0, fish, thing;
		var ammo = this.ammo, shotsFired = 0, birdsAttacked = 0, hit = false;
		
		function rollForFish() {
			fish   = table.randomFish;
			thing  = random(fish.things);
			reward = fish.value;
		}
		
		rollForFish();
		
		// engage a bird encounter
		while (fish.name == 'Bird') {
			this.birds++;
			birdsAttacked++;
			
			// check if this is the first bird
			if (birdsAttacked > 1) {
				message += `Another **${fish.name}** ${thing} flew in and stole your catch again!\n`;
			} else {
				message += `A **${fish.name}** ${thing} flew in and stole your catch!\n`;
			}
			
			// check ammo
			if (ammo == 0) {
				message += 'Sadly, you had no **Ammo** to shoot the ' + md.bold(fish.name) + ', and it got away.';
				reward -= bonus;
				return { reward, message };
			} else if (birdsAttacked > 1) {
				message += 'With ' + md.bold(plural(ammo,'bullet')) + ' left, you shot ';
			} else {
				message += 'You shot ';
			}
			
			shotsFired = 0;
			hit = false;
			while (ammo > 0 && !hit) {
				ammo--;
				shotsFired++;
				hit = random() < HIT_CHANCE; // true = hit, false = miss
			}
			
			message += ':gun: ' + md.bold(times(shotsFired));
			
			if (hit) {
				message += random([
					' and knocked the ' + md.bold(fish.name) + ' out!',
					' and landed a solid hit on the ' + md.bold(fish.name) + '!',
					' and got a bullseye on the ' + md.bold(fish.name) + '!',
					', knocking the ' + md.bold(fish.name) + ' out of the sky!',
					', landing a solid hit on the ' + md.bold(fish.name) + '!'
				]) + '\n';
				bonus += Math.abs(fish.value);
			} else {
				message += ' but missed, letting the ' + md.bold(fish.name) + ' escape!';
				reward -= bonus;
				return { reward, message };
			}
			
			rollForFish();
		}
		
		if (birdsAttacked) {
			message += 'You recovered your catch and got ';
		} else {
			message = random('caught','reeled in','hooked','snagged','got') + ' ';
		}
		message += `${a(fish.name)} **${fish.name}** ${thing}!`;
		
		if (fish.type == 'chest') {
			try {
				this.removeByName('Key');
				this.chests++;
				message += '\nYou unlocked it with a **Key** and received the reward within!\n(1 **Key** was consumed)';
			} catch (e) {
				if (random() < 0.03) {
					reward *= 0.5;
					message += '\n' + random([
						'By sheer strength, you pry open the chest like a brute!',
						'By dumb luck, the chest was already unlocked.',
						'Thanks to locksmith training, you cleverly use a paperclip to unlock the chest!',
						'You say "Open Sesame!" and the chest magically opens!',
						'A bird precision :poop:s right into the lock, somehow unlocking it.',
						'1. Get a chest.  2. ???  3. Profit.',
						'You kick the side of the chest and it pops open!',
						'lmao it\'s not locked.'
					]);
				} else {
					reward  = 0;
					message += '\nUnfortunately, you couldn\'t open it without a **Key**. Oh well...';
				}
			}
		} else {
			this.add(thing);
			switch (fish.name) {
				case 'Key':
					message += '\n**Keys** are used for unlocking **Chests**.';
					break;
				case 'Ammo':
					message += '\n**Ammo** is used for shooting down **Birds** that may steal your catch.';
					break;
				case 'Artifact':
					message += '\n**Artifacts**, when consumed, activate a random **Fishing Event**.';
					break;
			}
		}
		
		return {reward,bonus,message};
	}
	displayInventory(query) {
		var total = this.total;
		var embed = {
			color: COLOR,
			description: '',
			footer: { text: `Total: ${total} | Chests Unlocked: ${this.chests} | Birds Encountered: ${this.birds} | Artifacts Activated: ${this.artifacts}` }
		};
		
		if (total == 0) {
			embed.description = 'Your inventory is empty! Try fishing for some.';
		} else if (query) {
			embed.fields = [];
			
			var fishing = this;
			var fishes = getFishes(BaseFishTable, query);
			if (fishes.length == 0) {
				fishes = BaseFishTable;
			}
			
			for (var fish of fishes) {
				var keys = [], count = 0;
				for (var f of fish.things) {
					if (fishing.inventory[f]) {
						keys.push(f);
						count += fishing.inventory[f];
					}
				}
				if (keys.length && count > 0) {
					embed.fields.push({
						name: `${fish.name} (${count} | ${fmt.percent(count/total)})`,
						value: keys.map(k => `${k}x${fishing.inventory[k]}`).join('  ')
						//,inline: true
					});
				}
			}
		} else {
			embed.description = Object.keys(this.inventory).filter(e => this.inventory[e]).map(e => `${e}x${this.inventory[e]}`).join('  ');
		}
		
		return embed;
	}
}

class FishingEvent extends Session {
	constructor(serverID, channelID, {fish,type,multiplier,expires}) {
		fish       = fish || random(BaseFishTable);
		type       = type || random('rarity','value');
		multiplier = Number(multiplier) || FishingEvent.randomMultiplier();
		expires    = Number(expires)    || FishingEvent.randomExpiration();
		
		// don't waste this event on worthless uneventful items
		while (fish[type] == 0) {
			fish = random(BaseFishTable);
		}
		
		super({
			id: String(Date.now()),
			category: 'fishing',
			info: 'A fishing event is happening!',
			data: { fish, type, multiplier },
			permissions: { type: 'inclusive', servers: [serverID] },
			settings: { expires, silent: false },
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
	toEmbed() {
		return {
			title: 'New Fishing Event Started!',
			color: COLOR,
			fields: [this.toField()]
		};
	}
	static randomMultiplier() {
		var m = 0;
		// slight chance the event is a powerful one
		if (random() < RARE_EVENT_CHANCE) {
			// +500% to +1000%
			m = random(20,40)/4;
		} else while (m == 0) {
			// -100% to +400% boost in catch rate/value, except 0%
			m = random(-4,16)/4;
		}
		return m;
	}
	static randomExpiration() {
		// slight chance the event is long-lasting one
		if (random() < RARE_EVENT_CHANCE) {
			// 10 to 60 minutes
			return random(1,6) * 600000;
		} else {
			return random(1,10) * 60000; // 1 to 10 minutes
		}
	}
}

/**
	Creates a copy of the base fish table with event modifiers applied
*/
class FishTable {
	constructor(fevents) {
		this.table = BaseFishTable.map(f => Object.assign({_rarity:1,_value:1}, f));
		if (fevents) for (var {data} of fevents) {
			this.getFishByName(data.fish.name)['_'+data.type] += data.multiplier;
		}
		for (var f of this.table) {
			f.rarity *= f._rarity;
			f.value  *= f._value * COST;
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
	getFishesByType(type) {
		return getFishesByType(this.table, type);
	}
	getFishes(query) {
		return getFishes(this.table, query);
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
			var {reward = 0, bonus = 0, message = ''} = fishing.catch(ft);
			if (reward > 0) {
				message += '\nReward: ' + Bank.formatCredits(reward);
			} else if (reward < 0) {
				message += '\nLoss: ' + Bank.formatCredits(reward);
			}
			if (bonus > 0) {
				message += '\nBonus: ' + Bank.formatCredits(bonus);
			}
			
			// apply reward and restriction
			fishing.cooldown = now + COOLDOWN;
			bank.changeCredits(reward + bonus - COST);
			
			// roll for a random fishing event
			if (random() < EVENT_CHANCE) {
				var evt = new FishingEvent(serverID, channelID, {});
				client.sessions.start(evt);
				message = `${md.mention(userID)} ${message}`;
				return {
					message,
					embed: evt.toEmbed()
				};
			} else {
				return message;
			}
		});
	}
	static consumeArtifact(client, userID, serverID, channelID) {
		return this.modify(client, userID, fishing => {
			try {
				fishing.removeByName('Artifact');
				fishing.artifacts++;
				var evt = new FishingEvent(serverID, channelID, {});
				client.sessions.start(evt);
				return {
					message: `${md.mention(userID)} activated an **Artifact**.`,
					embed: evt.toEmbed()
				};
			} catch (e) {
				return e;
			}
		});
	}
	static inventory(client, userID, query) {
		let embed   = this.get(client, userID).displayInventory(query);
		embed.title = `${client.users[userID].username}'s Inventory`;
		return embed;
	}
	static showFishInfo(client, serverID, query) {
		var ft = this.createModifiedFishTable(client, serverID);
		var fish = ft.getFishes(query)[0];
		if (!fish) {
			return `\`${query}\` is not a recognized fish type, or name.`;
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
					value: fish.value ? Bank.formatCredits(fish.value) : '--',
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
		
		var embed = tableify(['Name','Value','% Chance'], ft.table, function (fish) {
			return [
				fish.name,
				md.bold(fish.value ? fmt.currency(fish.value,'$',1) : '--'),
				md.bold(fmt.percent(fish.rarity/tr, 2))
			];
		});
		embed.title = 'Fish Probabilities';
		embed.color = COLOR;
		return embed;
	}
	static hitProbabilityTable(client, userID, ammo = 0) {
		if (ammo > 0) {
			var chance = calculateHitChance(ammo);
			return `The chance of hitting with ${md.bold(ammo)} ammo is ${md.bold(fmt.percent(chance))}.`;
		} else {
			ammo = this.get(client, userID).ammo;
		}
		
		// Table will show the probability of a hit with respect to how many bullets are shot
		var sample = [1,2,3,4,5,10,15,20]
		if (ammo > 0 && !sample.includes(ammo)) sample.push(ammo);
		sample = sample.sort((a,b)=>((a>b)?1:(a<b)?-1:0));
		var embed = tableify(['Ammo','% Chance'], sample, function (a) {
			var row = [a,fmt.percent(calculateHitChance(a))];
			if (a == ammo) {
				row = row.map(r => md.bold(r + ' (You)'));
			}
			return row;
		});
		embed.title = 'Hit Probability Table';
		embed.color = COLOR;
		embed.description = `Values are based on the current hit chance of ${md.bold(fmt.percent(HIT_CHANCE))}.`;
		return embed;
	}
	static showEvents(client, serverID) {
		var events = this.getEvents(client, serverID);
		//console.log(events);
		var embed = paginate(events, 1, 20, (e,i) => e[i].toField());
		embed.title = 'Fishing Events';
		embed.color = COLOR;
		return embed;
	}
	static createFishingEvent(client, serverID, channelID, descriptor = {}) {
		if (descriptor.fish) {
			descriptor.fish = getFishByName(BaseFishTable, descriptor.fish);
		}
		var evt = new FishingEvent(serverID, channelID, descriptor);
		client.sessions.start(evt);
		return evt.toEmbed();
	}
	static setCooldown(wait) {
		COOLDOWN = wait;
		return `Fishing now allowed every ${wait/1000} seconds.`;
	}
}

module.exports = Fishing;
