const Resource = require('../Resource');
const {Markdown:md,strcmp} = require('../Utils');

function resolveRoles(roles, server) {
	roles = roles.map(a => {
		var id = md.roleID(a) || findRoleID(server, a) || a;
		var name = server.roles[id] && server.roles[id].name;
		return {id,name};
	});
	var invalid = roles.filter(r => !r.name);
	if (invalid.length > 0) {
		throw 'Invalid Roles: ' + invalid.map(ir => ir.id).join(', ');
	}
	return roles;
}
function findRoleID(server, roleName) {
	return Object.keys(server.roles).find(rid => strcmp(server.roles[rid].name, roleName));
}
function showWarnings(warnings) {
	if (warnings.length) {
		return '\nWarnings:\n' + md.codeblock(warnings.map(w => `${w.role.name}: ${w.reason}`).join('\n'));
	} else {
		return '';
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
					var warnings = [];
					
					function ignore(role,reason) {
						warnings.push({role,reason});
					}
					function giveRole() {
						var role = roles.pop();
						if (!role) {
							return finish();
						}
						var roleID = role.id;
						if (member.roles.includes(role.id)) {
							ignore(role, 'You already have this role.');
							return giveRole();
						}
						var r = new Role(roleTable.get(roleID));
						if (!r.assign) {
							ignore(role,`Role is not self-assignable.`);
							return giveRole();
						}
						return client.addToRole({serverID,userID,roleID})
						.then(() => {
							rolesGiven.push(role);
						}, (e) => {
							ignore(role, e);
						})
						.then(giveRole);
					}
					function finish() {
						return md.mention(userID) + ' You have been given the following roles:\n' + rolesGiven.map(r => md.bold(r.name)).join('\n') + showWarnings(warnings);
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
					var warnings = [];
					
					function ignore(role,reason) {
						warnings.push({role,reason});
					}
					function takeRole() {
						var role = roles.pop();
						if (!role) {
							return finish();
						}
						var roleID = role.id;
						if (!member.roles.includes(role.id)) {
							ignore(role,'You do not have this role.');
							return takeRole();
						}
						var r = new Role(roleTable.get(roleID));
						if (!r.assign) {
							ignore(role,`Role is not self-assignable.`);
							return takeRole();
						}
						return client.removeFromRole({serverID,userID,roleID})
						.then(() => {
							rolesTaken.push(role);
						}, (e) => {
							ignore(role, e);
						})
						.then(takeRole);
					}
					function finish() {
						return md.mention(userID) + ' You have been removed from the following roles:\n' + rolesTaken.map(r => md.bold(r.name)).join('\n') + showWarnings(warnings);
					}
					
					return takeRole();
				}
			},
			'Create': {
				aliases: ['make','new'],
				title: 'Roles | Create',
				info: 'Create new self-assignable role(s), with no special permissions. You can assign a color to a role by appending it with `:color`, e.g. `artist:#FFFF00` (for yellow).',
				parameters: ['...roles'],
				permissions: {},
				fn({client, server, serverID, args}) {
					var roleTable = client.database.get('roles');
					var roles = args.slice();
					var rolesCreated = [];
					var warnings = [];
					
					function ignore(name,reason) {
						warnings.push({role:{name},reason});
					}
					function makeRole() {
						var role = roles.pop();
						if (!role) {
							return finish();
						}
						var [name,color] = role.split(':');
						if (findRoleID(server,name)) {
							ignore(name, 'Already exists.');
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
							rolesCreated.push(name);
						}, e => {
							ignore(name, e);
						})
						.then(makeRole);
					}
					function finish() {
						roleTable.save();
						return 'The following roles have been created:\n' + rolesCreated.map(md.bold).join('\n') + showWarnings(warnings);
					}
					
					return makeRole();
				}
			},
			'rename': {
				aliases: ['name'],
				title: 'Roles | Rename',
				info: 'Renames an existing role.',
				parameters: ['oldname','newname'],
				permissions: {},
				fn({client, server, serverID, args}) {
					var roleID = findRoleID(server, args[0]);
					if (!roleID) {
						throw 'Invalid role ID.';
					}
					var oldName = server.roles[roleID].name;
					var newName = args[1];
					return client.editRole({
						roleID,
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
				title: 'Roles | Recolor',
				info: 'Replaces color of an existing role.',
				parameters: ['role','color'],
				permissions: {},
				fn({client, server, serverID, args}) {
					var roleID = findRoleID(server, args[0]);
					if (!roleID) {
						throw 'Invalid role ID.';
					}
					var roleName = server.roles[roleID].name;
					var oldColor = server.roles[roleID].color;
					var newColor = args[1];
					return client.editRole({
						roleID,
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
						return !!server.roles[id] && r.assign;
					});
					if (roles.length) {
						return 'The following roles are assignable:\n' + roles.map(id => md.bold(server.roles[id].name)).join('\n');
					} else {
						return 'There are no assignable roles on this server.';
					}
				}
			}
		}
	}
};

