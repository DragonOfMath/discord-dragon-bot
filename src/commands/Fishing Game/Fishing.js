const FishTable = require('./fishes.json');
const {strcmp} = require('../../Utils');

const COOLDOWN = 20000;
const COST     = 5;
const HEADER   = ':fishing_pole_and_fish:Fishing Game:tropical_fish:';
const COLOR    = 0x0080ff;

function getFishType(type) {
	return FishTable.find(f => strcmp(f.type,type));
}

class FishingAccount {
	constructor(f) {
		if (f) {
			this.inventory = f.inventory || {};
			this.cooldown  = f.cooldown  || 0;
		} else {
			this.inventory = {};
			this.cooldown  = 0;
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
			embed.footer = { text: `Total: ${this.total}` };
			embed.description = keys.filter(e => this.inventory[e] > 0).map(e => `${e}x${this.inventory[e]}`).join('    ');
		} else {
			embed.description = 'Your inventory is empty! Try fishing for some.';
		}
		
		return embed;
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
	static get totalRarity() {
		let r = 0;
		for (let fish of FishTable) {
			r += fish.rarity;
		}
		return r;
	}
	static cast() {
		let magicNumber = this.totalRarity * Math.random();
		for (let fish of FishTable) {
			if (magicNumber > fish.rarity) {
				magicNumber -= fish.rarity;
			} else {
				return fish;
			}
		}
		return null;
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
		let percent = Math.round(10000 * fish.rarity / this.totalRarity) / 100;
		if (percent < 0.01) {
			percent = '<0.01';
		}
		embed.fields.push({
			name: 'Rarity',
			value: `**${percent}%** chance to catch`
		});
		embed.fields.push({
			name: 'Value',
			value: `**\$${fish.value * COST}**`
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
}

module.exports = {
	FishingAccount,
	Fishing
};