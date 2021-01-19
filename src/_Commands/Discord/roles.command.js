const Discord = require('discord.io');
const Resource = require('../../Structures/Resource');
const RoleSelectionMenu = require('./RoleSelectionMenu');
const {Markdown:md,Format:fmt,DiscordUtils,parseCSV} = require('../../Utils');

/**
	Resolves the roles to their respective Role objects
	@arg {Array} roleArgs - the IDs, role mentions, or names of the roles to resolve
*/
function resolveRoles(roleArgs, server) {
	var validRoles = [];
	var invalidRoles = [];
	for (var id of parseCSV(roleArgs)) {
		var role = findRole(server, id);
		if (role) {
			validRoles.push(role);
		} else {
			invalidRoles.push(id);
		}
	}
	if (invalidRoles.length > 0) {
		throw 'Invalid Roles: ' + invalidRoles.map(md.code).join(', ');
	}
	return validRoles;
}
function findRole(server, id) {
	id = md.roleID(id) || id;
	return (id in server.roles) ? server.roles[id] : DiscordUtils.getRoleByName(server, id);
}
function listRoles(roleList) {
	if (roleList.length) {
		return roleList.map(({role,error}) => md.bold(role) + (error?` (${error})`:'')).join('\n');
	} else {
		return '(None)';
	}
}
function getRoleMenu(client, server, menuName) {
	let serverID = server.id || server;
	let key = serverID + ':' + menuName;
	if (key in client.TEMP) return client.TEMP[key];
	for (let messageID in client.liveMessages) {
		let message = client.liveMessages[messageID];
		if (message instanceof RoleSelectionMenu && message.serverID == serverID && message.name == menuName) return message;
	}
	return null;
}
function makeReactionRoleMap(server, pairs) {
	let roles = {};
	for (let pair of pairs) {
		let [reaction,role] = pair.split('=');
		role = findRole(server, role);
		if (!role) {
			throw 'Unknown role: ' + pair;
		}
		roles[role.id] = reaction;
	}
	return roles;
}

class Role extends Resource {
	constructor(r = {}) {
		super({
			assign: false,
			aliases: []
		}, r);
	}
}

