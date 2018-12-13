const PokedexViewer = require('./PokedexViewer');
const Constants   = require('../../Constants/Pokemon');
const TypeMapBase = require('../../Structures/TypeMapBase');
const {strcmp}    = require('../../Utils');

const Pokemon     = require('./Pokemon');
const PokeError   = require('./PokeError');

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
			return this.mons.find(m => strcmp(m.name, pokeID));
		}
	}
	getID(pokeID) {
		if (this.has(pokeID)) {
			return pokeID;
		} else {
			let id = this.ids.find(id => strcmp(this[id].name, pokeID));
			if (id === undefined) id = -1;
			return id;
		}
	}
	add(pokeID,p) {
		if (!(p instanceof Pokemon)) {
			p = new Pokemon(p);
			if (Math.random() < Constants.SHINY_CHANCE) p.shiny = 1;
		}
		p.name = p.species + '#' + pokeID;
		this.set(pokeID, p);
		return p;
	}
	remove(pokeID) {
		pokeID = this.getID(pokeID);
		let p = this.get(pokeID);
		if (!p) {
			throw new PokeError('Invalid Pokemon ID: ' + pokeID);
		}
		p.fav = false;
		this.delete(pokeID);
		return p;
	}
	sort(byName = false) {
		let ids = this.ids;
		if (byName) {
			ids = ids.sort((i1,i2) => {
				if (this[i1].n < this[i2].n) return -1;
				if (this[i1].n > this[i2].n) return 1;
				return 0;
			});
		} else {
			ids = ids.sort();
		}
		let sortedObj = {};
		for (let id of ids) {
			sortedObj[id] = this[id];
		}
		return new Pokedex(sortedObj);
	}
	view(context, filters) {
		if (!this.ids.length) {
			return 'There are no Pokemon to display.';
		}
		let pv = new PokedexViewer(context, this, filters);
		return pv.startBrowser(context.client);
	}
}

module.exports = Pokedex;
