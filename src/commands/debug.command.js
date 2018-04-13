/**
	Command file for debugging tools.
*/

const {Markdown:md,decircularize} = require('../Utils');
const fs = require('fs');

function snapshot(data) {
	var time = new Date().toLocaleString().replace(/[:\\\/]/g,'-').replace(/\s+/g,'_');
	var filename = `discord-dragon-bot/debug/snapshot_${time}.json`;
	// pretty-print the stringified object to the file
	fs.writeFile(filename, JSON.stringify(data, null, 4), err => {
		if (err) {
			console.error(err);
		} else {
			console.log('Snapshot saved to ' + filename);
		}
	});
}

const CHANNEL_TYPE = [
	'Text',
	'DM',
	'Voice',
	'Group DM',
	'Category'
];

module.exports = {
	'console': {
		category: 'Debug',
		title: 'Console',
		info: 'Interface for printing information to the console window.',
		permissions: {
			type: 'private'
		},
		suppress: true,
		subcommands: {
			'log': {
				title: 'Console | Log',
				info: 'General logging of information.',
				parameters: ['...data'],
				permissions: {
					type: 'private'
				},
				fn({client,args}) {
					client.log(...args);
				}
			},
			'info': {
				title: 'Console | Info',
				info: 'Information-level logging of information.',
				parameter: ['...data'],
				permissions: {
					type: 'private'
				},
				fn({client,args}) {
					client.info(...args);
				}
			},
			'warn': {
				title: 'Console | Warn',
				info: 'Warning-level logging of information.',
				parameters: ['...data'],
				permissions: {
					type: 'private'
				},
				fn({client,args}) {
					client.warn(...args);
				}
			},
			'error': {
				title: 'Console | Error',
				info: 'Error-level logging of information.',
				parameters: ['...data'],
				permissions: {
					type: 'private'
				},
				fn({client,args}) {
					client.error(...args);
				}
			},
			'clear': {
				title: 'Console | Clear',
				info: 'Clears the console.',
				permissions: {
					type: 'private'
				},
				fn({client}) {
					console.clear();
				}
			}
		}
	},
	'echo': {
		aliases: ['print','test','display'],
		category: 'Debug',
		info: 'Display the arguments. Useful for expressions.',
		parameters: ['...arguments'],
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client, args}) {
			return md.codeblock(arg.map(String).join(' '));
		}
	},
	'memdump': {
		aliases: ['snapshot'],
		category: 'Debug',
		title: 'Memory Snapshot',
		info: 'Takes a snapshot of the internal client data',
		permissions: {
			type: 'private'
		},
		suppress: true,
		fn({client}) {
			snapshot(decircularize(client));
			return 'Snapshot of memory saved.';
		}
	},
	'debug': {
		category: 'Admin',
		title: 'Debug',
		info: 'Debugging tools for Discord resources.',
		subcommands: {
			'channel': {
				title: 'Debug | Channel',
				info: 'Displays information about a channel.',
				parameters: ['[channel]'],
				fn({client, args, channelID}) {
					let id = md.channelID(args[0]) || channelID;
					let channel = client.channels[id];
					
					if (!channel) {
						throw 'Invalid channel ID.';
					}
					
					let sid = channel.guild_id;
					
					return {
						fields: [
							{
								name: 'Name',
								value: channel.name,
								inline: true
							},
							{
								name: 'ID',
								value: channel.id,
								inline: true
							},
							{
								name: 'Type',
								value: 	CHANNEL_TYPE[channel.type],
								inline: true
							},
							{
								name: 'Topic',
								value: channel.topic,
								inline: true
							},
							{
								name: 'Position',
								value: channel.position,
								inline: true
							},
							{
								name: 'In Server',
								value: `${client.servers[sid].name} (ID: ${sid})`,
								inline: true
							},
							{
								name: 'NSFW?',
								value: channel.nsfw ? 'Yes' : 'No',
								inline: true
							}
						]
					};
				}
			},
			'server': {
				aliases: ['guild'],
				title: 'Debug | Server',
				info: 'Displays information about a server.',
				parameters: ['[serverID]'],
				fn({client, args, serverID}) {
					let id = args[0] || serverID;
					let server = client.servers[id];
					
					if (!server) {
						throw 'Invalid server ID.';
					}
					
					let members  = Object.keys(server.members);
					let channels = Object.keys(server.channels);
					let roles    = Object.keys(server.roles);
					let emojis   = Object.keys(server.emojis);
					let icon = `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
					
					return {
						fields: [
							{
								name: 'Name',
								value: server.name,
								inline: true
							},
							{
								name: 'ID',
								value: server.id,
								inline: true
							},
							{
								name: 'Region',
								value: server.region,
								inline: true
							},
							{
								name: 'Owner',
								value: md.mention(server.owner_id),
								inline: true
							},
							{
								name: 'Large?',
								value: server.large ? 'Yes' : 'No',
								inline: true
							},
							{
								name: 'Verification Level',
								value: server.verification_level,
								inline: true
							},
							{
								name: 'Members',
								value: members.length,
								inline: true
							},
							{
								name: 'Bots',
								value: members.filter(m => client.users[m].bot).length,
								inline: true
							},
							{
								name: 'Channels',
								value: channels.length,
								inline: true
							},
							{
								name: 'Roles',
								value: roles.length,
								inline: true
							}
						],
						thumbnail: {
							url: icon,
							width: 60,
							height: 60
						}
					};
				}
			},
			'user': {
				aliases: ['member'],
				title: 'Debug | Member',
				info: 'Displays information about a user.',
				parameters: ['userID'],
				fn({client, args, userID, server}) {
					let id = md.userID(args[0]);
					let member = server.members[id];
					if (!member) {
						throw 'Invalid member ID.';
					}
					let user = client.users[id];
					if (!user) {
						throw 'Invalid user ID.';
					}
					
					let dateJoined = new Date(member.joined_at).toLocaleString();
					console.log(member, dateJoined);
					
					return {
						fields: [
							{
								name: 'Name',
								value: (user.name || user.username) + (member.nick ? ` (AKA ${member.nick})`: ''),
								inline: true
							},
							{
								name: 'ID',
								value: user.id,
								inline: true
							},
							{
								name: 'Discriminator',
								value: user.discriminator,
								inline: true
							},
							{
								name: 'Status',
								value: member.status || 'Offline?',
								inline: true
							},
							{
								name: 'Is Bot?',
								value: String(member.bot),
								inline: true
							},
							{
								name: 'Joined',
								value: dateJoined,
								inline: true
							},
							{
								name: 'Roles in this Server',
								value: member.roles.map(r => `${server.roles[r].name} (ID: ${r})`).join(', ') || 'No Roles',
								inline: true
							}
						]
					};
				}
			},
			'role': {
				aliases: [],
				title: 'Debug | Role',
				info: 'Displays information about a role.',
				parameters: ['roleID'],
				fn({client, args, server}) {
					let id = md.roleID(args[0]);
					let role = server.roles[id];
					if (!role) {
						throw 'Invalid role ID.';
					}
					
					let members = server.members;
					let membersWithRole = Object.keys(members).filter(m => members[m].roles.indexOf(role.name) > -1);
					
					return {
						fields: [
							{
								name: 'Name',
								value: role.name,
								inline: true
							},
							{
								name: 'ID',
								value: role.id,
								inline: true
							},
							{
								name: 'In Server',
								value: `${server.name} (ID: ${server.id})`,
								inline: true
							},
							{
								name: 'Users with Role',
								value: membersWithRole.map(m => `${client.users[m].username} (ID: ${m})`).join(', ') || 'None',
								inline: true
							}
						]
					};
				}
			}
		}
	}
};

