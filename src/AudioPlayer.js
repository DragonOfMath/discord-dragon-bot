const fs = require('fs');
const {random} = require('./Utils');

class Track {
	constructor(url, name) {
		this.url  = url;
		this.name = name || url.split('/').pop();
	}
	get duration() {
		return '--:--';
	}
	toString() {
		return this.name.replace(/\.mp3$/,'');
	}
	read() {
		return fs.createReadStream(this.url);
	}
}

class AudioPlayer {
	constructor() {
		// TODO: figure out how to adjust play speed?
		//this.playSpeed = 1;
		
		this.playlist = [];
		this.index    = 0;
		this.loopTrack    = false;
		this.loopPlaylist = false;
		
		this.vc             = null;
		this.readableStream = null;
		this.audioContext   = null;
	}
	
	open(client, vc) {
		if (!vc) {
			throw new Error('Voice channel not set.');
		}
		if (vc.type != 2) { // 2 = Voice
			throw new Error(`${vc.name} (${vc.id}) is not a voice channel.`);
		}
		this.vc = vc;
		this.loopTrack    = false;
		this.loopPlaylist = false;
		
		return client.joinVoiceChannel(this.vc.id)
		.then(events => client.getAudioContext(this.vc.id))
		.then(ctx => this._initialSetup(client, ctx));
	}
	close(client) {
		this.stop();
		return client.leaveVoiceChannel(this.vc.id)
		.then(events => {
			delete this.readableStream;
			delete this.audioContext;
			this.vc = null;
		});
	}
	checkForListeners(client) {
		if (Object.keys(this.listeners).length == 0) {
			this.close(client);
		}
	}
	
	mute(client) {
		return client.muteSelf(this.vc.guild_id);
	}
	unmute(client) {
		return client.unmuteSelf(this.vc.guild_id);
	}
	deaf(client) {
		return client.deafSelf(this.vc.guild_id);
	}
	undeaf(client) {
		return client.undeafSelf(this.vc.guild_id);
	}
	
	get paused() {
		return this.readableStream.isPaused();
	}
	get listeners() {
		return this.vc.members;
	}
	get current() {
		return this.playlist[this.index];
	}
	get nowPlaying() {
		return this.current ? this.current.toString() : '[silence]';
	}
	
	clear() {
		for (let s in this.playlist) {
			delete this.playlist[s];
		}
		this.playlist.length = 0;
	}
	add(song) {
		if (typeof(song) === 'string') {
			song = new Track(song);
		}
		this.playlist.push(song);
		if (this.playlist.length == 1) {
			// play music right away
			this.play();
		}
		return song;
	}
	remove(song) {
		if (typeof(song) === 'string') {
			song = this.playlist.find(s => s.name.includes(song));
		} else if (typeof(song) === 'number') {
			song = this.playlist[song];
		}
		if (song) {
			let idx = this.playlist.indexof(idx);
			if (idx > -1) {
				this.playlist.splice(idx, 1);
				if (this.index >= idx) {
					// maintain the current song index
					if (this.index > idx) this.index--;
					// play the next song
					else this.next(0);
				}
				return song;
			}
		}
		throw 'Track not found in playlist.';
	}
	shuffle() {
		for (let i = 0, j, temp; i < this.playlist.length;) {
			if (i !== this.index) {
				j = random(this.playlist.length);
				if (j === this.index) continue;
				temp = this.playlist[i];
				this.playlist[i] = this.playlist[j];
				this.playlist[j] = temp;
			}
			i++;
		}
	}
	play() {
		let currentTrack = this.current;
		if (currentTrack) {
			if (this.readableStream) {
				this._disconnect();
			}
			this._connect(currentTrack.read());
		}
		return currentTrack;
	}
	resume() {
		if (this.paused) {
			this.readableStream.resume();
			return true;
		} else {
			return false;
		}
	}
	pause() {
		if (this.paused) {
			return false;
		} else {
			this.readableStream.pause();
			return true;
		}
	}
	stop() {
		this.clear();
		if (this.readableStream) {
			this._disconnect();
		}
	}
	restart() {
		return this.play();
	}
	skip(skipBy = 1) {
		skipBy = Math.max(1, Math.min(skipBy, this.playlist.length));
		return this.next(skipBy);
	}
	next(s = this.loopTrack ? 0 : 1) {
		this.index = this.index + s;
		if (this.loopPlaylist) {
			this.index = this.index % this.playlist.length;
		} else if (this.index >= this.playlist.length) {
			this.clear();
			return null;
		}
		return this.play();
	}
	_initialSetup(client, ctx) {
		//console.log(ctx);
		this.audioContext = ctx;
		this.audioContext.on('data', () => this.checkForListeners(client));
		this.audioContext.on('done', () => this.next());
		//this.deaf(client);
	}
	_connect(readableStream) {
		this.readableStream = readableStream;
		this.readableStream.pipe(this.audioContext, {end: false});
	}
	_disconnect() {
		this.readableStream.unpipe(this.audioContext);
		this.readableStream.destroy();
		this.readableStream = null;
	}
	toString() {
		return `<${this.constructor.name} ${this.vc?this.vc.id:'empty'}>`;
	}
}

AudioPlayer.Track = Track;

module.exports = AudioPlayer;