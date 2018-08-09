const fs = require('fs');
const {random} = require('./Utils');

class Song {
	constructor(url, name) {
		this.url  = url;
		this.name = name || url.split('/').pop();
	}
	get duration() {
		return '--:--';
	}
	toString() {
		return this.name;
	}
	read() {
		return fs.createReadStream(this.url);
	}
}

class AudioPlayer {
	constructor() {
		// TODO: figure out how to adjust play speed?
		//this.playSpeed = 1;
		
		this.songs     = [];
		this.index     = 0;
		this.loopSong  = false;
		this.loopSongs = false;
		//this.mute      = false;
		
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
		this.vc        = vc;
		this.loopSong  = false;
		this.loopSongs = false;
		//this.mute      = false;
		
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
		return this.songs[this.index];
	}
	get nowPlaying() {
		return this.current ? this.current.toString() : '[silence]';
	}
	
	clear() {
		for (let s in this.songs) {
			delete this.songs[s];
		}
		this.songs.length = 0;
	}
	add(song) {
		if (typeof(song) === 'string') {
			song = new Song(song);
		}
		this.songs.push(song);
		if (this.songs.length == 1) {
			// play music right away
			this.play();
		}
		return song;
	}
	remove(song) {
		if (typeof(song) === 'string') {
			song = this.songs.find(s => s.name.includes(song));
		} else if (typeof(song) === 'number') {
			song = this.songs[song];
		}
		if (song) {
			let idx = this.songs.indexof(idx);
			if (idx > -1) {
				this.songs.splice(idx, 1);
				if (this.index >= idx) {
					// maintain the current song index
					if (this.index > idx) this.index--;
					// play the next song
					else this.next(0);
				}
				return song;
			}
		}
		throw 'Song not found in playlist.';
	}
	shuffle() {
		for (let i = 0, j, temp; i < this.songs.length; i++) {
			j = random(this.songs.length);
			if (i === this.index || j === this.index) continue;
			temp = this.songs[i];
			this.songs[i] = this.songs[j];
			this.songs[j] = temp;
		}
	}
	play() {
		let currentSong = this.current;
		if (currentSong) {
			if (this.readableStream) {
				this._disconnect();
			}
			this._connect(currentSong.read());
		}
		return currentSong;
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
		skipBy = Math.max(1, Math.min(skipBy, this.songs.length));
		return this.next(skipBy);
	}
	next(s = this.loopSong ? 0 : 1) {
		this.index = this.index + s;
		if (this.loopSongs) {
			this.index = this.index % this.songs.length;
		} else if (this.index >= this.songs.length) {
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

AudioPlayer.Song = Song;

module.exports = AudioPlayer;