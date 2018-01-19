const Bank        = require('../../Bank');
const Resource    = require('../../Resource');
const TypeMapBase = require('../../TypeMapBase');
const {Markdown:md,Format:fmt,paginate,tableify,random,strcmp} = require('../../Utils');
const PokemonList        = require('./pokemon.json');
const SpecialPokemonList = require('./pokemon_special.json');
const PokemonItemList    = require('./pokemon_items.json');

const HEADER     = `Pokémon:tm:`;
const COLOR      = 0xFF0000;
const CATCH_COOLDOWN    = 2 * 60 * 60 * 1000; // 2 hours
const SCAVENGE_COOLDOWN = 1 * 60 * 60 * 1000; // 1 hour
const TRAIN_COOLDOWN    =     30 * 60 * 1000; // 30 minutes
const TRAIN_XP          = 5; // XP gained when training

const PAGINATION = 15; // items per page

const SHINY_CHANCE = 0.03; // % chance to catch a shiny pokemon
const SHINY_MULT   = 10;   // base value multiplier for shinies

const PKMN_TEMPLATE = {
	name: '',
	spc: -1,
	//fav: 0,
	//shiny: 0,
	//lvl: 0,
	xp: 0
};
const USER_TEMPLATE = {
	pokemon: (p) => new Pokedex(p),
	items: {},
	totalCaught: 0,
	cooldown: 0,
	trained: 0,
	scavenged: 0
};

class Pokemon extends Resource {
	constructor(p) {
		super(PKMN_TEMPLATE);
		if (typeof(p) === 'object') {
			this.init(p);
		} else {
			this.name = p;
			this.species = p;
		}
	}
	get lvl() {
		return XPtoLevel(this.xp);
	}
	set lvl(l) {
		this.xp = levelToXP(l);
	}
	get species() {
		return PokemonList[this.spc];
	}
	set species(x) {
		this.spc = PokemonList.indexOf(x);
	}
	get speciesWeb() {
		return this.species.replace(/[^\w\d]/g,'').toLowerCase();
	}
	get starName() {
		return this.name + (this.fav ? ':star:' : '');
	}
	get wiki() {
		return `https://bulbapedia.bulbagarden.net/wiki/${this.species.replace(/\s+/g,'_')}_(Pok%C3%A9mon)`;
	}
	get gif() {
		return `https://play.pokemonshowdown.com/sprites/xyani${this.shiny?'-shiny':''}/${this.speciesWeb}.gif`;
	}
	get sprite() {
		return `https://raw.githubusercontent.com/Wonder-Toast/Pokemon-PNG/master/nrml/${this.speciesWeb}.png`;
	}
	get sprite2() {
		return `https://cdn.rawgit.com/msikma/pokesprite/master/icons/pokemon/regular/${this.speciesWeb}.png`;
	}
	get rarity() {
		var spc = this.species;
		return Object.keys(SpecialPokemonList).find(type => SpecialPokemonList[type].includes(spc));
	}
	get baseValue() {
		var base = 0;
		switch (this.rarity) {
			case 'legendary':
				base = 100000;
				break;
			case 'mythical':
				base = 50000;
				break;
			case 'rare':
				base = 10000;
				break;
			default:
				base = 500;
				break;
		}
		if (this.shiny) {
			base *= SHINY_MULT;
		}
		return base;
	}
	get value() {
		var mult = 1 + Math.log10(this.lvl);
		return Math.floor(this.baseValue * mult);
	}
	displayInfo() {
		let lvl = this.lvl;
		let nextXP = levelToXP(lvl+1);
		return {
			color: COLOR,
			fields: [
				{
					name: 'Name',
					value: this.name,
					inline: true
				},
				{
					name: 'Species',
					value: this.species + (this.shiny ? ' (Shiny)' : ''),
					inline: true
				},
				{
					name: 'Favorite',
					value: this.fav ? 'Yes' : 'No',
					inline: true
				},
				{
					name: 'Level',
					value: lvl,
					inline: true
				},
				{
					name: 'XP',
					value: `${this.xp} (${nextXP-this.xp} to next Lvl.)`,
					inline: true
				},
				{
					name: 'Value',
					value: Bank.formatCredits(this.value),
					inline: true
				}
			],
			url: this.wiki,
			image: { url: this.gif },
			thumbnail: { url: this.sprite2 }
		};
	}
	embedGIF() {
		return {
			color: COLOR,
			url: this.wiki,
			image: { url: this.gif }
		};
	}
}