module.exports = {
	'roles': {
		aliases: ['role','iama','iam','rank'],
		category: 'Discord',
		title: 'Role',
		info: 'Assigns roles to you. Use commas to separate role names.',
		parameters: ['...roles'],
		permissions: 'public',
		fn({client, server, user, member, args}) {
			var roleTable = client.database.get('roles');
			var roles = resolveRoles(args, server);
			var rolesGiven = [];
			
			function rec(role,error) {
				rolesGiven.push({role,error});
			}
			async function giveRoles() {
				for (var role of roles) {
					try {
						var roleID = role.id;
						if (member.roles.includes(roleID)) {
							throw 'You already have this role.';
						}
						
						var r = new Role(roleTable.get(roleID));
						if (!r.assign) {
							throw 'Role is not self-assignable.';
						}
						
						await client.addToRole({
							serverID: server.id,
							userID: user.id,
							roleID
						});
						rec(role.name);
					} catch (e) {
						console.error(e);
						rec(role.name,e);
					}
				}
				return md.mention(user) + ' You have been given the following roles:\n' + listRoles(rolesGiven);
			}
			return giveRoles();
		},
		subcommands: {
			'remove': {
				aliases: ['take','iamnota','iamnot'],
				title: 'Roles | Remove',
				info: 'Removes roles from you. Use commas to separate role names.',
				parameters: ['...roles'],
				fn({client, server, user, member, args}) {
					var roleTable = client.database.get('roles');
					var roles = resolveRoles(args, server);
					var rolesTaken = [];
					
					function rec(role,error) {
						rolesTaken.push({role,error});
					}
					async function takeRoles() {
						for (var role of roles) {
							try {
								var roleID = role.id;
								if (!member.roles.includes(role.id)) {
									throw 'You do not have this role.';
								}
								
								var r = new Role(roleTable.get(roleID));
								if (!r.assign) {
									throw 'Role is not self-assignable.';
								}
								
								await client.removeFromRole({
									serverID: server.id,
									userID: user.id,
									roleID
								});
								rec(role.name);
							} catch (e) {
								rec(role.name, e);
							}
						}
						return md.mention(user) + ' You have been removed from the following roles:\n' + listRoles(rolesTaken);
					}
					
					return takeRoles();
				}
			},
			'list': {
				aliases: ['show', 'display', 'roles'],
				title: 'Roles | List',
				info: 'Lists all roles that may be assigned/removed.',
				fn({client, server}) {
					var roles = client.database.get('roles').filter((id,role) => {
						var r = new Role(role);
						return id in server.roles && r.assign;
					});
					if (roles.length) {
						return 'The following roles are self-assignable:\n' + roles.map(id => server.roles[id].name).join(', ');
					} else {
						return 'There are no self-assignable roles on this server.';
					}
				}
			},
			'create': {
				aliases: ['make','new'],
				category: 'Admin',
				title: 'Roles | Create',
				info: 'Create new self-assignable role(s), with no special permissions. You can assign a color to a role by appending it with `:color`, e.g. `artist:#FFFF00` (for yellow). Use commas to separate role names.',
				parameters: ['...roles'],
				permissions: 'privileged',
				fn({client, server, arg}) {
					var roleTable = client.database.get('roles');
					var roles = parseCSV(arg);
					var rolesCreated = [];
					
					function rec(role,error) {
						rolesCreated.push({role,error});
					}
					return (async function makeRoles() {
						for (var role of roles) {
							var [name,color] = role.split(':');
							try {
								if (findRole(server,name)) {
									throw 'Role already exists';
								}
								role = await client.createRole({
									serverID: server.id,
									name,
									color,
									hoist: false,
									//permissions: {},
									mentionable: true
								});
								// add the role to the role table
								roleTable.modify(role.id, r => new Role({assign:true}));
								rec(name);
							} catch (e) {
								rec(name,e);
							}
						}
						roleTable.save();
						return 'The following roles have been created:\n' + listRoles(rolesCreated);
					})();
				}
			},
			'rename': {
				aliases: ['name'],
				category: 'Admin',
				title: 'Roles | Rename',
				info: 'Renames an existing role. Use quote marks for multi-word role names.',
				parameters: ['oldname','newname'],
				permissions: 'privileged',
				fn({client, server, args}) {
					var role = findRole(server, args[0]);
					if (!role) {
						throw 'Invalid role ID.';
					}
					var oldName = role.name;
					var newName = args[1];
					return client.editRole({
						roleID: role.id,
						serverID: server.id,
						name: newName
					})
					.then(() => {
						return `${md.bold(oldName)} renamed to ${md.bold(newName)}.`;
					});
				}
			},
			'recolor': {
				aliases: ['color'],
				category: 'Admin',
				title: 'Roles | Recolor',
				info: 'Replaces color of an existing role. Use quote marks for multi-word role names.',
				parameters: ['role','color'],
				permissions: 'privileged',
				fn({client, server, args}) {
					var role = findRole(server, args[0]);
					if (!role) {
						throw 'Invalid role ID.';
					}
					var roleName = role.name;
					var oldColor = role.color;
					var newColor = args[1];
					return client.editRole({
						roleID: role.id,
						serverID: server.id,
						color: newColor
					})
					.then(() => {
						return `${md.bold(roleName)} recolored from ${md.bold(oldColor)} to ${md.bold(newColor)}.`;
					});
				}
			},
			'assign': {
				aliases: ['register'],
				category: 'Admin',
				title: 'Roles | Assign',
				info: 'Makes role(s) self-assignable. Use commas to separate role names.',
				parameters: ['...roles'],
				permissions: 'privileged',
				fn({client, server, args}) {
					var roleTable = client.database.get('roles');
					var roles = resolveRoles(args, server);
					for (var role of roles) {
						roleTable.modify(role.id, r => {
							r = new Role(r);
							r.assign = true;
							return r;
						});
					}
					roleTable.save();
					return `Roles saved:\n${roles.map(r => md.bold(r.name)).join('\n')}`;
				}
			},
			'unassign': {
				aliases: ['unregister'],
				category: 'Admin',
				title: 'Roles | Un-Assign',
				info: 'Makes role(s) un-self-assignable. Use commas to separate role names.',
				parameters: ['...roles'],
				permissions: 'privileged',
				fn({client, server, args}) {
					var roleTable = client.database.get('roles');
					var roles = resolveRoles(args, server);
					for (var role of roles) {
						roleTable.modify(role.id, r => {
							r = new Role(r);
							r.assign = false;
							return r;
						});
					}
					roleTable.save();
					return `Roles saved:\n${roles.map(r => md.bold(r.name)).join('\n')}`;
				}
			},
			'permissions': {
				aliases: ['perms'],
				category: 'Admin',
				title: 'Roles | Set Permissions',
				info: 'Override role permissions. Use ! in front of permission flags to disable them.',
				parameters: ['role', '...flags'],
				permissions: 'privileged',
				fn({client, server, args}) {
					let [role,...flags] = args;
					role = findRole(server, role);
					if (!role) {
						throw 'Invalid role ID.';
					}
					let permissions = {};
					for (let flag of flags) {
						let allow = flag[0] != '!';
						if (!allow) flag = flag.substring(1);
						flag = flag.toUpperCase();
						if (!(flag in Discord.Permissions)) {
							throw 'Invalid permission: ' + md.code(flag) + '. Valid values: ' + Object.keys(Discord.Permissions).join(', ');
						}
						permissions[flag] = allow;
					}
					return client.editRole({
						serverID: server.id,
						roleID: role.id,
						permissions
					})
					.then(() => {
						return md.bold(role.name) + ' permissions successfully updated. :white_check_mark:';
					});
				}
			}
		}
	},
	'rolemenu': {
		title: 'Role Menu',
		category: 'Admin',
		info: 'Role Menu Interface',
		permissions: 'privileged',
		async init(client) {
			let channelTable = client.database.get('channels');
			for (let channelID in channelTable) {
				if (!(channelID in client.channels)) {
					channelTable.delete(channelID);
					continue;
				}
				let PLM = channelTable.get(channelID).persistentLiveMessages;
				if (PLM) for (let messageID in PLM) {
					if (PLM[messageID].type == 'RoleSelectionMenu') {
						//console.log(channelID, messageID, PLM[messageID]);
						let menu = new RoleSelectionMenu(channelID, messageID, PLM[messageID]);
						await menu.restore(client);
						client.notice('Restored ' + menu.toString());
					}
				}
			}
		},
		subcommands: {
			'create': {
				aliases: ['new'],
				title: 'Role Menu | Create Menu',
				info: 'Make a new role menu for this server. You can use flags to set the channel, the max roles that can be assigned, and whether to message users when they gain or lose a role.',
				parameters: ['menuName', '[...reaction=role]'],
				flags: ['channel','max|maxRoles','messaging','d|description','c|color'],
				fn({client, server, args, flags}) {
					let [name,...pairs] = args;
					let channelID    = flags.get('channel') ?? '';
					let maxRoles     = flags.get('maxRoles') ?? flags.get('max') ?? 0;
					let messageUsers = flags.get('messageUsers') ?? flags.get('messaging') ?? false;
					let description  = flags.get('description') ?? flags.get('d') ?? '';
					let color        = flags.get('color') ?? flags.get('c') ?? '';
					channelID = md.channelID(channelID) || channelID;
					if (getRoleMenu(client, server, name)) {
						throw 'A menu with that name already exists in this server!';
					}
					let menu = new RoleSelectionMenu(channelID, '', {name, maxRoles, messageUsers, description, color});
					if (pairs.length) {
						let roles = makeReactionRoleMap(server, pairs);
						for (let id in roles) {
							roles[id] = {reaction:DiscordUtils.serializeReaction(roles[id])};
						}
						menu.addRoles(client, server.id, roles);
					}
					if (menu.channelID) {
						return menu.setupReactionInterface(client)
						.then(() => menu.name + ': created in ' + md.channel(menu.channelID) + '.');
					} else {
						// create a temporary object in memory
						client.TEMP[server.id + ':' + name] = menu;
						menu.serverID = server.id;
						return menu.name + ': created. You should assign a channel to display it or this may be discarded.';
					}
				}
			},
			'delete': {
				aliases: ['close'],
				title: 'Role Menu | Delete Menu',
				info: 'Delete a role menu.',
				parameters: ['menuName'],
				fn({client, server, arg}) {
					let menu = getRoleMenu(client, server, arg);
					if (menu) {
						if (menu.messageID) {
							// remove persistent menu
							return menu.delete(client).then(() => 'Menu deleted.');
						} else {
							// remove temp menu
							delete client.TEMP[server.id + ':' + menu.name];
							return menu.close(client).then(() => 'Menu deleted');
						}
					} else {
						throw 'Invalid menu name: ' + arg;
					}
				}
			},
			'update': {
				title: 'Role Menu | Update Menu',
				info: 'Refreshes the role menu.',
				parameters: ['menuName'],
				permissions: 'private',
				analytics: false,
				fn({client, server, arg}) {
					let menu = getRoleMenu(client, server, arg);
					if (menu) {
						return menu.saveAndUpdate(client).then(() => 'Menu refreshed.');
					} else {
						throw 'Invalid menu name: ' + arg;
					}
				}
			},
			'list': {
				title: 'Role Menu | List Menus',
				info: 'List all menus in use in this server.',
				parameters: ['[channel]'],
				fn({client, server, arg}) {
					let menus = client.liveMessages.filter((messageID, message) => {
						return message instanceof RoleSelectionMenu && message.serverID == server.id;
					}).map(messageID => client.liveMessages[messageID]);
					if (arg) {
						let channelID = md.channelID(arg) || arg;
						menus = menus.filter(menu => menu.channelID == channelID);
					}
					if (!menus.length) return 'No menus found.';
					return menus.map(menu => {
						if (menu.messageID) {
							return md.bold(menu.name) + ' in ' + md.channel(menu.channelID) + '(ID: ' + menu.messageID + ')';
						} else {
							return md.bold(menu.name) + ' (no channel assigned)';
						}
					}).join('\n');
				}
			},
			'add': {
				title: 'Role Menu | Add Role(s)',
				info: 'Add reaction/role pairs to a menu. To create new roles, use the `roles.create` command instead.',
				parameters: ['menuName', '...reaction=role'],
				fn({client, server, args}) {
					let [menuName,...pairs] = args;
					let menu = getRoleMenu(client, server, menuName);
					if (menu) {
						let roles = makeReactionRoleMap(server, pairs);
						for (let id in roles) {
							roles[id] = {reaction:DiscordUtils.serializeReaction(roles[id])};
						}
						return menu.addRoles(client, server.id, roles)
						.then(({added,changed,missing,ignored}) => {
							let bits = [];
							if (added.length) {
								bits.push('added ' + added.length + ' roles');
							}
							if (changed.length) {
								bits.push('changed ' + changed.length + ' roles');
							}
							if (missing.length) {
								bits.push('missing ' + missing.length + ' roles (' + missing.join(', ') + ')');
							}
							if (ignored.length) {
								bits.push('ignored ' + ignored.length + ' roles (' + ignored.join(', ') + ')');
							}
							return menu.name + ': ' + bits.join(', ') + '.';
						});
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			},
			'remove': {
				title: 'Role Menu | Remove Role(s)',
				info: 'Remove roles from a menu.',
				parameters: ['menuName', '...roles'],
				fn({client, server, args}) {
					let [menuName,...roles] = args;
					let menu = getRoleMenu(client, server, menuName);
					if (menu) {
						roles = roles.map(role => findRole(server, role));
						return menu.removeRoles(client, server.id, roles)
						.then(r => menu.name + ': removed ' + fmt.plural('role', r.length) + '.');
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			},
			'rename': {
				title: 'Role Menu | Rename Menu',
				info: 'Rename a menu.',
				parameters: ['menuName', 'newName'],
				fn({client, server, args}) {
					let [menuName,newName] = args;
					let menu = getRoleMenu(client, server, menuName);
					if (menu) {
						if (!menu.messageID) {
							delete client.TEMP[server.id + ':' + menu.name];
							client.TEMP[server.id + ':' + newName] = menu;
						}
						menu.name = newName;
						return menu.saveAndUpdate(client)
						.then(() => menu.name + ': name updated.');
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			},
			'channel': {
				title: 'Role Menu | Assign Channel',
				info: 'Assigns a channel to display this menu. If it already is assigned a channel, it will be moved to the new one.',
				parameters: ['menuName', 'channel'],
				fn({client, server, args}) {
					let [menuName,channelID] = args;
					menu = getRoleMenu(client, server, menuName);
					if (menu) {
						channelID = md.channelID(channelID) || channelID;
						if (menu.channelID) {
							return menu.move(client, channelID)
							.then(() => menu.name + ': moved to ' + md.channel(channelID) + '.');
						} else {
							menu.channelID = channelID;
							return menu.setupReactionInterface(client)
							.then(() => menu.name + ': displayed in ' + md.channel(menu.channelID) + '.');
						}
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			},
			'max': {
				aliases: ['maximum','maxroles'],
				title: 'Role Menu | Set Maximum Roles',
				info: 'Set the maximum assignable roles for a menu. Use 0 for unlimited roles.',
				parameters: ['menuName', 'max'],
				fn({client, server, args}) {
					let [menuName,max] = args;
					let menu = getRoleMenu(client, server, menuName);
					if (menu) {
						menu.maxRoles = Number(max) || 0;
						return menu.saveAndUpdate(client)
						.then(() => menu.name + ': max # of roles updated.');
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			},
			'messaging': {
				aliases: ['messageusers'],
				title: 'Role Menu | Set Messaging',
				info: 'Set to send messages to users when they add or remove a role for themselves.',
				parameters: ['menuName', '<true|false|0|1>'],
				fn({client, server, args}) {
					let [menuName,messaging] = args;
					let menu = getRoleMenu(client, server, menuName);
					if (menu) {
						menu.messageUsers = !!messaging || false;
						return menu.saveAndUpdate(client)
						.then(() => menu.name + ': messaging updated.');
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			},
			'color': {
				title: 'Role Menu | Set Menu Color',
				info: 'Set the color for a role menu. Use a CSS color format, ex. #FFFFFF.',
				parameters: ['menuName','color'],
				fn({client, server, args}) {
					let [menuName,color] = args;
					let menu = getRoleMenu(client, server, menuName);
					if (menu) {
						menu.color = color;
						return menu.saveAndUpdate(client)
						.then(() => menu.name + ': color updated.');
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			},
			'description': {
				title: 'Role Menu | Describe Menu',
				info: 'Write a description for the role menu itself.',
				parameters: ['menuName', '...description'],
				fn({client, server, args}) {
					let [menuName,...description] = args;
					description = description.join(' ');
					let menu = getRoleMenu(client, server, menuName);
					if (menu) {
						menu.description = description;
						return menu.saveAndUpdate(client)
						.then(() => menu.name + ': description updated.');
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			},
			'describe': {
				aliases: ['roledescription','describerole','roletext'],
				title: 'Role Menu | Describe Role',
				info: 'Write or clear a description for a role in a menu.',
				parameters: ['menuName', 'role', '...description'],
				fn({client, server, args}) {
					let [menuName,roleName,...description] = args;
					description = description.join(' ');
					let menu = getRoleMenu(client, server, menuName);
					if (menu) {
						let role = findRole(server, roleName);
						if (role) {
							if (description) {
								menu.roles[role.id].description = description;
							} else {
								delete menu.roles[role.id].description;
							}
							return menu.saveAndUpdate(client)
							.then(() => menu.name + ': "' + role.name + '" description updated.');
						} else {
							throw 'Invalid role: ' + roleName;
						}
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			},
			'sort': {
				title: 'Role Menu | Sort Roles',
				info: 'Re-order the roles in a menu by some criteria.',
				parameters: ['menuName','<name|color|reaction|permissions>','[<ascending|descending>]'],
				fn({client, server, args}) {
					let [menuName,criteria,order] = args;
					menu = getRoleMenu(client, server, menuName);
					if (menu) {
						return menu.sortRoles(client, server, criteria, order=='descending')
						.then(() => menu.name + ': Roles sorted by ' + criteria + '.');
					} else {
						throw 'Invalid menu name: ' + menuName;
					}
				}
			}
		}
	}
};

