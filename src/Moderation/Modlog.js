const Incident = require('./Incident');
const {Markdown:md,DiscordUtils} = require('../Utils');

class Modlog {
	constructor(channelID = '', lastCaseID = 0, cases = {}) {
		if (typeof(arguments[0]) === 'object') {
			this.channelID  = arguments[0].channelID || '';
			this.lastCaseID = arguments[0].lastCaseID || 0;
			this.cases      = arguments[0].cases || {};
		} else {
			this.channelID  = channelID;
			this.lastCaseID = lastCaseID;
			this.cases      = cases;
		}
	}
	toString() {
		return `Channel: ${this.channelID ? md.channel(this.channelID) : 'No channel set'} | Cases: ${this.lastCaseID}`;
	}
	getMessageID(caseID) {
		return Object.keys(this.cases).find(messageID => this.cases[messageID].caseID == caseID);
	}
	getCase(caseID) {
		let id = this.getMessageID(caseID);
		return this.cases[id];
	}
	getIncidents(issue) {
		return Object.keys(this.cases).filter(messageID => this.cases[messageID].issue == issue).map(messageID => this.cases[messageID]);
	}
	recordIncident(client, modID, userID, issue, notes) {
		if (!this.channelID) {
			// silently fail when there's no modlog channel set
			return Promise.resolve(0);
		}
		let incident = new Incident(this.lastCaseID++, modID, userID, issue, notes);
		return client.sendMessage({
			to: this.channelID,
			embed: incident.embed()
		})
		.then(message => {
			this.cases[message.id] = incident;
		});
	}
	editIncident(client, caseID, modify) {
		if (!this.channelID) {
			// silently fail when there's no modlog channel set
			return Promise.resolve(0);
		}
		if (caseID == 'last') {
			caseID = this.lastCaseID-1;
		}
		let messageID = this.getMessageID(caseID);
		if (messageID) {
			let incident = new Incident(this.cases[messageID]);
			this.cases[messageID] = incident.edit(modify);
			return client.editMessage({
				channelID: this.channelID, 
				messageID,
				embed: incident.embed()
			});
		} else {
			return Promise.reject('Couldn\'t find the message with the case ID ' + caseID);
		}
	}
	revokeIncident(client, caseID) {
		if (!this.channelID) {
			// silently fail when there's no modlog channel set
			return Promise.resolve(0);
		}
		if (caseID == 'last') {
			caseID = this.lastCaseID-1;
		}
		let messageID = this.getMessageID(caseID);
		if (messageID) {
			delete this.cases[messageID];
			return client.editMessage({
				channelID: this.channelID,
				messageID,
				embed: {
					title: 'Case #' + caseID,
					description: '[This incident has been revoked.]'
				}
			});
		} else {
			return Promise.reject('Couldn\'t find the message with the case ID ' + caseID);
		}
	}
	getIncident(caseID) {
		if (!this.channelID) {
			// silently fail when there's no modlog channel set
			return null;
		}
		if (caseID == 'last') {
			caseID = this.lastCaseID-1;
		}
		let messageID = this.getMessageID(caseID);
		if (messageID) {
			return new Incident(this.cases[messageID]);
		} else {
			throw 'Couldn\'t find the message with the case ID ' + caseID;
		}
	}
	getUserIncidents(userID) {
		let cases = [];
		for (let messageID in this.cases) {
			if (this.cases[messageID].userID == userID) {
				cases.push(this.cases[messageID]);
			}
		}
		return cases;
	}
	autoAssign(server) {
		let modlogChannel = DiscordUtils.search(server.channels, channel => (/^(mod|automod|moderation).?(log|cases)$/.test(channel.name)));
		if (modlogChannel) {
			this.channelID = modlogChannel.id;
		}
	}
}

module.exports = Modlog;
