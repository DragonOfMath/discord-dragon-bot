const Constants = require('../../Constants/Pokemon');
const Session = require('../../Structures/Session');
const {strcmp} = require('../../Utils');

class PokemonSpawnEvent extends Session {
	constructor(serverID, channelID, pkmn) {
		super({
			id: String(Date.now()),
			category: 'pokemon',
			info: 'A wild pokemon has appeared!',
			data: { pkmn, hints: 1 },
			permissions: {
				type: 'inclusive',
				servers: {
					[serverID]: {
						channels: [channelID]
					}
				}
			},
			settings: { silent: false },
			handler({client,user,message}) {
				if (strcmp(message, this.data.pkmn.name)) {
					
					this.close();
				}
			},
			events: {
				goodbye() {
					return {
						title: 'The pokemon left!',
						description: this.toString(),
						color: Constants.COLOR
					};
				}
			}
		});
		this.last_channel_id = channelID;
	}
	toString() {
		return 'Type its name to catch it!';
	}
	toEmbed() {
		return {
			title: 'A new pokemon has appeared!',
			color: Constants.COLOR,
			image: {
				url: this.data.pkmn.sprite
			}
		};
	}
}

module.exports = PokemonSpawnEvent;
