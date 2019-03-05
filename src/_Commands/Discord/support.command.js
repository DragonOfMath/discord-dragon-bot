const FilePromise = require('../../Structures/FilePromise');
const {DiscordUtils} = require('../../Utils');

function makePermissionsObj(allow,deny) {
	let permissions = {};
	if (allow) {
		permissions = DiscordUtils.getPermissionNames(allow).reduce((p,flag) => {
			p[flag] = true;
			return p;
		}, permissions);
	}
	if (deny) {
		permissions = DiscordUtils.getPermissionNames(deny).reduce((p,flag) => {
			p[flag] = false;
			return p;
		}, permissions);
	}
	//console.log(allow, deny, permissions);
	return permissions;
}

async function setupSupportServer(client, serverName) {
	let init = {
		roles: [
			{
				name: 'Admin',
				color: '#ff0000',
				hoist: true,
				mentionable: false,
				permissions: makePermissionsObj([3])
			},
			{
				name: 'Mod',
				color: '#0000ff',
				hoist: true,
				mentionable: false,
				permissions: makePermissionsObj([0,1,2,4,6,7,13,16])
			}
		],
		categories: ['Information','Chat','Testing'],
		channels: [
			{
				name: 'info',
				type: 'text',
				topic: 'Server rules and information. By joining this server, you agree to the rules.',
				parentID: 0
			},
			{
				name: 'modlog',
				type: 'text',
				topic: 'Moderation log channel.',
				parentID: 0
			},
			{
				name: 'general',
				type: 'text',
				topic: 'Main chat channel.',
				parentID: 1
			},
			{
				name: 'help',
				type: 'text',
				topic: 'Need help with a command, or how you can setup various things? Ask in here!',
				parentID: 1
			},
			{
				name: 'ideas',
				type: 'text',
				topic: 'Have an idea to improve the server or bot? Say it in here!',
				parentID: 1
			},
			{
				name: 'main-testing',
				type: 'text',
				topic: 'Main bot testing channel.',
				parentID: 2
			},
			{
				name: 'nsfw-testing',
				type: 'text',
				topic: 'Bot testing channel for NSFW commands.',
				parentID: 2,
				nsfw: true
			},
			{
				name: 'mod-testing',
				type: 'text',
				topic: 'Testing channel for mods and admins only.',
				parentID: 2,
				nsfw: true
			},
			{
				name: 'admin-testing',
				type: 'text',
				topic: 'Testing channel for admins only.',
				parentID: 2,
				nsfw: true
			},
			{
				name: 'Voice Testing',
				type: 'voice',
				parentID: 2
			}
		]
	};
	
	// create the server
	client.info('Initializing server...');
	let server = DiscordUtils.getServerByName(client.servers, serverName);
	if (!server) {
		// use the client's avatar for the server icon
		let avatar = DiscordUtils.getAvatarURL(client);
		let serverIcon = await FilePromise.read(avatar, 'binary');
		server = await client.createServer({
			name: serverName,
			region: 'us-central',
			icon: serverIcon
		});
	}
	
	// create the roles
	client.info('Creating roles...');
	client.indent();
	for (let r = 0, role; r < init.roles.length; r++) {
		role = DiscordUtils.getRoleByName(server, init.roles[r].name);
		if (!role) {
			role = init.roles[r];
			role.serverID = server.id;
			role = await client.createRole(role);
		} else {
			// ensuring the role permissions are synced
			role = await client.editRole({
				roleID: role.id,
				serverID: server.id,
				permissions: init.roles[r].permissions
			});
		}
		client.info(role.name, role.color);
		init.roles[r] = role;
	}
	client.unindent();
	
	// assign the admin and mod roles to the client
	client.info('Assigning roles to self...');
	let adminRole = DiscordUtils.getRoleByName(server, 'Admin');
	let modRole = DiscordUtils.getRoleByName(server, 'Mod');
	if (!server.members[client.id].roles.includes(adminRole.id)) {
		await client.addToRole({
			userID: client.id,
			serverID: server.id,
			roleID: adminRole.id
		});
	}
	if (!server.members[client.id].roles.includes(modRole.id)) {
		await client.addToRole({
			userID: client.id,
			serverID: server.id,
			roleID: modRole.id
		});
	}
	
	// create channel categories
	client.info('Creating categories...');
	client.indent();
	for (let c = 0, category; c < init.categories.length; c++) {
		category = DiscordUtils.getServerCategoryChannels(server).find(channel => channel.name == init.categories[c]);
		if (!category) {
			category = await client.createChannel({
				serverID: server.id,
				name: init.categories[c],
				type: 'category'
			});
		}
		client.info(category.name);
		init.categories[c] = category;
	}
	client.unindent();
	
	let infoCategory = init.categories[0];
	let chatCategory = init.categories[1];
	let testCategory = init.categories[2];
	
	// move the default channels to the Chat category
	client.info(`Moving default channels to ${init.categories[1].name} category...`);
	let defaultChannel = init.channels.find(channel => channel.name == 'general');
	if (defaultChannel && defaultChannel.parent_id != chatCategory.id) {
		await client.editChannelInfo({
			channelID: defaultChannel.id,
			parentID: chatCategory.id
		});
	}
	let defaultVC = DiscordUtils.getServerVoiceChannels(server).find(channel => channel.name == 'General');
	if (defaultVC && defaultVC.parent_id != chatCategory.id) {
		await client.editChannelInfo({
			channelID: defaultVC.id,
			parentID: chatCategory.id
		});
	}
	
	// create channels for these categories
	client.info('Creating new channels...');
	client.indent();
	for (let c = 0, channel, category; c < init.channels.length; c++) {
		channel = DiscordUtils.getServerChannels(server).find(channel => channel.name == init.channels[c].name);
		if (!channel) {
			channel = init.channels[c];
			channel.serverID = server.id;
			category = init.categories[channel.parentID];
			channel.parentID = category.id;
			let newChannel = await client.createChannel(channel);
			if (channel.topic || channel.nsfw) {
				await client.editChannelInfo({
					channelID: newChannel.id,
					topic: channel.topic,
					nsfw: channel.nsfw
				});
			}
			channel = newChannel;
		} else {
			category = server.channels[channel.parent_id];
		}
		client.info(`${channel.name} (${channel.type}) -> ${category ? category.name : 'No category'}`);
		init.channels[c] = channel;
	}
	client.unindent();
	
	// elevate the permission requirements for the Info category
	client.info('Configuring channel permissions...');
	await client.editChannelPermissions({
		channelID: infoCategory.id,
		roleID: server.id, // @everyone
		deny: [11] // SEND_MESSAGES
	});
	let modChannel = init.channels.find(channel => channel.name == 'mod-testing');
	await client.editChannelPermissions({
		channelID: modChannel.id,
		roleID: server.id, // @everyone
		deny: [10,11] // SEND_MESSAGE, READ_MESSAGES
	});
	await client.editChannelPermissions({
		channelID: modChannel.id,
		roleID: modRole.id,
		allow: [10,11] // SEND_MESSAGE, READ_MESSAGES
	});
	await client.editChannelPermissions({
		channelID: modChannel.id,
		roleID: adminRole.id,
		allow: [10,11] // SEND_MESSAGE, READ_MESSAGES
	});
	
	// allow only admins to use the admin-testing channel
	let adminChannel = init.channels.find(channel => channel.name == 'admin-testing');
	await client.editChannelPermissions({
		channelID: adminChannel.id,
		roleID: server.id, // @everyone
		deny: [10,11] // SEND_MESSAGE, READ_MESSAGES
	});
	await client.editChannelPermissions({
		channelID: adminChannel.id,
		roleID: adminRole.id, // @Admin
		allow: [10,11] // SEND_MESSAGE, READ_MESSAGES 
	});
	
	// assign the modlog channel to the server's modlog
	client.info('Setting up modlog...');
	let modlogChannel = init.channels.find(channel => channel.name == 'modlog');
	await client.commands.get('mod.log.id')[0].runRaw({client,server,channel:modlogChannel,args:[]});
	
	// make sure all non-essential commands are only usable in the appropriate channel
	client.info('Configuring command permissions...');
	let botChannel = init.channels.find(channel => channel.name == 'testing');
	let nsfwChannel = init.channels.find(channel => channel.name == 'nsfw-testing');
	
	let allowCommand = client.commands.get('commands.allow')[0];
	let denyCommand = client.commands.get('commands.deny')[0];
	
	await allowCommand.runRaw({client,server,channel:botChannel,args:['*']}); // initially allow all commands in the main bot channel
	await denyCommand.runRaw({client,server,channel:botChannel,args:['&nsfw']}); // deny nsfw commands in the main bot channel
	await allowCommand.runRaw({client,server,channel:nsfwChannel,args:['&nsfw']}); // allow only nsfw commands in the nsfw bot channel
	await allowCommand.runRaw({client,server,channel:modChannel,args:['*']}); // initially allow all commands in the mod testing channel
	await denyCommand.runRaw({client,server,channel:modChannel,args:['&admin']}); // deny admin commands in the mod channel
	await allowCommand.runRaw({client,server,channel:adminChannel,args:['*']}); // allow all commands in the admin testing channel
	
	// create a temporary invite for the server
	client.info('Creating invite...');
	let invite = await client.getServerInvites(server.id);
	if (!invite) {
		invite = await client.createInvite({
			channelID: defaultChannel.id,
			max_age: 1,
			max_uses: 1,
			temporary: false,
			unique: false
		});
	}
	
	// wait for me to join so it may assign admin to me
	client.info('Awaiting for owner to use invite...');
	var checkOwnerMembership = setInterval(async () => {
		if (client.ownerID in server.members) {
			clearInterval(checkOwnerMembership);
			client.info('Assigning admin role to my owner...');
			if (!server.members[client.ownerID].roles.includes(adminRole.id)) {
				await client.addToRole({
					userID: client.ownerID,
					serverID: server.id,
					roleID: adminRole.id
				});
			}
			client.notice('Server setup complete!');
		}
	}, 1000);
	
	return server;
}

async function inviteToSupportServer(client, server) {
	client._allowInviteLinks = true;
	let invites = await client.getServerInvites(server.id)
	if (invites.length) {
		return 'Here is my support server: ' + DiscordUtils.getInviteLink(invites[0]);
	} else {
		return 'Sorry, I don\'t have any invite links ready yet.';
	}
}

module.exports = {
	'support': {
		category: 'Discord',
		info: 'Get an invite to the bot\'s support server. Add `dm me` if you want the link to be sent to you in private.',
		permissions: 'public',
		fn({client,server,arg,userID}) {
			if (server.owner_id == client.id) {
				return 'Silly! We\'re already in my support server!';
			}
			
			/*
			let serverName = client.username + ' Support Server';
			if (userID == client.ownerID) {
				// verify the server is complete
				return setupSupportServer(client, serverName)
				.then(server => inviteToSupportServer(client, server));
			}
			*/
			
			server = client.servers[client.supportID];
			if (!server) {
				return 'Sorry, my support server isn\'t setup yet.';
			}
			
			return inviteToSupportServer(client, server)
			.then(msg => {
				if (arg && arg.includes('dm me')) {
					client.send(userID, msg);
				} else {
					return msg;
				}
			});
		}
	}
};