class Pokedex extends TypeMapBase {
	constructor(pokemon = {}) {
		super(Pokemon);
		for (let p in pokemon) {
			this.set(p, this.create(pokemon[p]));
		}
	}
	get ids() {
		return this.keys;
	}
	get mons() {
		return this.items;
	}
	get(pokeID) {
		if (this.has(pokeID)) {
			return this[pokeID];
		} else {
			let p = this.mons.find(m => strcmp(m.name, pokeID));
			if (p) return p;
		}
		throw `Invalid Pokemon ID: ${pokeID}`;
	}
	getID(pokeID) {
		if (this.has(pokeID)) {
			return pokeID;
		} else {
			let p = this.ids.find(id => strcmp(this[id].name, pokeID));
			if (p) return p;
		}
		throw `Invalid Pokemon ID: ${pokeID}`;
	}
	add(id,p) {
		if (!(p instanceof Pokemon)) {
			p = new Pokemon(p);
			if (random() < SHINY_CHANCE) p.shiny = 1;
		}
		p.name = p.species + '#' + id;
		this.set(id, p);
		return p;
	}
	remove(id) {
		id = this.getID(id);
		let p = this.get(id);
		p.fav = false;
		this.delete(id);
		return p;
	}
}

class PkmnAccount extends Resource {
	constructor(user) {
		super(USER_TEMPLATE, user);
	}
	addPokemon(p) {
		let id = this.totalCaught++;
		return this.pokemon.add(id, p);
	}
	removePokemon(id) {
		return this.pokemon.remove(id);
	}
	tradePokemon(to, id) {
		let p = this.removePokemon(id);
		return to.addPokemon(p);
	}
	catchARandomPokemon() {
		let now = Date.now();
		let timeLeft = this.cooldown - now;
		if (timeLeft > 0) {
			return `Wait ${md.bold(fmt.time(timeLeft))} before catching another Pokémon!`;
		}
		this.cooldown = now + CATCH_COOLDOWN;
		return this.addPokemon(random(PokemonList));
	}
	trainPokemon(id) {
		let now = Date.now();
		let timeLeft = this.trained - now;
		if (timeLeft > 0) {
			return `Wait ${md.bold(fmt.time(timeLeft))} before training your Pokémon!`;
		}
		
		let p = this.pokemon.get(id);
		p.xp += TRAIN_XP;
		
		this.trained = now + TRAIN_COOLDOWN;
		
		return `${md.bold(p.name)} gained ${md.bold(TRAIN_XP+' XP')} from training! `;
	}
	hasItem(item) {
		return !!this.items[item.id];
	}
	addItem(item, amt = 1) {
		let id = item.id;
		this.items[id] = (this.items[id] || 0) + amt;
		return item;
	}
	removeItem(item, amt = 1) {
		let id = item.id;
		if (this.items[id]) {
			this.items[id] -= amt;
		} else {
			throw `${item.name} is not in your inventory!`;
		}
		return this;
	}
	scavengeForARandomItem() {
		let now = Date.now();
		let timeLeft = this.scavenged - now;
		if (timeLeft > 0) {
			return `Wait ${md.bold(fmt.time(timeLeft))} before scavenging again!`;
		}
		this.scavenged = now + SCAVENGE_COOLDOWN;
		
		let totalRarity = PokemonItemList.reduce((r,i) => r += i.rarity, 0);
		let magicNumber = totalRarity * random();
		for (var item of PokemonItemList) {
			if (magicNumber > item.rarity) {
				magicNumber -= item.rarity;
			} else {
				break;
			}
		}
		//console.log('Item:',item);
		return this.addItem(item);
	}
	displayPokemonInventory(page, filter) {
		let pokemon = this.pokemon;
		let ids = pokemon.ids;
		if (typeof(filter) === 'function') {
			ids = ids.filter(id => filter(pokemon[id]));
		}
		
		let embed = paginate(ids, page, PAGINATION, function(p, i) {
			let id = p[i];
			let mon = pokemon[id];
			return {
				name:  `${mon.starName} (ID: ${id})`,
				value: `${mon.species} Lvl. ${mon.lvl}`,
				inline: true
			};
		});
		embed.color = COLOR;
		return embed;
	}
	displayItemInventory(page) {
		let color = COLOR;
		let fields = {};
		let ikeys = Object.keys(this.items);
		for (let {id,name,title} of PokemonItemList) {
			if (ikeys.includes(id)) {
				(fields[title] || (fields[title] = [])).push(`${name} (x${this.items[id]})`);
			}
		}
		fields = Object.keys(fields).map(name => ({name,value:fields[name].join('\n'),inline:true}));
		return { color, fields };
	}
	displayPokemonInfo(pokeID) {
		return this.pokemon.get(pokeID).displayInfo();
	}
	favoritePokemon(pokeID) {
		let p = this.pokemon.get(pokeID);
		p.fav = 1;
		return p;
	}
	unfavoritePokemon(pokeID) {
		let p = this.pokemon.get(pokeID);
		delete p.fav;
		return p;
	}
}

