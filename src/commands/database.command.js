function chain(object, path) {
	var x = object;
	path.forEach(p => {x = x[p]});
	return x;
}

module.exports = {
	'database': {
		aliases: ['db'],
		category: 'Admin',
		title: 'Database',
		info: 'Interface for database commands.',
		permissions: {
			type: 'private'
		},
		analytics: false,
		suppress: true,
		subcommands: {
			'Get': {
				title: 'Database | Get Item',
				info: 'Retrieve a field from the specified table and record. The field can be nested.',
				parameters: ['table','record','field'],
				fn({client, args}) {
					var [table, record, fields] = args;
					fields = fields.split('.');
					var data = client.database.get(table).get(record);
					var value = chain(data, fields);
					return `**${table}[${record}].${fields.join('.')}** = ${JSON.stringify(value)}.`;
				}
			},
			'Set': {
				title: 'Database | Set Item',
				info: 'Set a field from the specified table and record to the JSON-able value. The field can be nested.',
				parameters: ['table','record','field','value'],
				fn({client, args}) {
					var [table, record, fields, value] = args;
					fields = fields.split('.');
					value = JSON.parse(value);
					client.database.get(table).modify(record, data => {
						var lastField = fields.pop();
						var obj = chain(data, fields);
						obj[lastField] = value;
						fields.push(lastField);
						return data;
					}).save();
					return `**${table}[${record}].${fields.join('.')}** was set to ${JSON.stringify(value)}.`;
				}
			},
			'remove': {
				aliases: ['delete'],
				title: 'Database | Delete Item',
				info: 'Delete a field or record from the specified table.',
				parameters: ['table','record','[field]'],
				fn({client, args}) {
					var [table, record, fields] = args;
					if (fields) {
						fields = fields.split('.');
						client.database.get(table).modify(record, data => {
							var lastField = fields.pop();
							var obj = chain(data, fields);
							delete obj[lastField];
							fields.push(lastField);
							return data;
						}).save();
						return `**${table}[${record}].${fields.join('.')}** was deleted.`;
					} else {
						client.database.get(table).delete(record).save();
						return `**${table}[${record}]** was deleted.`;
					}
				}
			},
			'count': {
				title: 'Database | Record Count',
				info: 'Counts the number of records in a table.',
				parameters: ['table'],
				fn({client, args}) {
					var table = args[0];
					var count = client.database.get(table).records.length;
					return `**${table}** has **${count}** records.`;
				}
			},
			'backup': {
				aliases: ['copy'],
				title: 'Database | Backup',
				info: 'Saves a backup of the database.',
				fn({client}) {
					client.database.backup();
					return 'Backup saved successfully.';
				}
			},
			'revert': {
				aliases: ['restore','undo'],
				title: 'Database | Revert',
				info: 'Loads a backup of the database.',
				fn({client}) {
					client.database.revert();
					return 'Reverted to backup successfully.';
				}
			},
			'prune': {
				aliases: ['gc'],
				title: 'Database | Prune',
				info: 'Garbage collects unused entries in the given table.',
				parameters: ['table'],
				fn({client, args}) {
					var table = args[0];
					var removed = client.database.get(table).gc(client[table]);
					client.notice('Database keys removed from ' + table + ':',removed);
					return 'Removed **' + removed.length + '** unused records from **' + table + '**.';
				}
			}
		}
	}
};
