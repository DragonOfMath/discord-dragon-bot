const Constants      = require('../../Constants/Pokemon');
const ListMessageBrowser = require('../../Sessions/ListMessageBrowser');
const {substrcmp,paginate} = require('../../Utils');

const FAVORITE  = '⭐';
const LEGENDARY = '⚡';
const SHINY     = '💎';
const FILTER = {
	favorite: FAVORITE,
	legendary: LEGENDARY,
	shiny: SHINY
};

class PokedexViewer extends ListMessageBrowser {
	constructor(context, pokedex, filters = {}) {
		super(context, pokedex, {filters});
		this.init();
	}
	get color() {
		return Constants.COLOR;
	}
	init() {
		super.init();
		this.embed.title = this.user.username + '\'s Pokedex';
		this.updateEmbed();
	}
	async handleUserAction({reaction, change, client, userID}) {
		for (let f in FILTER) {
			if (reaction == FILTER[f]) {
				this.options.filters[f] = change > 0;
				return true;
			}
		}
	}
	sortByKey() {
		this.data = this.data.sort();
	}
	sortByValue() {
		this.data = this.data.sort(true);
	}
	filterData(pokedex) {
		let {favorite,legendary,shiny,query} = this.options.filters;
		let ids = pokedex.ids;
		if (favorite)  ids = ids.filter(id => pokedex[id].fav);
		if (legendary) ids = ids.filter(id => pokedex[id].legendary);
		if (shiny)     ids = ids.filter(id => pokedex[id].shiny);
		if (query) {
			if (typeof(query) === 'function') {
				ids = ids.filter(id => query(pokedex[id]));
			} else {
				ids = ids.filter(id => (substrcmp(pokedex[id].name,query) || substrcmp(pokedex[id].species,query)));
			}
		}
		return ids;
	}
	mapItem(ids, i , id) {
		let mon = this.data[id];
		return {
			name:  `${mon.displayName} (ID: ${id})`,
			value: `${mon.species} Lvl. ${mon.lvl}`,
			inline: true
		};
	}
	toString() {
		let activeFilters = Object.keys(FILTER).filter(f => this.options.filters[f]);
		if (activeFilters.length) {
			return 'Filters: ' + activeFilters.join(', ');
		} else {
			return null;
		}
	}
}

PokedexViewer.CONFIG = {
	displayName: 'My Pokedex',
	itemsPerPage: Constants.PER_PAGE,
	canSort: true,
	interface: [FAVORITE,LEGENDARY,SHINY]
};

module.exports = PokedexViewer;
