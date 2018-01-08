const Bank        = require('../../Bank');
const TypeMapBase = require('../../TypeMapBase');
const {Markdown:md,Format:fmt,paginate,random,strcmp} = require('../../Utils');
const PokemonList        = require('./pokemon.json');
const SpecialPokemonList = require('./pokemon_special.json');

const HEADER     = `Pokémon:tm:`;
const COLOR      = 0xFF0000;
const COOLDOWN   = 2 * 60 * 60 * 1000; // 2 hours
const PAGINATION = 15; // items per page

class Pokemon {
	constructor(p) {
		if (typeof(p) === 'object') {
			this.name    = p.name;
			this.spc     = p.spc;
			this.lvl     = p.lvl;
			this.xp      = p.xp;
			this.fav     = p.fav;
		} else {
			this.name    = p;
			this.species = p;
			this.lvl     = 1;
			this.xp      = 0;
			this.fav     = false;
		}
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
		return `https://play.pokemonshowdown.com/sprites/xyani/${this.speciesWeb}.gif`;
	}
	get sprite() {
		return `https://raw.githubusercontent.com/Wonder-Toast/Pokemon-PNG/master/nrml/${this.speciesWeb}.png`;
	}
	get sprite2() {
		return `https://cdn.rawgit.com/msikma/pokesprite/master/icons/pokemon/regular/${this.speciesWeb}.png`;
	}
	initBattle() {
		this.hp  = this.lvl * 10;
		this._hp = this.hp;
	}
	get rarity() {
		for (let type in SpecialPokemonList) {
			if (SpecialPokemonList[type].indexOf(this.species) > -1) {
				return type;
			}
		}
		return '';
	}
	displayInfo() {
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
					value: this.species,
					inline: true
				},
				{
					name: 'Favorite',
					value: this.fav ? 'Yes' : 'No',
					inline: true
				},
				{
					name: 'Level',
					value: this.lvl,
					inline: true
				},
				{
					name: 'XP',
					value: this.xp,
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
}

class PkmnAccount {
	constructor(user) {
		if (typeof(user) === 'object') {
			this.pokemon = new Pokedex(user.pokemon);
			this.cooldown = user.cooldown || 0;
			this.totalCaught = user.totalCaught || 0;
		} else {
			this.pokemon = new Pokedex();
			this.cooldown = 0;
			this.totalCaught = 0;
		}
	}
	get(pokeID) {
		if (this.pokemon.has(pokeID)) {
			return this.pokemon.get(pokeID);
		} else {
			let p = this.pokemon.mons.find(m => strcmp(m.name, pokeID));
			if (p) return p;
		}
		throw `Invalid Pokemon ID: ${pokeID}`;
	}
	getID(pokeID) {
		if (this.pokemon.has(pokeID)) {
			return pokeID;
		} else {
			let p = this.pokemon.ids.find(id => strcmp(this.pokemon[id].name, pokeID));
			if (p) return p;
		}
		throw `Invalid Pokemon ID: ${pokeID}`;
	}
	addPokemon(p) {
		if (!(p instanceof Pokemon)) {
			p = new Pokemon(p);
		}
		let id = this.totalCaught++;
		p.name = p.species + '#' + id;
		this.pokemon.set(id, p);
		return p;
	}
	removePokemon(id) {
		id = this.getID(id);
		let p = this.get(id);
		p.fav = false;
		this.pokemon.delete(id);
		return p;
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
		this.cooldown = now + COOLDOWN;
		return this.addPokemon(random(PokemonList));
	}
	displayPokemonInventory(page, filter) {
		if (typeof(page) !== 'number') {
			page = Number(page);
		}
		if (isNaN(page) || page < 0) {
			page = 1;
		}
		
		let pkmn = this.pokemon;
		let ids = pkmn.ids;
		if (typeof(filter) === 'array' && filter.length) {
			ids = ids.filter(id => {
				let spc = pkmn[id].species;
				return filter.some(f => SpecialPokemonList[f].includes(spc));
			});
		} else if (typeof(filter) === 'object') {
			ids = ids.filter(id => {
				let p = pkmn[id];
				for (let k in filter) {
					if (p[k] != filter[k]) {
						return false;
					}
				}
				return true;
			});
		}
		
		let embed = paginate(ids, page, PAGINATION, function(p, i) {
			let id = p[i];
			let mon = pkmn[id];
			return {
				name:  `${mon.starName} (ID: ${id})`,
				value: `${mon.species} Lvl. ${mon.lvl}`,
				inline: true
			};
		});
		embed.color = COLOR;
		return embed;
	}
	displayPokemonInfo(pokeID) {
		return this.get(pokeID).displayInfo();
	}
	favoritePokemon(pokeID) {
		let p = this.get(pokeID);
		p.fav = true;
		return p;
	}
	unfavoritePokemon(pokeID) {
		let p = this.get(pokeID);
		p.fav = false;
		return p;
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
		return COOLDOWN;
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
		return fmt.time(COOLDOWN);
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
			let pokemonCaught = pkmn.catchARandomPokemon();
			if (pokemonCaught instanceof Pokemon) {
				let pokeID = pkmn.getID(pokemonCaught.name);
				let type = pokemonCaught.rarity;
				let embed = {
					color: COLOR,
					url: pokemonCaught.wiki,
					image: { url: pokemonCaught.gif },
					footer: {
						text: `Inventory ID: ${pokeID}`
					}
				};
				if (type) {
					embed.description = `${md.mention(userID)} caught the ${md.underline(type)} ${md.bold(pokemonCaught.species)}!`;
				} else {
					embed.description = `${md.mention(userID)} caught a ${md.bold(pokemonCaught.species)}!`;
				}
				return embed;
			} else {
				return pokemonCaught;
			}
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
			let sellValue;
			switch (pokemonSold.rarity) {
				case 'legendary':
					sellValue = 10000;
					break;
				case 'mythical':
					sellValue = 5000;
					break;
				case 'rare':
					sellValue = 1000;
					break;
				default:
					sellValue = 100;
					break;
			}
			
			Bank.get(client, userID).credits += sellValue;
			
			return `You sold ${md.bold(pokemonSold.name)} ${md.strikethrough('to slavery on the Black PokéMarket')} for ${Bank.formatCredits(sellValue)}.`;
		});
	}
	static renamePokemon(client, userID, pokeID, name) {
		return this.modify(client, userID, pkmn => {
			let p = pkmn.get(pokeID);
			let oldName = p.name;
			p.name = name;
			return `Your ${md.bold(oldName)} is now ${md.bold(p.name)}!`;
		});
	}
	static displayPokemon(client, userID, pokeID) {
		return this.get(client, userID).displayPokemonInfo(pokeID);
	}
	static favoritePokemon(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			let p = pkmn.favoritePokemon(pokeID);
			return `You favorited ${md.bold(p.name)}!`;
		});
	}
	static unfavoritePokemon(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			let p = pkmn.unfavoritePokemon(pkmn);
			return `You unfavorited ${md.bold(p.name)}!`;
		});
	}
	static inventory(client, userID, page) {
		let pkmn = this.get(client, userID);
		let embed = pkmn.displayPokemonInventory(page);
		embed.title = `${client.users[userID].username}'s Inventory`;
		return embed;
	}
	static inventoryLegendaries(client, userID, page) {
		let pkmn = this.get(client, userID);
		let embed = pkmn.displayPokemonInventory(page, ['legendary','mythical','rare']);
		embed.title = `${client.users[userID].username}'s Legendaries`;
		return embed;
	}
	static inventoryFavorites(client, userID, page) {
		let pkmn = this.get(client, userID);
		let embed = pkmn.displayPokemonInventory(page, {fav: true});
		embed.title = `${client.users[userID].username}'s Favorites`;
		return embed;
	}
	static resetInventory(client, userID) {
		this.modify(client, userID, (pkmn, user) => {
			delete user.pokemon;
		});
		return `${md.mention(userID)} Your entire Pokémon collection has been **erased**.`;
	}
	static refreshCooldown(client, userID) {
		this.modify(client, userID, pkmn => {
			pkmn.cooldown = 0;
		});
		return `${md.mention(userID)} Your cooldown has been skipped.`;
	}
}

/* Utilities */

function indexOfPokemon(p) {
	return PokemonList.findIndex(pkmn => strcmp(pkmn,p));
}
function resolvePokeID(pokeID) {
	if (isNaN(pokeID)) {
		pokeID = indexOfPokemon(pokeID);
	}
	return PokemonList[pokeID] !== undefined ? pokeID : -1;
}

module.exports = PokemonGame;