class PokeShop {
	static inventory() {
		let fields = {};
		for (let item of PokemonItemList) {
			(fields[item.title] || (fields[item.title] = [])).push([item.name, md.bold(fmt.currency(item.value,'$',1))]);
		}
		let embed = tableify(['Item','Price'], Object.keys(fields), function (name) {
			return [
				md.bold(name) + '\n' + fields[name].map(i => i[0]).join('\n'),
				'----'        + '\n' + fields[name].map(i => i[1]).join('\n')
			];
		});
		embed.title = 'PokéShop Inventory';
		embed.color = COLOR;
		return embed;
	}
	static displayItemInfo(item) {
		item = getItemDescriptor(item);
		if (!item) {
			throw 'Invalid item.';
		}
		return {
			title: 'PokéShop Item Info',
			color: COLOR,
			fields: [
				{
					name: 'Name',
					value: item.name,
					inline: true
				},
				{
					name: 'ID',
					value: item.id,
					inline: true
				},
				{
					name: 'Type',
					value: item.type,
					inline: true
				},
				{
					name: 'Description',
					value: item.info,
					inline: true
				},
				{
					name: 'Value',
					value: Bank.formatCredits(item.value),
					inline: true
				}
			]
		};
	}
	static buy(pkmn, bank, itemname, quantity = 1) {
		var item = getItemDescriptor(itemname);
		if (!item) {
			throw `Shop inventory does not have a "${itemname}"!`;
		}
		quantity = Number(quantity);
		if (isNaN(quantity) || quantity < 1) {
			throw `Please specify how many items you wish to buy (1 or more).`;
		}
		var total = item.value * quantity;
		if (bank.credits < total) {
			throw md.italics(`Insufficient funds for purchase: Overdraw of ${Bank.formatCredits(bank.credits-total)}`);
		}
		
		bank.changeCredits(-total);
		//var msg = bank.withdraw(total);
		pkmn.addItem(item, quantity);
		return `You bought ${md.bold(fmt.plural(item.name,quantity))} for ${Bank.formatCredits(total)}!`;
	}
	static sell(pkmn, bank, itemname, quantity = 1) {
		item = getItemDescriptor(itemname);
		if (!item) {
			throw `Shop inventory does not have a "${itemname}"!`;
		}
		quantity = Number(quantity);
		if (isNaN(quantity) || quantity < 1) {
			throw `Please specify how many items you wish to sell (1 or more).`;
		}
		if ((pkmn.items[item.id]||0) < quantity) {
			throw `You cannot sell ${quantity} when you only have ${pkmn.items[item.id]||0}!`;
		}
		
		var total = (item.value / 2) * quantity;
		bank.changeCredits(total);
		//var msg = bank.deposit(total);
		pkmn.removeItem(item, quantity);
		return `You sold ${md.bold(fmt.plural(item.name,quantity))} for ${Bank.formatCredits(total)}!`;
	}
}

