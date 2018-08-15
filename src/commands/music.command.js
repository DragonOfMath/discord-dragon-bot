const FilePromise = require('../FilePromise');
const {Markdown:md,strcmp,substrcmp,bufferize,kwsearch} = require('../Utils');

const MUSIC_FOLDER = __dirname.split('\\').slice(0,3).join('/') + '/Music/';
const MUSIC_TITLE  = ':musical_note: Music';
const MUSIC_EXT    = '.mp3';

function isSong(filename) {
	return filename.endsWith(MUSIC_EXT);
}
function songName(filename) {
	return FilePromise.getName(filename, MUSIC_EXT);
}
function songDir(filename) {
	return MUSIC_FOLDER + filename;
}

function search(query) {
	let files = FilePromise.readDirSync(MUSIC_FOLDER).filter(isSong);
	let matches = kwsearch(files, query, songName);
	//console.log(query, '->', matches);
	return matches.map(m => m.item);
}

module.exports = {
	'music': {
		category: 'Audio',
		title: MUSIC_TITLE,
		info: 'Interface for playing music in Voice Channels. I will join your VC when called for and leave when you want me to or when I\'m alone. (EXPERIMENTAL DISCLAIMER: This command is not totally working yet, due to problems with overriding audio streams)',
		permissions: 'inclusive',
		analytics: false,
		subcommands: {
			'search': {
				title: MUSIC_TITLE + ' | Search',
				info: 'Search my local library for music. (Note: this will be replaced with YouTube search eventually)',
				parameters: ['...keywords'],
				fn({client, serverID, member, arg}) {
					let files = search(arg);
					if (files.length > 0) {
						files = files.slice(0, 20); // maximum of 20 results
						return bufferize(files.map(songName));
					} else {
						return ':x: Couldn\'t find any matching songs in my library!';
					}
				}
			},
			'play': {
				title: MUSIC_TITLE + ' | Play',
				info: 'Play/resume playing music (limited to local files atm).',
				parameters: ['[...keywords]'],
				fn({client, serverID, member, arg}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					return client.resolveStream(serverID, vcID)
					.then(stream => {
						let message = '';
						let song;
						if (arg) {
							let files = search(arg);
							if (files.length > 0) {
								song = stream.add(songDir(files[0]));
							} else {
								return ':x: Couldn\'t find any matching songs in my library!';
							}
						}
						if (stream.playlist.length > 1) {
							return ':inbox_tray: Added to playlist at ' + md.code(stream.playlist.length) + ': ' + md.bold(song.toString());
						} else if (stream.resume()) {
							return ':arrow_forward: Resumed: ' + md.bold(stream.nowPlaying);
						} else {
							return ':notes: Now playing: ' + md.bold(stream.nowPlaying);
						}
					});
				}
			},
			'pause': {
				title: MUSIC_TITLE + ' | :pause_button:',
				info: 'Pause the current track. Use `play` to resume playing.',
				fn({client, serverID, member, args}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					if (!client.isStreaming(serverID, vcID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					if (stream.pause()) {
						return 'Paused!';
					} else {
						return 'I am already paused.';
					}
				}
			},
			'stop': {
				title: MUSIC_TITLE + ' | :stop_button:',
				info: 'Stops playing music and leaves the VC.',
				fn({client, serverID, member, args}) {
					return client.stopStream(serverID)
					.then(() => 'Thanks for listening!');
				}
			},
			'skip': {
				title: MUSIC_TITLE + ' | :track_next:',
				info: 'Skip the current track. Optionally, skip by a number of tracks.',
				parameters: ['[by]'],
				fn({client, serverID, member, args}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					if (!client.isStreaming(serverID, vcID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					stream.skip(args[0]);
					if (stream.current) {
						return 'Now playing: ' + md.bold(stream.nowPlaying);
					} else {
						return 'No more songs to play.';
					}
				}
			},
			'playing': {
				aliases: ['nowplaying','np'],
				title: MUSIC_TITLE + ' | :headphones:',
				info: 'Displays the track that is currently playing.',
				fn({client, serverID, member, args}) {
					if (!client.isStreaming(serverID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					return md.bold(stream.nowPlaying);
				}
			},
			'playlist': {
				aliases: ['pl','songs','queue'],
				title: MUSIC_TITLE + ' | Playlist',
				info: 'Get the current playlist.',
				// display up to 10 playlist in the current playlist
				fn({client, serverID, member, args}) {
					if (!client.isStreaming(serverID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					if (stream.playlist.length) {
						let embed = {
							description: stream.playlist.slice(0, 10).map((song,idx) => {
								let line = `${idx+1} | ${song.name} | ${song.duration}`;
								if (idx == stream.index) line = md.bold(line);
								return line;
							}).join('\n')
						};
						if (stream.playlist.length > 10) {
							embed.footer = {text: `+${stream.playlist.length - 10} more`};
						}
						return embed;
					} else {
						return 'My playlist is currently empty.';
					}
				}
			},
			'replay': {
				aliases: ['restart'],
				title: MUSIC_TITLE + ' | :track_previous:',
				info: 'Replay the current song from the start.',
				fn({client, serverID, member, args}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					if (!client.isStreaming(serverID, vcID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					stream.restart();
					return md.bold(stream.nowPlaying);
				}
			},
			'mute': {
				aliases: ['unmute'],
				title: MUSIC_TITLE + ' | Mute',
				info: 'Mute or unmute the bot.',
				fn({client, serverID, member, args}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					if (!client.isStreaming(serverID, vcID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					if (client.servers[serverID].self_mute) {
						return stream.unmute(client).then(() => ':loud_sound: Unmuted!');
					} else {
						return stream.mute(client).then(() => ':mute: Muted!');
					}
				}
			},
			'remove': {
				title: MUSIC_TITLE + ' | Remove',
				info: 'Remove a song from the playlist.',
				parameters: ['idx|name'],
				fn({client, serverID, member, arg}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					if (!client.isStreaming(serverID, vcID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					let song = stream.remove(arg);
					return ':outbox_tray: Removed: ' + md.bold(song.toString());
				}
			},
			'loop': {
				aliases: ['repeat'],
				title: MUSIC_TITLE + ' | Loop',
				info: 'Toggle looping the current song or entire playlist. (defaults to song)',
				parameters: ['[<song|playlist>]'],
				fn({client, serverID, member, args}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					if (!client.isStreaming(serverID, vcID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					if (args[0] == 'song') {
						stream.loopSong = !stream.loopSong;
						return ':repeat_one: Song looping is ' + md.bold(stream.loopTrack ? 'enabled' : 'disabled');
					} else {
						stream.loopSongs = !stream.loopSongs;
						return ':repeat: Playlist looping is ' + md.bold(stream.loopPlaylist ? 'enabled' : 'disabled');
					}
				}
			},
			'shuffle': {
				title: MUSIC_TITLE + ' | :twisted_rightwards_arrows:',
				info: 'Mix up the current playlist.',
				fn({client, serverID, member, args}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					if (!client.isStreaming(serverID, vcID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					stream.shuffle();
					return 'Shuffled!';
				}
			}/*, ============== TODO ===============
			'volume': {
				title: MUSIC_TITLE + ' | Volume',
				info: 'Adjust the current volume of the audio output',
				parameters: ['percent'],
				fn({client, serverID, member, args}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					if (!client.isStreaming(serverID, vcID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					let volume = Math.max(0, Math.min(args[0], 100));
					stream.setVolume(volume);
					let emoji = [':mute:',':speaker:',':sound:',':loud_sound:'][Math.ceil(volume/25)];
					return emoji + ' Volume set to ' + md.bold(volume + '%');
				}
			},
			'speed': {
				title: MUSIC_TITLE + ' | Play Speed',
				info: '[TODO] Adjust the current playspeed of the audio output.',
				fn({client, serverID, member, args}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					if (!client.isStreaming(serverID, vcID)) {
						throw 'I am not playing music!';
					}
					let stream = client.getStream(serverID);
					throw 'TODO';
				}
			},
			'goto': {
				title: MUSIC_TITLE + ' | Go To Time',
				info: '[TODO] Go to a specific time in the current track.',
				fn({client, serverID, member, args}) {
					let vcID = member.voice_channel_id;
					if (!vcID) {
						throw 'You need to be in a Voice Channel!';
					}
					throw 'TODO';
				}
			}*/
		}
	}
};