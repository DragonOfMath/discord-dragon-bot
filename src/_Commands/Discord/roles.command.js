const Discord = require('discord.io');
const Resource = require('../../Structures/Resource');
const {Markdown:md,DiscordUtils,parseCSV} = require('../../Utils');

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
		fn({client, server, serverID, userID, args}) {
			var roleTable = client.database.get('roles');
			var member = server.members[userID];
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
						
						await client.addToRole({serverID,userID,roleID});
						rec(role.name);
					} catch (e) {
						console.error(e);
						rec(role.name,e);
					}
				}
				return md.mention(userID) + ' You have been given the following roles:\n' + listRoles(rolesGiven);
			}
			return giveRoles();
		},
		subcommands: {
			'remove': {
				aliases: ['take','iamnota','iamnot'],
				title: 'Roles | Remove',
				info: 'Removes roles from you. Use commas to separate role names.',
				parameters: ['...roles'],
				fn({client, server, serverID, userID, args}) {
					var roleTable = client.database.get('roles');
					var member = server.members[userID];
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
								
								await client.removeFromRole({serverID,userID,roleID});
								rec(role.name);
							} catch (e) {
								rec(role.name, e);
							}
						}
						return md.mention(userID) + ' You have been removed from the following roles:\n' + listRoles(rolesTaken);
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
						return 'The following roles are self-assignable:\n' + roles.map(id => md.bold(server.roles[id].name)).join('\n');
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
				fn({client, server, serverID, args}) {
					var roleTable = client.database.get('roles');
					var roles = args.slice();
					var rolesCreated = [];
					
					function rec(role,error) {
						rolesCreated.push({role,error});
					}
					async function makeRoles() {
						for (var role of roles) {
							var [name,color] = role.split(':');
							try {
								if (findRole(server,name)) {
									throw 'Role already exists';
								}
								role = await client.createRole({
									serverID,
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
					}
					
					return makeRoles();
				}
			},
			'rename': {
				aliases: ['name'],
				category: 'Admin',
				title: 'Roles | Rename',
				info: 'Renames an existing role. Use quote marks for multi-word role names.',
				parameters: ['oldname','newname'],
				permissions: 'privileged',
				fn({client, server, serverID, args}) {
					var role = findRole(server, args[0]);
					if (!role) {
						throw 'Invalid role ID.';
					}
					var oldName = role.name;
					var newName = args[1];
					return client.editRole({
						roleID: role.id,
						serverID,
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
				fn({client, server, serverID, args}) {
					var role = findRole(server, args[0]);
					if (!role) {
						throw 'Invalid role ID.';
					}
					var roleName = role.name;
					var oldColor = role.color;
					var newColor = args[1];
					return client.editRole({
						roleID: role.id,
						serverID,
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
	}
};

