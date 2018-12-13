const {Markdown:md} = require('../../../Utils');
const Markov = require('./Markov');

module.exports = {
	'markov': {
		aliases: ['mchain'],
		title: 'Markov Chain',
		category: 'Fun',
		info: 'Produce a sentence using a Markov chain of words and phrases. Can use a seed to start a sentence off.',
		parameters: ['[iterations]','[seed]'],
		permissions: 'inclusive',
		fn({client, args, userID}) {
			return Markov.load().output(...args);
		},
		subcommands: {
			'add': {
				aliases: ['input','in'],
				title: 'Markov Chain | Add',
				info: 'Add custom input to the Markov chain.',
				parameters: ['...text'],
				fn({client, arg}) {
					Markov.load().digest(arg, 2).save();
					return 'Input fed to Markov chain.';
				}
			},
			'read': {
				aliases: ['messages'],
				title: 'Markov Chain | Read Messages',
				info: 'Read a number of messages in a channel and add them to the Markov chain. Default is 100 messages (ignores command messages)',
				parameters: ['channel','[count]'],
				permissions: 'privileged',
				fn({client, args}) {
					let channelID = md.channelID(args[0]);
					if (!channelID) {
						return 'Invalid channel.';
					}
					
					let limit = Number(args[1]) || 100;
					let actualProcessed = 0;
					return client.getMessages({channelID, limit})
					.then(messages => {
						let M = Markov.load();
						for (let message of messages) {
							// no messages from the bot or from unknown authors
							if (message.author && message.author.id != client.id && 
								// no commands
								!message.content.startsWith(client.PREFIX) &&
								// no messages with attachments/embeds
								!(message.attachments.length || message.embeds.length)) { 
								M.digest(message.content, 2);
								actualProcessed++;
							}
						}
						M.save();
						return `${actualProcessed} messages from ${md.channel(channelID)} fed to Markov chain.`;
					});
				}
			},
			'clear': {
				title: 'Markov Chain | Clear',
				info: 'Clears all Markov chain data.',
				permissions: 'private',
				fn({client}) {
					Markov.clear();
					return 'Data cleared.';
				}
			}
		}
	}
};

