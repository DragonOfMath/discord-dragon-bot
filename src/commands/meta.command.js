function propagate(data,_data) {
	data.error = _data.error;
	return data;
}

module.exports = {
	'noop': {
		aliases: ['nop', 'nope', 'nothing'],
		category: 'Meta',
		info: 'Does nothing.',
		permissions: {
			type: 'public'
		},
		fn() {}
	},
	'if': {
		category: 'Meta',
		info: 'If `condition` evaluates to *true*, it runs `trueCommand`; else, it runs `falseCommand` (if there is one).',
		parameters: ['condition', '{trueCommand}', '[{falseCommand}]'],
		permissions: {
			type: 'public'
		},
		fn(data) {
			const {client, args, context} = data;
			var [condition, ifTrue, ifFalse] = args;
			client.log('If condition:',condition);
			if (condition) {
				return client.run(context, ifTrue)
				.then(_data => {propagate(data,_data)});
			} else if (ifFalse) {
				return client.run(context, ifFalse)
				.then(_data => {propagate(data,_data)});
			}
		}
	},
	'while': {
		category: 'Meta',
		info: 'Repeats a command while `condition` evaluates to *true*.',
		parameters: ['condition', '{command}'],
		permissions: {
			type: 'public'
		},
		fn(data) {
			// note: input contains the original, unevaluated arguments
			const {client, args, context, input} = data;
			const [condition, command] = args;
			client.log('While condition:',condition);
			if (condition) {
				return client.run(context, command)
				.then(_data => {
					if (_data.error) {
						propagate(data, _data);
						return 'While loop canceled.';
					} else {
						return client.run(context, input);
					}
				});
			} else {
				client.log('While loop finished.');
			}
		}
	},
	'batch': {
		aliases: ['bat', 'multi'],
		category: 'Meta',
		info: 'Runs a batch of commands sequentially (with a delay to prevent rate-limiting). If an error is raised, it will stop mid-execution.',
		parameters: ['{...commands}'],
		permissions: {
			type: 'public'
		},
		fn(data) {
			const {client, args, context} = data;
			const len = args.length;
			function loop(ptr) {
				client.log('Batch pointer:',ptr+1,'/',len);
				if (ptr < len) {
					return client.run(context, args[ptr])
					.then(_data => {
						if (_data.error) {
							propagate(data, _data);
							return 'Batch run canceled. (command: `' + args[ptr] + '`)';
						} else return loop(ptr+1);
					});
				} else {
					client.log('Batch finished.');
					//return 'Batch finished.';
				}
			}
			return loop(0);
		}
	},
	'repeat': {
		aliases: ['rept', 'loop'],
		category: 'Meta',
		info: 'Runs a command a specified number of times or until an error occurs.',
		parameters: ['count', '{command}'],
		permissions: {
			type: 'public'
		},
		fn(data) {
			const {client, args, context} = data;
			const [maxCount,command] = args;
			function loop(counter) {
				client.log('Loop counter:',counter+1,'/',maxCount);
				if (counter < maxCount) {
					return client.run(context, command)
					.then(_data => {
						if (_data.error) {
							propagate(data, _data);
							return 'Loop run canceled. (counter: `' + counter + '`)';
						} else return loop(counter+1);
					});
				} else {
					client.log('Loop finished.');
					//return 'Loop finished.';
				}
			}
			return loop(0);
		}
	},
	'delay': {
		aliases: ['wait', 'timeout'],
		category: 'Meta',
		info: 'Wait a specified delay of time (in milliseconds), then run a command if provided.',
		parameters: ['delay', '[{command}]'],
		permissions: {
			type: 'public'
		},
		fn(data) {
			const {client, args, context} = data;
			const [delay,command] = args;
			client.log('Wait:',delay+'ms');
			return client.wait(delay)
			.then(() => {
				client.log('Wait finished.');
				if (command) {
					return client.run(context, command)
					.then(_data => {propagate(data,_data)});
				}
			});
		}
	},
	'interval': {
		category: 'Meta',
		info: 'Repeat a command with delay.',
		parameters: ['repetition', 'delay', '{command}'],
		permissions: {
			type: 'public'
		},
		fn(data) {
			const {client, args, context} = data;
			const [repetition, delay, command] = args;
			function loop(counter) {
				client.log('Interval counter:',counter+1,'/',repetition);
				if (counter < repetition) {
					return client.run(context, command)
					.then(_data => {
						if (_data.error) {
							propagate(data, _data);
							return 'Interval run canceled. (counter: `' + counter + '`)';
						} else {
							client.log('Wait:',delay+'ms');
							return client.wait(delay).then(() => loop(counter+1));
						}
					});
				} else {
					client.log('Interval loop finished.');
					//return 'Interval finished.';
				}
			}
			return loop(0);
		}
	},
	'cancel': {
		aliases: ['throw','error'],
		category: 'Meta',
		info: 'Intentionally throw an error, useful for stopping execution of metacommands.',
		parameters: ['[message]'],
		permissions: {
			type: 'public'
		},
		fn({client, args}) {
			throw args[0] || 'MetaCancelError';
		}
	},
	'try': {
		aliases: ['catch'],
		category: 'Meta',
		info: 'Runs a command, and if it throws an error, continues rather than propagate the error.',
		parameters: ['{command}'],
		permissions: {
			type: 'public'
		},
		fn(data) {
			const {client, args, context} = data;
			return client.run(context, args[0])
			.then(_data => {
				if (_data.error) {
					client.log('Error propagation successfully stopped.');
					return `(Error caught: ${_data.error})`;
				}
			});
		}
	},
	'async': {
		category: 'Meta',
		info: 'Run a command asynchronously.',
		parameters: ['{command}'],
		permissions: {
			type: 'public'
		},
		fn(data) {
			const {client, args, context} = data;
			client.run(context, args[0])
			.then(_data => {
				propagate(data,_data);
			});
		}
	}
};
