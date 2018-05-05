const Resource = require('../Resource');
const DiscordUtils = require('../DiscordUtils');
const {Markdown:md} = require('../Utils');

/**
	Resolves the roles to their respective Role objects
	@arg {Array} roleArgs - the IDs, role mentions, or names of the roles to resolve
*/
function resolveRoles(roleArgs, server) {
	var validRoles = [];
	var invalidRoles = [];
	for (var id of roleArgs) {
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
		return roleList.map(({role,reason}) => md.bold(role) + (reason?` (Error: ${reason})`:'')).join('\n');
	} else {
		return '(None)';
	}
}

class Role extends Resource {
	constructor(r = {}) {
		super({
			assign: false
		}, r);
	}
}

module.exports = {
	'roles': {
		aliases: ['role'],
		category: 'Misc',
		title: 'Role',
		info: 'Manage roles on the server, and allow users to assign themselves roles or remove roles.',
		subcommands: {
			'add': {
				aliases: ['give','iama','iam'],
				title: 'Roles | Add',
				info: 'Assigns roles to you.',
				parameters: ['...roles'],
				fn({client, server, serverID, userID, args}) {
					var roleTable = client.database.get('roles');
					var member = server.members[userID];
					var roles = resolveRoles(args, server);
					var rolesGiven = [];
					
					function rec(role,reason) {
						rolesGiven.push({role,reason});
					}
					function giveRole() {
						var role = roles.pop();
						if (!role) {
							return finish();
						}
						var roleID = role.id;
						if (member.roles.includes(role.id)) {
							rec(role.name,'You already have this role.');
							return giveRole();
						}
						var r = new Role(roleTable.get(roleID));
						if (!r.assign) {
							rec(role.name,`Role is not self-assignable.`);
							return giveRole();
						}
						return client.addToRole({serverID,userID,roleID})
						.then(() => {
							rec(role.name);
						}, (e) => {
							rec(role.name,e);
						})
						.then(giveRole);
					}
					function finish() {
						return md.mention(userID) + ' You have been given the following roles:\n' + listRoles(rolesGiven);
					}
					
					return giveRole();
				}
			},
			'remove': {
				aliases: ['take','iamnota','iamnot'],
				title: 'Roles | Remove',
				info: 'Removes roles from you.',
				parameters: ['...roles'],
				fn({client, server, serverID, userID, args}) {
					var roleTable = client.database.get('roles');
					var member = server.members[userID];
					var roles = resolveRoles(args, server);
					var rolesTaken = [];
					
					function rec(role,reason) {
						rolesTaken.push({role,reason});
					}
					function takeRole() {
						var role = roles.pop();
						if (!role) {
							return finish();
						}
						var roleID = role.id;
						if (!member.roles.includes(role.id)) {
							rec(role.name,'You do not have this role.');
							return takeRole();
						}
						var r = new Role(roleTable.get(roleID));
						if (!r.assign) {
							rec(role.name,`Role is not self-assignable.`);
							return takeRole();
						}
						return client.removeFromRole({serverID,userID,roleID})
						.then(() => {
							rec(role.name);
						}, (e) => {
							rec(role.name, e);
						})
						.then(takeRole);
					}
					function finish() {
						return md.mention(userID) + ' You have been removed from the following roles:\n' + listRoles(rolesTaken);
					}
					
					return takeRole();
				}
			},
			'Create': {
				aliases: ['make','new'],
				category: 'Admin',
				title: 'Roles | Create',
				info: 'Create new self-assignable role(s), with no special permissions. You can assign a color to a role by appending it with `:color`, e.g. `artist:#FFFF00` (for yellow).',
				parameters: ['...roles'],
				permissions: {},
				fn({client, server, serverID, args}) {
					var roleTable = client.database.get('roles');
					var roles = args.slice();
					var rolesCreated = [];
					
					function rec(name,reason) {
						rolesCreated.push({role,reason});
					}
					function makeRole() {
						var role = roles.pop();
						if (!role) {
							return finish();
						}
						var [name,color] = role.split(':');
						if (findRole(server,name)) {
							rec(name, 'Already exists.');
							return makeRole();
						}
						return client.createRole(serverID)
						.then(roleObj => {
							// add the role to the role table
							roleTable.modify(roleObj.id, r => {
								return new Role({assign:true});
							});
							
							// update the role on the server
							return client.editRole({
								roleID: roleObj.id,
								serverID,
								name,
								color,
								hoist: false,
								//permissions: {},
								mentionable: true
							});
						})
						.then(() => {
							rec(name);
						}, e => {
							rec(name, e);
						})
						.then(makeRole);
					}
					function finish() {
						roleTable.save();
						return 'The following roles have been created:\n' + listRoles(rolesCreated);
					}
					
					return makeRole();
				}
			},
			'rename': {
				aliases: ['name'],
				category: 'Admin',
				title: 'Roles | Rename',
				info: 'Renames an existing role.',
				parameters: ['oldname','newname'],
				permissions: {},
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
				info: 'Replaces color of an existing role.',
				parameters: ['role','color'],
				permissions: {},
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
				info: 'Makes role(s) self-assignable.',
				parameters: ['...roles'],
				permissions: {},
				fn({client,server,args}) {
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
				info: 'Makes role(s) un-self-assignable.',
				parameters: ['...roles'],
				permissions: {},
				fn({client,server,args}) {
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
			'List': {
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
			}
		}
	}
};

