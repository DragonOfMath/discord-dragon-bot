const Client      = require('./DebugClient');
const AudioPlayer = require('./AudioPlayer');

class DJClient extends Client {
	constructor() {
		super(...arguments);
		this._players = {};
	}
	get voiceChannels() {
		return this._vChannels;
	}
	getStream(serverID, VChannelID) {
		return this._players[serverID];
	}
	isStreaming(serverID, VChannelID) {
		let stream = this.getStream(serverID);
		if (stream) {
			if (!VChannelID || stream.vc.id == VChannelID) {
				return true;
			} else {
				throw new Error('Currently streaming in ' + stream.vc.name);
			}
		} else {
			return false;
		}
	}
	startStream(serverID, VChannelID) {
		let channel = this.servers[serverID].channels[VChannelID];
		if (serverID in this._players) {
			let stream = this._players[serverID];
			if (stream.vc.id == channel.id) {
				throw new Error('Already in that voice channel in this server.');
			} else {
				throw new Error('Currently streaming in ' + stream.vc.name);
			}
		}
		
		let player = new AudioPlayer();
		return player.open(this, channel)
		.then(() => {
			this.log('Starting stream:', player.toString());
			this._players[serverID] = player;
			return player;
		});
	}
	stopStream(serverID, VChannelID) {
		let player = this.getStream(serverID);
		if (!player || !player.vc) {
			throw new Error('Not currently in a voice channel in this server.');
		}
		
		return player.close(this)
		.then(() => {
			this.log('Ending stream:', player.toString());
			delete this._players[serverID];
			return void 0;
		});
	}
	resolveStream(serverID, VChannelID) {
		try {
			if (this.isStreaming(serverID, VChannelID)) {
				return Promise.resolve(this.getStream(serverID));
			} else {
				return this.startStream(serverID, VChannelID);
			}
		} catch (e) {
			return Promise.reject(e);
		}
	}
}

module.exports = DJClient;
