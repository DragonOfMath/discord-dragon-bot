const Asset = require('../../Structures/Asset');
const {Jimp,random} = require('../../Utils');

const Pokemon       = require('./Pokemon');
const Pokedex       = require('./Pokedex');
const Trainer       = require('./Trainer');
const PokeShop      = require('./Pokeshop');
//const PokemonBattle = require('./PokemonBattle');
const PokeError     = require('./PokeError');

const PokemonList        = Asset.require('Pokemon/pokemon.json');
const SpecialPokemonList = Asset.require('Pokemon/pokemon_special.json');
const PokemonItemList    = Asset.require('Pokemon/items.json');
const PokemonHashTable   = Asset.require('Pokemon/hashes.json');
const AllSpecialPokemon  = Object.keys(SpecialPokemonList).reduce((_,t) => _.concat(SpecialPokemonList[t]), []);

class PokemonMain {
	static get pokemon() {
		return PokemonList;
	}
	static get specialPokemon() {
		return AllSpecialPokemon;
	}
	static get(client, userID) {
		if (!client.users[userID]) {
			throw 'Invalid user.';
		}
		let user = client.database.get('users').get(userID);
		user.pokemon = new Trainer(user.pokemon);
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
			user.pokemon = new Trainer(user.pokemon);
			message = fn(user.pokemon, user);
			return user;
		}).save();
		return message;
	}
	static save(client) {
		client.database.get('users').save();
		return this;
	}
	static GIF(pokeID) {
		if (isNaN(pokeID)) {
			pokeID = PokemonList.findIndex(pkmn => strcmp(pkmn,pokeID));
		}
		if (!(pokeID in PokemonList)) {
			pokeID = random(PokemonList.length);
		}
		let pokemon = new Pokemon(PokemonList[pokeID]);
		return pokemon.embedGIF();
	}
	static catchPokemon(client, userID) {
		return this.modify(client, userID, pkmn => {
			let caught = pkmn.catchARandomPokemon();
			let pokeID = pkmn.pokemon.getID(caught.name);
			return { id: pokeID, pokemon: caught };
		});
	}
	static scavengeItem(client, userID) {
		return this.modify(client, userID, pkmn => {
			return pkmn.scavengeForARandomItem();
		});
	}
	static releasePokemon(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			let p = pkmn.removePokemon(pokeID);
			pkmn.cooldown -= 60 * 60 * 1000;
			return p;
		});
	}
	// TODO: make a PokemonExchange class as a LiveMessage
	static tradePokemon(client, fromUserID, toUserID, pokeID, exchangePokeID) {
		if (fromUserID == toUserID) {
			throw 'Recipient needs to be someone else.';
		}
		
		let src = this.get(client, fromUserID);
		let tgt = this.get(client, toUserID);
		
		let pkmnTraded = src.tradePokemon(tgt, pokeID);
		let pkmnExchanged = exchangePokeID ? tgt.tradePokemon(src, exchangePokeID) : null;
		
		this.set(client, fromUserID, src);
		this.set(client, toUserID, tgt);
		this.save(client);
		
		return pkmnTraded;
	}
	static sellPokemon(client, userID, pokeID) {
		return this.modify(client, userID, (pkmn, user) => {
			let pokemonSold = pkmn.removePokemon(pokeID);
			let sellValue = pokemonSold.value;
			
			client.bank.get(client, userID).changeCredits(sellValue);
			
			return { pokemon: pokemonSold, value: sellValue };
		});
	}
	static renamePokemon(client, userID, pokeID, name) {
		return this.modify(client, userID, pkmn => {
			let p = pkmn.pokemon.get(pokeID);
			let oldName = p.name;
			p.name = name;
			return { pokemon: p, prevname: oldName };
		});
	}
	static getActivePokemon(client, userID) {
		return this.get(client, userID).activePokemon;
	}
	static setActivePokemon(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			pkmn.activePokemon = pokeID;
			return pkmn.activePokemon;
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
			return pkmn.favoritePokemon(pokeID);
		});
	}
	static unfavoritePokemon(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			return pkmn.unfavoritePokemon(pkmn);
		});
	}
	
	static displayPokedex(context, filters = {}) {
		let pkmn = this.get(context.client, context.userID);
		return pkmn.pokemon.view(context, filters);
	}
	static displayInventory(client, userID) {
		let pkmn = this.get(client, userID);
		let embed = pkmn.displayItemInventory();
		embed.title = `${client.users[userID].username}'s Items`;
		return embed;
	}
	
	static resetInventory(client, userID) {
		return this.modify(client, userID, (pkmn, user) => {
			delete user.pokemon;
		});
	}
	static refreshCooldown(client, userID) {
		return this.modify(client, userID, pkmn => {
			pkmn.cooldown  = 0;
			pkmn.scavenged = 0;
			pkmn.trained   = 0;
		});
	}
	static howMany(client, userID) {
		let pkmn = this.get(client, userID);
		let count = pkmn.pokemon.reduce((a,id,p) => {
			if (!a.includes(p.s)) a.push(p.s);
			return a;
		}, []).length;
		let lgdcount = pkmn.pokemon.reduce((a,id,p) => {
			if (p.legendary && !a.includes(p.s)) a.push(p.s);
			return a;
		}, []).length;
		return {count,lgdcount};
	}
	static showShopInventory(client, serverID, item) {
		if (item) {
			return PokeShop.displayItemInfo(item);
		} else {
			return PokeShop.displayInventory();
		}
	}
	static buyFromShop(client, serverID, userID, item, quantity) {
		return this.modify(client, userID, (pkmn, user) => {
			let bank = client.bank.get(client, userID);
			return PokeShop.buy(pkmn, bank, item, quantity);
		});
	}
	static sellToShop(client, serverID, userID, item, quantity) {
		return this.modify(client, userID, (pkmn, user) => {
			let bank = client.bank.get(client, userID);
			return PokeShop.sell(pkmn, bank, item, quantity);
		});
	}
	static useRareCandy(client, userID, pokeID) {
		return this.modify(client, userID, pkmn => {
			let pokemon = pkmn.pokemon.get(pokeID);
			
			let item = PokeShop.getItem('rare candy');
			pkmn.removeItem(item);
			let lvl = pokemon.lvl + 1;
			pokemon.lvl = lvl;
			
			return {pokemon,lvl};
		});
	}
	
	static startBattle(context, opponentID) {
		//let battle = new PokemonBattle(context, opponentID);
		//battle.startGame(context.client);
	}
	static identify(pokemonImageURL) {
		return Jimp.read(pokemonImageURL)
		.then(image => image.hash(2))
		.then(hash => {
			let closestMatch = '';
			let closestDiff = 1;
			for (let name in PokemonHashTable) {
				let pkmnHash = PokemonHashTable[name];
				
				if (hash == pkmnHash) {
					// exact match
					console.log('Exact:',name,hash);
					return name;
				}
				
				let difference = Jimp.hashDistance(hash, pkmnHash);
				if (difference < closestDiff) {
					// close match
					closestDiff  = difference;
					closestMatch = name;
				}
			}
			console.log('Close:',closestMatch,closestDiff,hash);
			return closestMatch;
		});
	}
}

module.exports = PokemonMain;
