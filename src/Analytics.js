const MapBase = require('./MapBase');

class Analytics extends MapBase {
	get total() {
		this.reduce((c,x,a,s) => s += x, 0);
	}
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
	embed(sortByValue = true) {
		var akeys = this.keys, rows, columns;
		if (akeys.length == 0) {
			return {description: 'No analytic information is available.'};
		} else if (akeys.length < 5) {
			return {description: akeys.map(cmd => `The \`${cmd}\` command has been used **${this[cmd]||0}** times.`).join('\n')};
		} else if (akeys.length > 25) {
			rows = 25;
		} else {
			rows = 10;
		}
		//rows = Math.min(50, 10 * Math.ceil(akeys.length / 30));
		columns = Math.ceil(akeys.length / rows);
		
		// sort keys by value in descending order
		akeys = akeys.sort((a,b) => {
			if (sortByValue) {
				if (this[a] < this[b]) return 1;
				if (this[a] > this[b]) return -1;
			} else {
				if (a > b) return 1;
				if (a < b) return -1;
			}
			return 0;
		});
		
		var fields = [];
		var total = 0;
		for (var c = 0, i = 0, col, r, x, a; c < akeys.length; c += rows) {
			col = [];
			for (r = 0; r < rows && i < akeys.length; r++, i++) {
				x = akeys[i];
				a = `${x}: ${this[x]}`;
				col.push(a);
				total += this[x];
			}
			fields.push({
				name: `${c+1}-${c+Math.min(rows,r)}`,
				value: col.join('\n'),
				inline: true
			});
		}
		var footer = { text: `Total: ${total}` };
		
		return { fields, footer };
	}
	sort(method = 'key') {
		var keys = this.keys;
		switch (method) {
			case 'key':
				keys = keys.sort();
				break;
			case 'key-desc':
				keys = keys.sort().reverse();
				break;
			case 'value':
				keys = keys.sort((x,y) => x[a] > x[b] ? 1 : x[a] < x[b] ? -1 : 0);
				break;
			case 'value-desc':
				keys = keys.sort((x,y) => x[a] > x[b] ? -1 : x[a] < x[b] ? 1 : 0);
				break;
		}
		var sorted_a = {};
		for (let k of keys) {
			sorted_a[k] = this[k];
		}
		
		return sorted_a;
	}
	static push(client, serverID, command) {
		client.database.get('analytics').modify(serverID, analytics => {
			analytics = new Analytics(analytics);
			analytics.add(command);
			return analytics;
		}).save();
	}
	static pushTemp(serverID, command) {
		Analytics._temp[serverID] = Analytics._temp[serverID] || new Analytics();
		Analytics._temp[serverID].add(command);
		return this;
	}
	static retrieve(client, serverID) {
		if (serverID) {
			return new Analytics(client.database.get('analytics').get(serverID));
		} else {
			var a = new Analytics();
			client.database.get('analytics').forEach((serverID, analytics) => {
				a.add(analytics);
			});
			return a;
		}
	}
	static retrieveTemp(serverID) {
		if (serverID) {
			return Analytics._temp[serverID] || new Analytics();
		} else {
			var a = new Analytics();
			for (var sid in Analytics._temp) {
				a.add(Analytics._temp[sid]);
			}
			return a;
		}
	}
	static delete(client, serverID, items) {
		client.database.get('analytics').modify(serverID, analytics => {
			analytics = new Analytics(analytics);
			for (var i of items) {
				analytics.delete(i);
			}
			return analytics;
		}).save();
	}
	static merge(client, serverID, items) {
		client.database.get('analytics').modify(serverID, analytics => {
			analytics = new Analytics(analytics);
			for (var mergeKey in things) {
				for (var obsKey of things[mergeKey]) {
					analytics.add({[mergeKey]:analytics[obsKey]});
					analytics.delete(obsKey);
				}
			}
			return analytics;
		}).save();
	}
	static sort(client, serverID, method = 'key') {
		client.database.get('analytics').modify(serverID, analytics => {
			var a = new Analytics(analytics);
			return a.sort(method);
		}).save();
	}
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
Analytics._temp = {};
Analytics._active = true;

module.exports = Analytics;
