const Constants = require('../../Constants/Pokemon');
const Resource  = require('../../Structures/Resource');
const {Format:fmt,random} = require('../../Utils');

const PokemonList        = require('./pokemon.json');
const SpecialPokemonList = require('./pokemon_special.json');

class Pokemon extends Resource {
	constructor(p) {
		if (typeof(p) === 'object') {
			super(Constants.POKEMON_TEMPLATE, p);
		} else {
			super(Constants.POKEMON_TEMPLATE, {});
			this.name = p;
			this.species = p;
		}
	}
	get name() {
		return this.n;
	}
	set name(x) {
		this.n = x;
	}
	get lvl() {
		return XPtoLevel(this.xp);
	}
	set lvl(l) {
		this.xp = levelToXP(l);
	}
	get species() {
		return PokemonList[this.s];
	}
	set species(x) {
		this.s = PokemonList.indexOf(x);
	}
	get speciesWeb() {
		return this.species.replace(/[^\w\d]/g,'').toLowerCase();
	}
	get displayName() {
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
		let s = this.species;
		return Object.keys(SpecialPokemonList).find(type => SpecialPokemonList[type].includes(s));
	}
	get legendary() {
		return !!this.rarity;
	}
	get baseValue() {
		let base = 0;
		switch (this.rarity) {
			case 'legendary':
				base = Constants.LEGENDARY_BASE_VALUE;
				break;
			case 'mythical':
				base = Constants.MYTHICAL_BASE_VALUE;
				break;
			case 'rare':
				base = Constants.RARE_BASE_VALUE;
				break;
			default:
				base = Constants.BASE_VALUE;
				break;
		}
		if (this.shiny) {
			base *= Constants.SHINY_BASE_MULT;
		}
		return base;
	}
	get value() {
		var mult = 1 + this.lvl/10;
		return Math.floor(this.baseValue * mult);
	}
	displayInfo() {
		let lvl = this.lvl;
		let nextXP = levelToXP(lvl+1);
		return {
			color: Constants.COLOR,
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
					value: fmt.currency(this.value),
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
			color: Constants.COLOR,
			url: this.wiki,
			image: { url: this.gif }
		};
	}
	static random() {
		return new Pokemon(random(PokemonList));
	}
}

function levelToXP(lvl) {
	return Math.round(2 * Math.pow(lvl - 1, 2));
}
function XPtoLevel(xp) {
	return 1 + Math.floor(Math.sqrt(xp / 2));
}

module.exports = Pokemon;