class PokemonGame {
	static get header() {
		return HEADER;
	}
	static get color() {
		return COLOR;
	}
	static get cooldown() {
		return CATCH_COOLDOWN;
	}
	static get scavengingCooldown() {
		return SCAVENGE_COOLDOWN;
	}
	static get trainingCooldown() {
		return TRAIN_COOLDOWN;
	}
	static get pagination() {
		return PAGINATION;
	}
	static get pokemon() {
		return PokemonList;
	}
	static get legendaryPokemon() {
		return SpecialPokemonList.legendary;
	}
	static get mythicalPokemon() {
		return SpecialPokemonList.mythical;
	}
	static get rarePokemon() {
		return SpecialPokemonList.rare;
	}
	static get specialPokemon() {
		return this.legendaryPokemon.concat(this.mythicalPokemon, this.rarePokemon);
	}
	static get catchCooldownTime() {
		return md.bold(fmt.time(CATCH_COOLDOWN));
	}
	static get scavengingCooldownTime() {
		return md.bold(fmt.time(SCAVENGE_COOLDOWN));
	}
	static get trainingCooldownTime() {
		return md.bold(fmt.time(TRAIN_COOLDOWN));
	}
	static get(client, userID) {
		if (!client.users[userID]) {
			throw 'Invalid user.';
		}
		let user = client.database.get('users').get(userID);
		user.pokemon = new PkmnAccount(user.pokemon);
		return user.pokemon;
	}
	static set(client, userID, pkmn) {
		let user = client.database.get('users').get(userID);
		user.pokemon = pkmn;
		return this;
	}
	static modify(client, userID, fn) {
		if (!client.users[userID]) {
			throw 'Invalid user.';
		}
		let message = '';
		client.database.get('users').modify(userID, user => {
			user.pokemon = new PkmnAccount(user.pokemon);
			message = fn(user.pokemon, user);
			return user;
		}).save();
		return typeof(message) === 'string' ? `${md.mention(userID)} ${message}` : message;
	}
	static save(client) {
		client.database.get('users').save();
		return this;
	}
	static GIF(pokeID) {
		pokeID = resolvePokeID(pokeID);
		if (pokeID < 0) {
			pokeID = Math.floor(PokemonList.length * Math.random());
		}
		let pokemon = new Pokemon(PokemonList[pokeID]);
		return pokemon.embedGIF();
	}
	static catchPokemon(client, userID) {
		return this.modify(client, userID, pkmn => {
			let caught = pkmn.catchARandomPokemon();
			if (typeof(caught) !== 'object') {
				return caught;
			}
			let pokeID = pkmn.pokemon.getID(caught.name);
			let type = caught.rarity;
			let embed = {
				color: COLOR,
				url: caught.wiki,
				image: { url: caught.gif },
				footer: {
					text: `Inventory ID: ${pokeID}`
				}
			};
			let name = caught.species;
			if (caught.shiny) {
				name = 'Shiny ' + name;
			}
			if (type) {
				embed.description = `${md.mention(userID)} caught the ${md.underline(type)} ${md.bold(name)}!`;
			} else {
				embed.description = `${md.mention(userID)} caught a ${md.bold(name)}!`;
			}
			return embed;
		});
	}
	static scavengeItem(client, userID) {
		return this.modify(client, userID, pkmn => {
			let itemGot = pkmn.scavengeForARandomItem();
			if (typeof(itemGot) !== 'object') {
				return itemGot;
			}
			return `got a ${md.bold(itemGot.name)}!`;
		});
	}
	static releasePokemon(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			let p = null;
			p = pkmn.removePokemon(pokeID);
			pkmn.cooldown -= 60 * 60 * 1000;
			
			return `Your ${md.bold(p.name)} has been set free!`;
		});
	}
	static tradePokemon(client, fromUserID, toUserID, pokeID) {
		if (fromUserID == toUserID) {
			throw 'Recipient needs to be someone else.';
		}
		let src = this.get(fromUserID);
		let tgt = this.get(toUserID);
		
		let pkmnTraded = src.tradePokemon(tgt, pokeID);
		
		this.set(client, fromUserID, src);
		this.set(client, toUserID, tgt);
		this.save(client);
		
		return `${md.mention(fromUserID)} has given ${md.bold(pkmnTraded.name)} to ${md.mention(toUserID)}!`;
	}
	static sellPokemon(client, userID, pokeID) {
		return this.modify(client, userID, (pkmn, user) => {
			let pokemonSold = pkmn.removePokemon(pokeID);
			let sellValue = pokemonSold.value;
			
			Bank.get(client, userID).changeCredits(sellValue);
			
			return `sold ${md.bold(pokemonSold.name)} ${md.strikethrough('to slavery on the Black PokéMarket')} for ${Bank.formatCredits(sellValue)}.`;
		});
	}
	static renamePokemon(client, userID, pokeID, name) {
		return this.modify(client, userID, pkmn => {
			let p = pkmn.pokemon.get(pokeID);
			let oldName = p.name;
			p.name = name;
			return `'s ${md.bold(oldName)} is now ${md.bold(p.name)}!`;
		});
	}
	static trainPokemon(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			return pkmn.trainPokemon(pokeID);
		});
	}
	static displayPokemon(client, userID, pokeID) {
		return this.get(client, userID).displayPokemonInfo(pokeID);
	}
	static favoritePokemon(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			let p = pkmn.favoritePokemon(pokeID);
			return `favorited ${md.bold(p.name)}!`;
		});
	}
	static unfavoritePokemon(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			let p = pkmn.unfavoritePokemon(pkmn);
			return `unfavorited ${md.bold(p.name)}!`;
		});
	}
	static inventory(client, userID, page) {
		let pkmn = this.get(client, userID);
		let embed = pkmn.displayPokemonInventory(page);
		embed.title = `${client.users[userID].username}'s Pokedex`;
		return embed;
	}
	static inventoryLegendaries(client, userID, page) {
		const legendaries = this.specialPokemon;
		let pkmn = this.get(client, userID);
		let embed = pkmn.displayPokemonInventory(page, (pokemon) => legendaries.includes(pokemon.species));
		embed.title = `${client.users[userID].username}'s Legendaries`;
		return embed;
	}
	static inventoryFavorites(client, userID, page) {
		let pkmn = this.get(client, userID);
		let embed = pkmn.displayPokemonInventory(page, (pokemon) => !!pokemon.fav);
		embed.title = `${client.users[userID].username}'s Favorites`;
		return embed;
	}
	static inventoryItems(client, userID) {
		let pkmn = this.get(client, userID);
		let embed = pkmn.displayItemInventory();
		embed.title = `${client.users[userID].username}'s Items`;
		return embed;
	}
	static resetInventory(client, userID) {
		return this.modify(client, userID, (pkmn, user) => {
			delete user.pokemon;
			return `${md.mention(userID)}'s entire Pokémon and item collection has been **erased**.`;
		});
	}
	static refreshCooldown(client, userID) {
		return this.modify(client, userID, pkmn => {
			pkmn.cooldown  = 0;
			pkmn.scavenged = 0;
			pkmn.trained   = 0;
			return `Your cooldowns for catching, scavenging, and training have been skipped.`;
		});
	}
	static howMany(client, userID) {
		let pkmn = this.get(client, userID);
		let count = pkmn.pokemon.reduce((a,id,p) => {
			if (!a.includes(p.spc)) a.push(p.spc);
			return a;
		}, []).length;
		let lgdcount = pkmn.pokemon.reduce((a,id,p) => {
			if (p.rarity && !a.includes(p.spc)) a.push(p.spc);
			return a;
		}, []).length;
		return `${md.mention(userID)} You caught ${md.bold(count)}/${md.bold(PokemonList.length)} Pokémon, and ${md.bold(lgdcount)}/${md.bold(this.specialPokemon.length)} legendary Pokémon.`;
	}
	static showShopInventory(client, serverID, item) {
		if (item) {
			return PokeShop.displayItemInfo(item);
		} else {
			return PokeShop.inventory(item);
		}
	}
	static buyFromShop(client, serverID, userID, item, quantity) {
		return this.modify(client, userID, (pkmn, user) => {
			let bank = Bank.get(client, userID);
			return PokeShop.buy(pkmn, bank, item, quantity);
		});
	}
	static sellToShop(client, serverID, userID, item, quantity) {
		return this.modify(client, userID, (pkmn, user) => {
			let bank = Bank.get(client, userID);
			return PokeShop.sell(pkmn, bank, item, quantity);
		});
	}
	static useRareCandy(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			let pokemon = pkmn.pokemon.get(pokeID);
			
			let item = getItemDescriptor('rare candy');
			pkmn.removeItem(item);
			let lvl = pokemon.lvl + 1;
			pokemon.lvl = lvl;
			return `used a ${md.bold(item.name)} :candy: to level up ${md.bold(pokemon.name)} to ${md.bold('Lvl. ' + lvl)}!`;
		});
	}
}

/* Utilities */

function indexOfPokemon(p) {
	return PokemonList.findIndex(pkmn => strcmp(pkmn,p));
}
function indexOfItem(i) {
	return PokemonItemList.findIndex(item => strcmp(item.name,i) || strcmp(item.id,i));
}
function resolvePokeID(pokeID) {
	if (isNaN(pokeID)) {
		pokeID = indexOfPokemon(pokeID);
	}
	return PokemonList[pokeID] !== undefined ? pokeID : -1;
}
function resolveItemID(itemID) {
	if (isNaN(itemID)) {
		itemID = indexOfItem(itemID);
	}
	return PokemonItemList[itemID] !== undefined ? itemID : -1;
}
function getItemDescriptor(itemID) {
	return PokemonItemList[resolveItemID(itemID)];
}

function levelToXP(lvl) {
	return Math.round(2 * Math.pow(lvl - 1, 2));
}
function XPtoLevel(xp) {
	return 1 + Math.floor(Math.sqrt(xp / 2));
}

module.exports = PokemonGame;
