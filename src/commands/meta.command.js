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
			if (args[0]) {
				return client.run(context, args[1]);
			} else if (args[2]) {
				return client.run(context, args[2]);
			} else {
				return 'false';
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
			function loop(ptr) {
				if (ptr < args.length) {
					return client.run(context, args[ptr])
					.then(_data => {
						if (_data.error) {
							// propagate the error
							data.error = _data.error;
							return 'Batch run canceled. (command: `' + args[ptr] + '`)';
						} else return loop(ptr+1);
					});
				} else {
					return 'Batch finished.';
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
			function loop(counter) {
				if (counter > 0) {
					return client.run(context, args[1])
					.then(_data => {
						if (_data.error) {
							// propagate the error
							data.error = _data.error;
							return 'Loop run canceled. (counter: `' + counter + '`)';
						} else return loop(counter-1);
					});
				} else {
					return 'Loop finished.';
				}
			}
			return loop(args[0]);
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
			return client.wait(args[0])
			.then(() => args[1] && client.run(context, args[1]));
		}
	}
};
