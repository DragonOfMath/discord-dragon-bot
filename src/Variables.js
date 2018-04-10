/**
	VariableStore accesses a Variables object given the serverID.
	It also stores globals if necessary.
*/
class VariableStore {
	constructor(client) {
		this.globals = {};
	}
	set(serverID, name, value) {
		if (typeof(name) !== 'string')     throw 'Variable name required.';
		if (typeof(value) === 'undefined') throw 'Variable value required.';
		if (serverID) {
			this[serverID] = this[serverID] || {};
			return this[serverID][name] = value;
		} else {
			return this.globals[name] = value;
		}
	}
	get(serverID, name) {
		if (serverID) {
			this[serverID] = this[serverID] || {};
			return name ? (typeof(this[serverID][name]) !== 'undefined' ? this[serverID][name] : this.globals[name]) : this[serverID];
		} else {
			return name ? this.globals[name] : this.globals;
		}
	}
}

module.exports = VariableStore;
