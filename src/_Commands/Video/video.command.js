module.exports = {
	'video': {
		aliases: ['vid'],
		info: 'Turn your voice channel into a video channel!',
		parameters: ['[be in a voice channel]'],
		permissions: 'inclusive',
		analytics: false,
		fn({client, server, user, member, args}) {
			if (!member.voice_channel_id) {
				throw 'You need to be in a voice channel!';
			}
			return `Click this to enable video in your current voice channel: <https://discordapp.com/channels/${server.id}/${member.voice_channel_id}>`;
		}
	}
};
