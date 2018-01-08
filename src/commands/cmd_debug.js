/**
	cmd_debug.js
	Command file for debugging tools.
*/

const {Markdown:md} = require('../Utils');
const fs = require('fs');

function snapshot(data) {
	let time = new Date().toLocaleString().replace(/[:\\\/]/g,'-').replace(/\s+/g,'_');
	let filename = `debug/snapshot_${time}.json`;
	fs.writeFile(filename, JSON.stringify(data), err => {
		if (err) {
			console.error(err);
		} else {
			console.log('Snapshot saved to ' + filename);
		}
	});
}

module.exports = {
	'echo': {
		aliases: ['test'],
		category: 'Admin',
		info: 'Repeat back the raw arguments. For debugging purposes.',
		parameters: ['...arguments'],
		permissions: {
			type: 'private'
		},
		fn({client, arg}) {
			return md.codeblock(arg);
		}
	},
	'memdump': {
		aliases: ['snapshot'],
		category: 'Admin',
		title: 'Memory Snapshot',
		info: 'Takes a snapshot of the internal client data',
		permissions: {
			type: 'private'
		},
		fn({client}) {
			keys = Object.keys(client).filter(c => c != 'commands'); // eliminate circular structure: command -> subcommands -> supercommand -> command
			let obj = {};
			for (let k of keys) {
				obj[k] = client[k];
			}
			snapshot(obj);
			return 'Snapshot of memory saved.';
		}
	},
	'debug': {
		category: 'Admin',
		title: 'Debug',
		info: 'Debugging tools for Discord resources.',
		permissions: {
			type: 'private'
		},
		subcommands: {
			'channel': {
				title: 'Debug | Channel',
				info: 'Displays information about a channel.',
				parameters: ['[channel]'],
				permissions: {
					type: 'private'
				},
				fn({client, args, channelID}) {
					let id = md.id(args[0]) || channelID;
					let channel = client.channels[id];
					
					if (!channel) {
						throw 'Invalid channel ID.';
					}
					
					let sid = channel.guild_id;
					
					return {
						fields: [
							{
								name: 'Name',
								value: channel.name
							},
							{
								name: 'ID',
								value: channel.id
							},
							{
								name: 'Type',
								value: 	`${channel.type} (${channel.type == 0 ? 'Text' : 'Voice'})`
							},
							{
								name: 'Topic',
								value: channel.topic
							},
							{
								name: 'Position',
								value: channel.position
							},
							{
								name: 'In Server',
								value: `${client.servers[sid].name} (ID: ${sid})`
							},
							{
								name: 'NSFW?',
								value: '(Cannot determine yet)'
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
				permissions: {
					type: 'private'
				},
				fn({client, args, serverID}) {
					let id = md.id(args[0]) || serverID;
					let server = client.servers[id];
					
					if (!server) {
						throw 'Invalid server ID.';
					}
					
					let members  = Object.keys(server.members);
					let channels = Object.keys(server.channels);
					let roles    = Object.keys(server.roles);
					let emojis   = Object.keys(server.emojis);
					
					return {
						fields: [
							{
								name: 'Name',
								value: server.name
							},
							{
								name: 'ID',
								value: server.id
							},
							{
								name: 'Region',
								value: server.region
							},
							{
								name: 'Owner',
								value: md.mention(server.owner_id)
							},
							{
								name: 'Large?',
								value: server.large ? 'Yes' : 'No'
							},
							{
								name: 'Verification Level',
								value: server.verification_level
							},
							{
								name: 'Icon URL',
								value: server.icon
							},
							{
								name: 'Members',
								value: members.length
							},
							{
								name: 'Bots',
								value: members.filter(m => client.users[m].bot).length
							},
							{
								name: 'Channels',
								value: channels.length
							},
							{
								name: 'Roles',
								value: roles.length
							}
						],
						thumbnail: {
							url: server.icon,
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
				parameters: ['[userID]'],
				permissions: {
					type: 'private'
				},
				fn({client, args, userID, server}) {
					let id = md.id(args[0]) || userID;
					let member = server.members[id];
					if (!member) {
						throw 'Invalid member ID.';
					}
					let user = client.users[id];
					let servers = [];
					
					for (let s in client.servers) {
						if (client.servers[s].members[member.id]) {
							servers.push(s);
						}
					}
					
					return {
						fields: [
							{
								name: 'Name',
								value: (user.name || user.username) + (member.nick ? ` (AKA ${member.nick})`: '')
							},
							{
								name: 'ID',
								value: user.id
							},
							{
								name: 'Discriminator',
								value: user.discriminator
							},
							{
								name: 'Status',
								value: member.status
							},
							{
								name: 'Is Bot?',
								value: String(member.bot)
							},
							{
								name: 'In Known Server(s)',
								value: servers.map(s => `${client.servers[s].name} (ID: ${s})`).join(', ')
							},
							{
								name: 'Roles in this Server',
								value: member.roles.map(r => `${server.roles[r].name} (ID: ${r})`).join(', ')
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
				permissions: {
					type: 'private'
				},
				fn({client, args, server}) {
					let id = md.id(args[0]);
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
								value: role.name
							},
							{
								name: 'ID',
								value: role.id
							},
							{
								name: 'In Server',
								value: `${server.name} (ID: ${server.id})`
							},
							{
								name: 'Users with Role',
								value: membersWithRole.map(m => `${client.users[m].username} (ID: ${m})`).join(', ')
							}
						]
					};
				}
			}
		}
	}
};

