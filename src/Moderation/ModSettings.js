const Constants = require('../Constants/Moderation');
const Resource  = require('../Structures/Resource');
const Modlog    = require('./Modlog');
const Strikes   = require('./Strikes');
const Banlist   = require('./Banlist');
const Spam      = require('./Spam');
const Vulgarity = require('./Vulgarity');
const Actions   = require('./Actions');
const Offense   = require('./Offense');

const {Markdown:md,Format:fmt,Array,DiscordUtils,Date} = require('../Utils');

/**
 * Moderation Settings class constructor
 * @class ModSettings
 * @extends Resource
 * @prop {Snowflake} archiveID - the archive channel ID
 * @prop {Strikes}   strikes   - the user strikes object 
 * @prop {Banlist}   banlist   - the banlist object
 * @prop {Vulgarity} vulgarity - the vulgarity filter object
 * @prop {Spam}      spam      - the spam filter object
 * @prop {Modlog}    modlog    - the moderation log object
 */
class ModSettings extends Resource {
	constructor(settings) {
		super(Constants.TEMPLATE, settings);
		this.strikes   = new Strikes(this.strikes);
		this.banlist   = new Banlist(this.banlist);
		this.vulgarity = new Vulgarity(this.vulgarity);
		this.spam      = new Spam(this.spam);
		this.modlog    = new Modlog(this.modlog);
	}
	embed() {
		return {
			title: 'Moderation Settings',
			fields: [
				{
					name: 'Archive',
					value: this.archiveID ? md.channel(this.archiveID) : 'No channel set'
				},
				{
					name: 'Modlog',
					value: this.modlog.toString()
				},
				{
					name: 'Strikes',
					value: this.strikes.toString()
				},
				{
					name: 'Username Banlist',
					value: this.banlist.toString()
				},
				{
					name: 'Vulgarity Filter',
					value: this.vulgarity.toString()
				},
				{
					name: 'Spam Filter',
					value: this.spam.toString()
				}
			]
		}
	}
	getUserStrikes(userID) {
		return this.strikes.get(userID);
	}
	setUserStrikes(userID, strikes) {
		return this.strikes.set(userID, strikes);
	}
	addUserStrike(userID) {
		return this.strikes.strike(userID);
	}
	removeUserStrike(userID) {
		return this.strikes.unstrike(userID);
	}
	clearBannedNames() {
		this.banlist.names = [];
	}
	addBannedNames(names) {
		this.banlist.banNames(names);
	}
	removeBannedNames(names) {
		this.banlist.unbanNames(names);
	}
	clearBannedURLs() {
		this.banlist.urls = [];
	}
	addBannedURLs(urls) {
		this.banlist.banURLs(urls);
	}
	removeBannedURLs(urls) {
		this.banlist.unbanURLs(urls);
	}
	setVulgarityLevel(level) {
		return this.vulgarity.setLevel(level);
	}
	setVulgarityActions(actions) {
		return this.vulgarity.setActions(actions);
	}
	setSpamFilters(filters = []) {
		return this.spam.setFilters(filters);
	}
	setSpamActions(actions) {
		return this.spam.setActions(actions);
	}
	checkMessage(message) {
		return this.banlist.checkMessage(message)
		    || this.vulgarity.checkMessage(message)
		    || this.spam.checkMessage(message);
	}
	checkUser(user) {
		return this.banlist.checkUser(user);
	}
	observeLockdown(context) {
		let reason;
		if (/[@&]!?(\d+|here|everyone)/.test(context.message)) {
			reason = 'Server mention';
		} else if (timestamp.difference(this.observer[context.userID]) < 1000) {
			reason = 'Rapid message spam';
		} else if (context.attachments.length || context.embeds.length) {
			reason = 'File attachment/embed';
		}
		if (reason) {
			delete this.observer[context.userID];
			return new Offense('Lockdown', reason, Constants.LOCKDOWN_ACTIONS);
		} else {
			this.observer[context.userID] = timestamp;
		}
	}
	recordModlogIncident(client, modID, userID, issue, reason) {
		return this.modlog.recordIncident(client, modID, userID, issue, reason);
	}
	editModlogIncident(client, caseID, modifier) {
		return this.modlog.editIncident(client, caseID, modifier);
	}
	revokeModlogIncident(client, caseID) {
		return this.modlog.revokeIncident(client, caseID);
	}
	getModlogIncident(caseID) {
		return this.modlog.getIncident(caseID);
	}
	getModlogUserIncidents(userID) {
		return this.modlog.getUserIncidents(userID);
	}
}

module.exports = ModSettings;
