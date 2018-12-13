const {Markdown:md} = require('../Utils');

/**
 * @class Incident
 * Represents an entry in the Moderation Log ("modlog") pertaining to a specific action done by a moderator.
 * It shows who is the responsible moderator, who is the guilty user, what was issued, and why (if given).
 * An incident may be edited later for clarification purposes.
*/
class Incident {
	constructor(caseID, modID, userID, issue, notes) {
		if (typeof(arguments[0]) === 'object') {
			this.caseID = arguments[0].caseID;
			this.modID  = arguments[0].modID;
			this.userID = arguments[0].userID;
			this.issue  = arguments[0].issue;
			this.notes  = arguments[0].notes;
		} else {
			this.caseID = caseID;
			this.modID  = modID;
			this.userID = userID;
			this.issue  = issue;
			this.notes  = notes;
		}
		if (this.caseID === undefined) {
			throw new Error('caseID is undefined');
		}
		if (this.modID === undefined) {
			throw new Error('modID is undefined');
		}
		if (this.userID === undefined) {
			throw new Error('userID is undefined');
		}
		if (this.issue === undefined) {
			throw new Error('issue is undefined');
		}
	}
	toString() {
		return `${md.bold('Case #'+this.caseID)}: ${md.mention(this.modID)} issued a ${md.bold(this.issue)} to ${md.mention(this.userID)}. Notes: ${md.bold(this.notes)}`;
	}
	edit(modify) {
		return modify(this);
	}
	embed() {
		let embed = {
			title: `Case #${this.caseID}`,
			timestamp: new Date(),
			fields: [
				{
					name: ':police_car: Issue',
					value: this.issue,
					inline: true
				},
				{
					name: ':cop: Moderator',
					value: md.mention(this.modID),
					inline: true
				}
			]
		};
		if (Array.isArray(this.userID)) {
			embed.fields.push({
				name: ':busts_in_silhouette: Users',
				value: this.userID.map(md.mention).join(', '),
				inline: true
			});
		} else {
			embed.fields.push({
				name: ':bust_in_silhouette: User',
				value: md.mention(this.userID),
				inline: true
			});
		}
		embed.fields.push({
			name: ':notepad_spiral: Notes',
			value: this.notes || md.italics('Edit the notes of this case with ' + md.code('mod.editnotes ' + this.id)),
			inline: false
		});
		return embed;
	}
}

module.exports = Incident;
