const Actions       = require('./Actions');
const Offense       = require('./Offense');
const Constants     = require('../Constants/Moderation');
const {isUpperCase} = require('../Utils');

// get the power of 2 (bitmask)
function pow2(b) {
	return 1 << b;
}

/**
 * @class Spam
 * Finds spam of various forms in text
 */
class Spam {
	constructor(filters, actions) {
		if (typeof(arguments[0]) === 'object') {
			this.filters = arguments[0].filters || 0;
			this.actions = arguments[0].actions || 0;
		} else {
			this.filters = filters || 0;
			this.actions = actions || 0;
		}
	}
	toString() {
		return `Spam Filters: ${this.filters} ${this.getFilters().join(',')} | Actions: ${this.getActions().join('+')}`;
	}
	setFilters(filters) {
		this.filters = 0;
		for (let f of filters) {
			let i = Constants.SPAM_FILTERS.indexOf(f.toLowerCase());
			if (i > -1) {
				this.filters |= pow2(i);
			}
		}
		return this.filters;
	}
	getFilters() {
		return Spam.getFilters(this.filters);
	}
	setActions(actions) {
		return this.actions = Actions.set(actions);
	}
	getActions() {
		return Actions.get(this.actions);
	}
	checkMessage(message) {
		let filters = Spam.checkMessage(message, this.filters);
		if (filters) {
			let spamTypes = Spam.getFilters(filters);
			return new Offense('Spam', 'Message contained ' + spamTypes.join(', '), this.actions);
		}
	}
	
	/**
	 * Check the message against each of the types of spam
	 * @param {String} message - the message to check for spam
	 * @param {Number} [F] - the filter mask
	 * @return Number whose bits represent the types of spam found
	 */
	static checkMessage(message, F = 0xFFFF) {
		let S = 0;
		for (let s = 0; s < Constants.SPAM_FILTERS.length; s++) {
			if (this[Constants.SPAM_FILTERS[s]](message)) {
				S |= pow2(s);
			}
		}
		return S & F;
	}
	/**
	 * Calculate the filter mask given an array of spam filter types
	 * @param {Array<String>} filters - spam filters such as mentions, links, emojis, ...
	 * @return Number whos bits represent the active spam filters
	 */
	static calculateFilterMask(filters = []) {
		let F = 0;
		for (let f of filters) {
			F |= this.getBitValue(f);
		}
		return F;
	}
	/**
	 * Retrieve the spam filters from a mask.
	 * @param {Number} mask - the filter mask
	 * @return Array of spam filter names
	 */
	static getFilters(mask) {
		let filters = [];
		for (let s = 0; s < Constants.SPAM_FILTERS.length; s++) {
			if (mask & pow2(s)) {
				filters.push(Constants.SPAM_FILTERS[s]);
			}
		}
		return filters;
	}
	/**
	 * Get the bit value (power of 2) that a spam filter is mapped to
	 * @param {String} type - the spam filter
	 * @return Number equal to the nth bit where n is the spam filter index, 0 if not found
	 */
	static getBitValue(type) {
		let idx = Constants.SPAM_FILTERS.indexOf(type.toLowerCase());
		if (idx > -1) {
			return pow2(idx);
		} else {
			return 0;
		}
	}
	
	/* Spam Filters */
	
	// using a global mention or 4+ single mentions
	static mentions(x) {
		try {
			let mentions = x.match(/<@!?\d+>/g) || [];
			return /@[here|everyone]/.test(x) || mentions.length > 3;
		} catch (e) { return false; }
	}
	// matches shortened url links such as bit.ly and adf.ly or 3+ links in a single message
	static links(x) {
		try {
			return /\w+\.ly\//.test(x) || x.match(/https?\:\/\//g).length >= 4;
		} catch (e) { return false; }
	}
	// aaaaaaaaaaaaaaaaaaaaaaaaa
	static letters(x) {
		return x.length > 30 && /(\w)\1{15,}/.test(x);
	}
	// SPEAKING IN ALL CAPS FOR A LONG MESSAGE
	static allcaps(x) {
		return isUpperCase(x) && x.replace(/[^A-Z]/g,'').length >= 50;
	}
	// text must not contain more than 20 emojis
	static emojis(x) {
		try {
			let customEmojis  = x.match(/<:\w+:\d+>/g) || [];
			let defaultEmojis = x.match(Constants.EMOJI_REGEX) || [];
			return x.length > 40 && (customEmojis.length + defaultEmojis.length) > 20;
		} catch (e) { return false; }
	}
	// message must not contain more than 10 newlines in a row
	static newlines(x) {
		return /[\n\r]{10,}/g.test(x);
	}
}

module.exports = Spam;
