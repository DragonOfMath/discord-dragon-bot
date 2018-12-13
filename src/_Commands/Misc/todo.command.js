const {Markdown:md,random,strcmp} = require('../../Utils');

const MAX_CHARS = 100;
const MAX_ITEMS = 20;

function parseID(arg) {
	return Number(arg.match(/\d+/)) - 1;
}

function stringify(id, item) {
	return `#${id}: ${item}`;
}

module.exports = {
    'todo': {
        aliases: ['checklist'],
        category: 'Misc',
        title: 'To-Do List',
        info: `Gets your to-do list or adds a new item to it. (limited to ${MAX_CHARS} chars/item and ${MAX_ITEMS} items)`,
        parameters: ['[id|objective]'],
        permissions: 'inclusive',
        fn({client, user, arg}) {
            let todoList = client.database.get('users').get(user.id).todo || [];
			if (!arg) {
				return {
                    title: 'For ' + user.username,
                    description: todoList.map((todo,id) => stringify(id+1,todo)).join('\n')
                };
			}
            if (/^#?\d+$/.test(arg)) {
				let id = Math.max(0, Math.min(parseID(arg), todoList.length - 1));
				return 'Objective ' + stringify(id+1,todoList[id]);
			}
			if (todoList.length == MAX_ITEMS) {
				throw 'Oops, your to-do list is full! Maybe you should try working on some things first...';
			}
			if (arg.length > MAX_CHARS) {
				throw `Too long! Please shorten the objective to within ${MAX_CHARS} characters.`;
			}
			let id = todoList.push(arg);
			client.database.get('users').modify(user.id, data => {
				data.todo = todoList;
				return data;
			}).save();
			return md.underline('New Objective:') + '\n' + stringify(id, arg);
        },
        subcommands: {
            'next': {
                aliases: ['random'],
                title: 'To-Do List',
                info: 'Picks a random thing from your to-do list.',
                fn({client, user}) {
                    let todoList = client.database.get('users').get(user.id).todo || [];
                    if (todoList.length) {
						let id = random(todoList.length);
                        return md.underline('Next Objective:') + '\n' + stringify(id+1,todoList[id]);
                    } else {
                        return 'Your to-do list is empty.';
                    }
                }
            },
            'done': {
                aliases: ['check','finish','finished','complete','completed'],
                title: 'To-Do List',
                info: 'Complete an objective on your to-do list.',
                parameters: ['id|objective'],
                fn({client, user, arg}) {
                    let todoList = client.database.get('users').get(user.id).todo || [];
					let idx;
					if (/^#?\d+$/.test(arg)) {
						idx = Math.max(0, Math.min(parseID(arg), todoList.length - 1));
					} else {
						idx = todoList.findIndex(todo => strcmp(todo,arg));
					}
                    if (idx > -1) {
                        let objective = todoList[idx];
                        todoList.splice(idx, 1);
                        if (objective) {
                            client.database.get('users').modify(user.id, data => {
                                data.todo = todoList;
                                return data;
                            }).save();
                            return md.underline('Objective Complete:') + '\n' + stringify(idx+1,objective);
                        }
                    }
                    return 'That wasn\'t on your to-do list...?';
                }
            },
            'clear': {
                aliases: ['reset','redo'],
                title: 'To-Do List',
                info: 'Clear all objectives from your to-do list.',
                fn({client, user}) {
                    client.database.get('users').modify(user.id, data => {
                        delete data.todo;
                        return data;
                    }).save();
                    return 'Your to-do list has been cleared. Time to start over?';
                }
            }
        }
    }
}