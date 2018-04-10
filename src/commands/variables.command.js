module.exports = {
	'var': {
		aliases: ['variable'],
		category: 'Meta',
		title: 'Variable',
		info: 'Gets or sets a variable. *Hint: if you are assigning the result of an expression to a variable, use* `%(...)`',
		parameters: ['name', '[value]'],
		permissions: {
			type: 'public'
		},
		fn({client, args, serverID}) {
			var [name, value] = args;
			name = name.toLowerCase();
			if (typeof(value) !== 'undefined') {
				client.variables.set(serverID, name, value);
			} else {
				value = client.variables.get(serverID, name);
			}
			return `**${name}** = ${value}`;
		},
		subcommands: {
			'inc': {
				aliases: ['increment'],
				title: 'Variable | Increment',
				info: 'Increments a variable by 1, or by some amount.',
				parameters: ['name', '[value]'],
				permissions: {
					type: 'public'
				},
				fn({client, args, serverID}) {
					var [name, value = 1] = args;
					name  = name.toLowerCase();
					value = Number(client.variables.get(serverID, name)) + Number(value);
					client.variables.set(serverID, name, value);
					return `**${name}** = ${value}`;
				}
			},
			'dec': {
				aliases: ['decrement'],
				title: 'Variable | Decrement',
				info: 'Decrements a variable by 1, or by some amount.',
				parameters: ['name', '[value]'],
				permissions: {
					type: 'public'
				},
				fn({client, args, serverID}) {
					var [name, value = 1] = args;
					name  = name.toLowerCase();
					value = Number(client.variables.get(serverID, name)) - Number(value);
					client.variables.set(serverID, name, value);
					return `**${name}** = ${value}`;
				}
			},
			'del': {
				aliases: ['delete'],
				title: 'Variable | Delete',
				info: 'Deletes a variable.',
				parameters: ['name'],
				permissions: {
					type: 'public'
				},
				fn({client, args, serverID}) {
					var name = args[0];
					name = name.toLowerCase();
					var serverVars = client.variables.get(serverID);
					delete serverVars[name];
					return `**${name}** was deleted.`;
				}
			}
		}
	},
	'foreach': {
		aliases: ['for','enumerate','enum'],
		category: 'Meta',
		info: 'Enumerates a range of values. If `enumerable` is a number, it iterates from 0 up to N-1 (hard limit of 10000). If it\'s a string, it iterates using each character.',
		parameters: ['enumerable', 'var', '{command}'],
		permissions: {
			type: 'public'
		},
		fn(data) {
			const {client, args, serverID, context, input} = data;
			var [enumerable,varName,command] = args;
			if (typeof(enumerable) === 'number') {
				enumerable = Array(Math.min(enumerable,10000)).fill(0).map((x,i) => i);
			}
			function enumerate(ptr) {
				if (ptr < enumerable.length) {
					client.variables.set(serverID, varName, enumerable[ptr]);
					return client.run(context, command)
					.then(_data => {
						if (_data.error) {
							data.error = _data.error;
							return 'Enumeration canceled. (iterator: `' + enumerable[ptr] + '`)';
						} else return enumerate(ptr+1);
					});
				}
			}
			return enumerate(0);
		}
	}
};
