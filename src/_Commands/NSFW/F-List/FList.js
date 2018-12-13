const Kink = require('./Kink');
const KinkGroup = require('./KinkGroup');
const Character = require('./Character');
const FListError = require('./FListError');
const {fetch,strcmp} = require('../../../Utils');

/**
 * F-List API usage and kink lookup.
 * @class
 * @prop {String} account
 * @prop {String} ticket
 * @prop {Object} kinkGroups
 * @prop {Object} globalKinks
 */
class FList {
	constructor(account, password) {
		this.account     = account;
		this.ticket      = '';
		this.kinkGroups  = {};
		this.globalKinks = {};
		
		// bind the password to avoid leak
		this.renewTicket = this.renewTicket.bind(this, account, password);
		
		//console.log('Retrieving API ticket...');
		this.renewTicket().then(() => {
			setInterval(() => this.renewTicket().catch(console.error), 1800000); // every 30 minutes
			return this.setupGlobalKinkList();
		});
	}
	/**
	 * Whether the F-List ticket is expired.
	 */
	get expired() {
		return !this.ticket;
	}
	/**
	 * Refreshes the API ticket to allow usage of F-List API endpoints.
	 */
	async renewTicket(account, password) {
		let form = {
			account, password,
			// do not require information about these
			no_characters: true,
			no_bookmarks: true,
			no_friends: true
		};
		
		try {
			this.ticket = '';
			
			let body = await fetch('https://www.f-list.net/json/getApiTicket.php', {
				method: 'POST',
				json: true,
				form: form
			});
			
			this.ticket = body.ticket;
			
			//console.log('F-List API ticket renewed:',this.ticket);
		} catch (e) {
			throw new FListError(e);
		}
	}
	/**
	 * Retrieves the current global kink list from F-List and caches it.
	 */
	async setupGlobalKinkList() {
		console.log('Retrieving global kink list...');
		
		try {
			let body = await fetch('https://www.f-list.net/json/api/kink-list.php', {
				json: true
			});
			
			for (let kg in body.kinks) {
				this.kinkGroups[kg] = new KinkGroup(kg, body.kinks[kg]);
				this.kinkGroups[kg].kinks.forEach(kink => {
					this.globalKinks[kink.id] = kink;
				});
			}
			
			console.log('Global kink table established.');
		} catch (e) {
			throw new FListError(e);
		}
	}
	/**
	 * Retrieve a character on F-List.
	 * @param {String|Number} character - the name or ID of the character.
	 * @return {Character} Promise that resolves to the Character object.
	 */
	async getCharacter(character) {
		let link = character.match(/^https:\/\/www.f-list.net\/c\/(.+)/);
		if (link) {
			character = link[1];
		}
		
		let form = {
			account: this.account,
			ticket:  this.ticket
		};
		
		if (typeof character === 'string') {
			form.name = character;
		} else if (typeof character === 'number') {
			form.id = character;
		} else {
			throw new FListError('Invalid character name or ID: ' + character);
		}
		
		try {
			let characterData = await fetch('https://www.f-list.net/json/api/character-data.php', {
				method: 'POST',
				json: true,
				form: form
			});
			return new Character(characterData);
		} catch (e) {
			throw new FListError(e);
		}
	}
	/**
	 * Maps kinks by ID to the Kink objects that contain the name and descriptions of kinks.
	 * @param {Object} kinks
	 * @return {Object} same keys as argument but with values mapped to Kink objects
	 */
	mapKinks(kinks) {
		let mappedKinks = {};
		for (let id in kinks) {
			mappedKinks[id] = this.globalKinks[id];
		}
		return mappedKinks;
	}
	/**
	 * Gets a kink group by name or ID.
	 * @param {String} kinkGroup - the name or ID of a kink group
	 * @returns {KinkGroup} the kink group object
	 */
	getKinkGroup(kinkGroup) {
		for (let kg in this.kinkGroups) {
			let group = this.kinkGroups[kg];
			if (strcmp(group.name, kinkGroup) || group.id == kinkGroup) {
				return group;
			}
		}
		return null;
	}
	/**
	 * Gets the kink group that a kink belongs to.
	 * @param {String} kinkName - the kink name or ID
	 * @return {KinkGroup}
	 */
	findKinkGroup(kinkName) {
		for (let kg in this.kinkGroups) {
			let group = this.kinkGroups[kg];
			let kink = group.kinks.find(kink => strcmp(kink.name, kinkName) || kink.id == kinkName);
			if (kink) return group;
		}
		return null;
	}
	/**
	 * Gets the Kink object.
	 * @param {String} kinkName - the kink name or ID
	 * @return {Kink}
	 */
	getKink(kinkName) {
		for (let k in this.globalKinks) {
			let kink = this.globalKinks[k];
			if (strcmp(kink.name, kinkName) || kink.id == kinkName) {
				return kink;
			}
		}
		return null;
	}
	/**
	 * Searches kinks with names that match a given query.
	 * @param {String} query
	 * @return {Array<Kink>}
	 */
	searchKinks(query) {
		let matchedKinks = [];
		for (let k in this.globalKinks) {
			let kink = this.globalKinks[k];
			let name = kink.name.toLowerCase();
			if (query.some(q => name.includes(q.toLowerCase()))) {
				matchedKinks.push(kink);
			}
		}
		return matchedKinks;
	}
	/**
	 * Creates a Discord embeddable object for a list of Kink Groups.
	 * @return {Object}
	 */
	embed() {
		let e = {
			title: 'Kink Groups',
			description: ''
		};
		for (let kg in this.kinkGroups) {
			let group = this.kinkGroups[kg];
			e.description += group.toString() + '\n';
		}
		return e;
	}
}

module.exports = FList;
