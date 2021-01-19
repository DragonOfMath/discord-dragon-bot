class Artist {
	constructor(user = {}, booru) {
		if (typeof(user) === 'object') {
			Object.assign(this, user);
			this.aliases = user.other_names.split(/,\s*/);
			this.group   = user.group_name;
			this.active  = user.is_active;
		} else {
			this.name = user;
		}
		this.booru = booru;
	}
	get url() {
		return this.booru.host + '/post?tags=' + this.name;
	}
}

module.exports = Artist;
