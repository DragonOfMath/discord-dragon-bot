const LiveMessage = require('../../../Sessions/LiveMessage');
const {Markdown:md,Format:fmt} = require('../../../Utils');

const NUMBERS = ['zero','one','two','three','four','five','six','seven','eight','nine'];
const NUMBER_BOX = `0⃣`; // this is the stupidest emoji ever

function normalize(reaction) {
	if (!isNaN(Number(reaction))) {
		return reaction+NUMBER_BOX[1];
	} else if (typeof(reaction) === 'object') {
		return reaction.id ? `${reaction.name}:${reaction.id}` : reaction.name;
	} else {
		let id = md.emojiID(reaction);
		if (!id) return reaction;
		let name = md.emojiName(reaction);
		return id ? `${name}:${id}` : name;
	}
}
function emojify(reaction) {
	if (reaction[1] == NUMBER_BOX[1]) {
		return md.emoji(NUMBERS[reaction[0]]);
	}
	let e = reaction.split(':');
	if(e.length == 3) {
		return md.emoji(e[1], e[2], e[0]);
	} else {
		return md.emoji(e[0], e[1]);
	}
}

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
			}
		});
		
		this.choices = {};
		for (let reaction in options.choices) {
			this.choices[normalize(reaction)] = options.choices[reaction];
		}
		//console.log(this.choices);
		this.updateEmbed();
	}
	updateEmbed() {
		let total = this.totalReactions;

		this.embed.description = '';
		for (let reaction in this.choices) {
			let count = this.reactions[reaction] || 0;
			this.embed.description += `${emojify(reaction)} - ${this.choices[reaction]}`;
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
