const {Markdown:md,random} = require('../Utils');

/*
{
	"a": {
		1: 1, // index: weight
		2: 2,
		3: 5,
		7: 2,
		...
	},
	...
}
*/

class Markov {
	constructor(markov = {}) {
		for (var node in markov) {
			this[node] = markov[node];
		}
	}
	get nodes() {
		return Object.keys(this);
	}
	index(node) {
		return this.nodes.indexOf(node);
	}
	add(x,c) {
		this[x] = this[x] || {};
		if (c && c in this) {
			var idx = this.index(x);
			this[c][idx] = (this[c][idx] || 0) + 1;
		}
	}
	digest(text, sliceSize = 1) {
		var off = sliceSize - 1;
		var words = text.split(/[\b\s]+/);
		for (var i = off, node = '', lastNode; i < words.length; i++) {
			lastNode = node;
			node = words.slice(i - off, sliceSize).join(' ');
			this.add(node, lastNode);
		}
	}
	output(iterations = 20, seed) {
		var str = '', node = '', nodes = this.nodes, indexes, weights, idx, sum, rnd;
		if (seed && seed in this) node = seed;
		else node = random(nodes);
		while (iterations-- > 0 && node) {
			str += node + ' ';
			// prepare node
			indexes = Object.keys(this[node]);
			weights = indexes.map(i => this[node][i]);
			// select a random node by its weight
			sum = weights.reduce((s,w) => s + w, 0);
			rnd = random(sum);
			idx = 0;
			while (idx < indexes.length) {
				rnd -= weights[idx];
				if (rnd > 0) idx++;
				else break;
			}
			// use this as the next node in the chain
			node = nodes[indexes[idx]];
		}
		return str;
	}
}

module.exports = {
	'markov': {
		aliases: ['mchain'],
		title: 'Markov Chain',
		category: 'Fun',
		info: 'Produce a sentence using a Markov chain of words and phrases. Can use a seed to start a sentence off.',
		parameters: ['[iterations]','[seed]'],
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
								if (message.author.id != client.id && !message.content.startsWith(client.PREFIX)) {
									M.digest(message.content, 2);
									actualProcessed++;
								}
							}
							return DATA;
						}).save();
						return `${actualProcessed} messages fed to Markov chain.`;
					});
				}
			},
			'clear': {
				title: 'Markov Chain | Clear',
				info: 'Clears all Markov chain data.',
				permissions: {
					type: 'private'
				},
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

