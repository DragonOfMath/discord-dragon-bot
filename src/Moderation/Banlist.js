const Offense   = require('./Offense');
const Constants = require('../Constants/Moderation');
const {Array}   = require('../Utils');

/**
 * @class Banlist
 * @prop {Array<String>} usernames
 * @prop {Array<String>} urls
 * Stores usernames and URLs that are considered banned from a server.
 * If a user with a name in the list joins the server, they are instantly banned.
 * If a URL in the list is posted on the server, the user is instantly banned.
 *  (Note: This does not affect users with privileged/admin permissions.)
 */
class Banlist {
	constructor(usernames, urls) {
		if (typeof(arguments[0]) === 'object') {
			this.usernames = arguments[0].usernames || [];
			this.urls      = arguments[0].urls || [];
		} else {
			this.usernames = usernames || [];
			this.urls      = urls || [];
		}
	}
	toString() {
		return `Names: ${this.usernames.length} | URLs: ${this.urls.length}`;
	}
	banName(name) {
		if (!this.usernames.includes(name)) {
			this.usernames.push(name);
		}
	}
	banNames(names) {
		this.usernames = this.usernames.union(names);
	}
	unbanName(name) {
		let idx = this.usernames.indexOf(name);
		if (idx > -1) {
			this.usernames.splice(idx, 1);
		}
	}
	unbanNames(names) {
		this.usernames = this.usernames.diff(names);
	}
	banURL(url) {
		if (!this.urls.includes(url)) {
			this.urls.push(url);
		}
	}
	banURLs(urls) {
		this.urls = this.urls.union(urls);
	}
	unbanURL(url) {
		let idx = this.urls.indexOf(url);
		if (idx > -1) {
			this.urls.splice(idx, 1);
		}
	}
	unbanURLs(urls) {
		this.urls = this.urls.diff(urls);
	}
	checkMessage(message) {
		let urls = message.match(/https?:\/\/[^\s]+/g);
		if (this.urls.length) {
			let bannedURLsFound = urls.filter(u => this.urls.some(b => u.includes(b)));
			if (bannedURLsFound.length) {
				return new Offense('Banlist', 'User linked to ' + bannedURLsFound.join(', '), Constants.ACTIONS.BAN);
			}
		}
	}
	checkUser(user) {
		user = user.username || user;
		let bannedName = this.usernames.find(n => {
			n = new RegExp(n, 'i');
			return n.test(user);
		});
		if (bannedName) {
			return new Offense('Banlist', 'Username contains ' + bannedName, Constants.ACTIONS.BAN);
		}
	}
}

module.exports = Banlist;
