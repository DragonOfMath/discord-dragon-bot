const {Markdown:md} = require('../../Utils');
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
			var DATA = client.database.get('client').get(client.id);
			var M = new Markov(DATA.markov);
			return M.output(args[0], args[1]);
		},
		subcommands: {
			'add': {
				aliases: ['input','in'],
				title: 'Markov Chain | Add',
				info: 'Add custom input to the Markov chain.',
				parameters: ['...text'],
				fn({client, arg}) {
					client.database.get('client').modify(client.id, DATA => {
						var M = DATA.markov = new Markov(DATA.markov);
						M.digest(arg, 2);
						return DATA;
					}).save();
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
					var channelID = md.channelID(args[0]);
					if (!channelID) {
						return 'Invalid channel.';
					}
					
					var limit = Number(args[1]) || 100;
					var actualProcessed = 0;
					return client.getMessages({channelID, limit})
					.then(messages => {
						client.database.get('client').modify(client.id, DATA => {
							var M = DATA.markov = new Markov(DATA.markov);
							for (var message of messages) {
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
							return DATA;
						}).save();
						return `${actualProcessed} messages from ${md.channel(channelID)} fed to Markov chain.`;
					});
				}
			},
			'clear': {
				title: 'Markov Chain | Clear',
				info: 'Clears all Markov chain data.',
				permissions: 'private',
				fn({client}) {
					client.database.get('client').modify(client.id, DATA => {
						delete DATA.markov;
						return DATA;
					}).save();
					return 'Data cleared.';
				}
			}
		}
	}
};

