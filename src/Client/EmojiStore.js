/**
 * EmojiStore class.
 * A self-sufficient custom emoji bank. Primarily for creating private servers to host emojis.
 * Once a server reaches the emoji capacity limit, a new server is created for additional hosting.
 */
class EmojiStore {
	constructor(client) {
		this.client = client;
	}
	getServerName(id = 1) {
		return this.client.username+'_EmojiStore_'+id;
	}
	getServer(i = 1) {
		let name = this.getServerName(i);
		for (let ID in this.client.servers) {
			let server = this.client.servers[ID];
			if (server.name == name) {
				return server;
			}
		}
	}
	async get(emojiName, server) {
		if (!server) {
			for (let sID in this.client.servers) {
				let emoji = await this.get(emojiName, this.client.servers[sID]);
				if (emoji) return emoji;
			}
		}
		for (let eID in server.emojis) {
			let emoji = server.emojis[eID];
			if (emoji.name == emojiName || emoji.id == emojiName) {
				return emoji;
			}
		}
	}
	async set(emojiName,bufferData) {
		for (let i = 1; i < 11;i++) {
			let server = this.getServer(i) || (await this.client.createServer({
				name: this.getServerName(i),
				region: 'us-central'
			}));
			let testEmoji = await this.get(emojiName, server);
			if (testEmoji) {
				// since there is no way to overwrite an emoji image, delete it from the server first
				await this.client.deleteServerEmoji({
					serverID: server.id,
					emojiID: testEmoji.id
				});
			}
			if (Object.keys(server.emojis).length < 50) {
				if (typeof(bufferData) !== 'string') {
					// assume Buffer
					bufferData = bufferData.toString('base64');
				}
				if (!bufferData.startsWith('data:')) {
					// assume PNG format
					bufferData = 'data:image/png;base64,' + bufferData;
				}
				return this.client.addServerEmoji({
					name: emojiName,
					image: bufferData
				});
			}
		}
	}
}

module.exports = EmojiStore;
