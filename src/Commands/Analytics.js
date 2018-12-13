const AnalyticsViewer = require('./AnalyticsViewer');
const MapBase = require('../Structures/MapBase');

/**
 * Analytics class constructor
 * Each property is a command ID whose value is the usage count.
 * @class Analytics
 * @extends MapBase
 */
class Analytics extends MapBase {
	/**
	 * Returns the sum of its property values.
	 */
	get total() {
		return this.reduce((t,k,v) => t += v, 0);
	}
	/**
	 * Tally the provided commands.
	 * @param {String|Array<String>|Object} cmds - the command(s) to increment or add
	 */
	add(cmds) {
		if (cmds instanceof Array) {
			for (var cmd of cmds) {
				this[cmd] = (this[cmd] || 0) + 1;
			}
		} else if (typeof(cmds) === 'object') {
			for (var cmd in cmds) {
				this[cmd] = (this[cmd] || 0) + (Number(cmds[cmd]) || 0);
			}
		} else {
			this[cmds] = (this[cmds] || 0) + 1;
		}
		return this;
	}
	merge(items) {
		for (let mergeKey in items) {
			for (let obsKey of items[mergeKey]) {
				this.add({[mergeKey]:this[obsKey]});
				this.delete(obsKey);
			}
		}
		return this;
	}
	deleteAll(items = []) {
		for (let i of items) this.delete(i);
		return this;
	}
	/**
	 * Filter the analytics keys and return a new Analytics object containing only those keys found.
	 * @param {Array<String>} items - the items to keep in the new Analytics object
	 * @return {Analytics} the filtered analytics
	 */
	filter(items = []) {
		var filtered_a = {};
		var keys = this.keys;
		for (let k of keys) {
			if (items.includes(k)) {
				filtered_a[k] = this[k];
			}
		}
		return new Analytics(filtered_a);
	}
	/**
	 * Sort the analytical key/values.
	 * @param {String} [method="key"] - the method to sort by, either key, key-desc, value, or value-desc.
	 * @return {Analytics} the sorted analytics (this does not override the current analytics object)
	 */
	sort(method = 'key') {
		let keys = this.keys;
		switch (method) {
			case 'key':
				keys = keys.sort();
				break;
			case 'key-desc':
				keys = keys.sort().reverse();
				break;
			case 'value':
				keys = keys.sort((a,b) => this[a] > this[b] ? 1 : this[a] < this[b] ? -1 : 0);
				break;
			case 'value-desc':
				keys = keys.sort((a,b) => this[a] > this[b] ? -1 : this[a] < this[b] ? 1 : 0);
				break;
		}
		let sorted_a = {};
		for (let k of keys) {
			sorted_a[k] = this[k];
		}
		
		return new Analytics(sorted_a);
	}
	view(context) {
		if (this.length == 0) {
			return 'No analytic information is available.';
		}
		let av = new AnalyticsViewer(context, this);
		return av.startBrowser(context.client);
	}
	
	/**
	 * Update a server's analytics table (and also the temp table)
	 * @param {Database} database - the database object
	 * @param {Snowflake} serverID - the server ID
	 * @param {String} command - the command to update
	 */
	static push(database, serverID, command) {
		// update the temporary table
		let analytics = Analytics._temp[serverID] || new Analytics();
		analytics.add(command);
		Analytics._temp[serverID] = analytics;
		
		// update the persistent table
		database.get('analytics').modify(serverID, analytics => {
			analytics = new Analytics(analytics);
			analytics.add(command);
			return analytics;
		}).save();
	}
	/**
	 * Get analytics.
	 * @param {Database} database - the database object
	 * @param {Snowflake} [serverID] - the server ID
	 * @param {Snowflake} [temp] - get temporary analytics only
	 * @return {Analytics}
	 */
	static get(database, serverID, temp = false) {
		if (temp) {
			if (serverID) {
				return Analytics._temp[serverID] || new Analytics();
			} else {
				let analytics = new Analytics();
				for (var sid in Analytics._temp) {
					analytics.add(Analytics._temp[sid]);
				}
				return analytics;
			}
		} else {
			let table = database.get('analytics');
			if (serverID) {
				return new Analytics(table.get(serverID));
			} else {
				let analytics = new Analytics();
				table.forEach((sID, _analytics) => {
					analytics.add(_analytics);
				});
				return analytics;
			}
		}
	}
	/**
	 * Delete items from a server's analytics table.
	 * @param {Database} database - the database object
	 * @param {Array<String>} items - the items to delete
	 * @param {Snowflake} serverID - the server ID
	 * @param {Boolean} [temp=false] - delete from temporary analytics table
	 */
	static delete(database, items = [], serverID, temp = false) {
		if (temp) {
			if (serverID) {
				let analytics = Analytics._temp[serverID];
				if (analytics) {
					analytics.deleteAll(items);
				}
			} else {
				for (let serverID in Analytics._temp) {
					Analytics._temp[serverID].deleteAll(items);
				}
			}
		} else {
			let table = database.get('analytics');
			if (serverID) {
				table.modify(serverID, analytics => {
					analytics = new Analytics(analytics);
					analytics.deleteAll(items);
					return analytics;
				});
			} else {
				table.forEach((serverID, analytics) => {
					analytics = new Analytics(analytics);
					analytics.deleteAll(items);
					table[serverID] = analytics;
				});
			}
			table.save();
		}
	}
	/**
	 * Merge items in a server's analytics table.
	 * @param {Database} database - the database object
	 * @param {Object} items - the items to merge; keys are the items to keep, and values are arrays of items to merge with the kept item
	 * @param {Snowflake} serverID - the server ID
	 * @param {Boolean} [temp=false] - merge items in the temporary analytics channel
	 */
	static merge(database, items, serverID, temp = false) {
		if (temp) {
			if (serverID) {
				let analytics = Analytics._temp[serverID];
				if (analytics) {
					analytics.merge(items);
				}
			} else {
				for (serverID in Analytics._temp) {
					Analytics._temp[serverID].merge(items);
				}
			}
		} else {
			let table = database.get('analytics');
			if (serverID) {
				table.modify(serverID, analytics => {
					analytics = new Analytics(analytics);
					return analytics.merge(items);
				});
			} else {
				table.forEach((serverID, analytics) => {
					analytics = new Analytics(analytics);
					table[serverID] = analytics.merge(items);
				});
			}
			table.save();
		}
	}
	/**
	 * 
	 * @param {Database} database - the database object
	 * @param {Snowflake} serverID - the server ID
	 * @param {String} [method="key"] - the method for sorting items
	 */
	static sort(database, serverID, method = 'key') {
		database.get('analytics').modify(serverID, analytics => {
			var a = new Analytics(analytics);
			return a.sort(method);
		}).save();
	}
	/**
	 * Enable/disable analytics.
	 * @param {Boolean} [force] - set analytics to active/inactive manually
	 * @return {Boolean} the current active value
	 */
	static toggle(force) {
		if (typeof(force) !== 'undefined') {
			this._active = !!force;
		} else {
			this._active = !this._active;
		}
		return this._active;
	}
}

// current process analytics
Analytics._temp = {}; //new TypeMapBase(Analytics);
Analytics._active = true;

module.exports = Analytics;
