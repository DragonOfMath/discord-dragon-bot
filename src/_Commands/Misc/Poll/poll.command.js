const Poll = require('./Poll');

module.exports = {
	'poll': {
		aliases: ['polling','vote','voting'],
		category: 'Misc',
		title: 'Poll',
		info: 'Start a poll in the channel. Specify a topic and 2-10 choices. Optionally, you can specify the emoji for a choice by prepending it with the emoji and a `=`, otherwise it defaults to 0-9',
		parameters: ['topic','...emoji=choice'],
		flags: ['m|mention'],
		permissions: 'privileged',
		fn({client, context, args, flags}) {
			let mention = flags.has('m') ? flags.get('m') : flags.has('mention') ? flags.get('mention') : '';
			let [topic, ...choices] = args;
			choices = choices.slice(0,10);
			choices = choices.reduce((_choices,c,i) => {
				c = c.split('=');
				if (c.length == 1) {
					_choices[i] = c[0];
				} else {
					_choices[c[0]] = c[1];
				}
				return _choices;
			}, {});
			let poll = new Poll(context, {topic,choices,mention});
			poll.start(client);
		}
	}
};
