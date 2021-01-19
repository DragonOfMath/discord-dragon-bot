const LiveMessage = require('../../../Sessions/LiveMessage');
const {Markdown:md,Format:fmt,DiscordUtils} = require('../../../Utils');

class Poll extends LiveMessage {
	constructor(context, options = {}) {
		if (typeof(options.topic) === 'undefined') {
			options.topic = context.user.username + ' is wondering...';
		}
		if (typeof(options.choices) === 'undefined') {
			throw 'Poll needs choices.';
		}

		let reactions = Object.keys(options.choices);
		if (reactions.length < 2 || reactions.length > 8) {
			throw 'Poll needs to have between 2-8 choices.';
		}
		
		let message = '';
		if (options.mention == 'here' || options.mention == 'everyone') {
			message = '@' + options.mention;
		}
		super(context.channelID, '', message, {
			title: 'Poll: ' + options.topic,
			description: '',
			footer: {
				text: 'Started by ' + md.atUser(context.user)
			}
		});

		this.userID = context.userID;
		this.topic  = options.topic;

		this.on('reaction', (ctx) => {
			let {reaction, client, userID, change} = ctx;
			if (reaction == LiveMessage.CLOSE && userID == this.userID) {
				return this.delete(client);
			} else if (reaction in this.choices) {
				this.reactions[reaction] = (this.reactions[reaction] || 0) + change;
				this.updateEmbed();
				this.edit(client);
			} else {
				client.warn('Ignoring reaction ' + reaction + ' to message ' + this.messageID);
			}
		});
		
		this.choices = {};
		for (let reaction in options.choices) {
			this.choices[DiscordUtils.serializeReaction(reaction)] = options.choices[reaction];
		}
		this.updateEmbed();
	}
	updateEmbed() {
		let total = this.totalReactions;

		this.embed.description = '';
		for (let reaction in this.choices) {
			let count = this.reactions[reaction] || 0;
			this.embed.description += DiscordUtils.emojifyReaction(reaction) + ' - ' + this.choices[reaction];
			if (total) {
				this.embed.description += ` (${fmt.percent(count/total)})`;
			}
			this.embed.description += '\n';
		}
		return this.embed;
	}
	start(client) {
		return this.setupReactionInterface(client, Object.keys(this.choices));
	}
}

module.exports = Poll;
