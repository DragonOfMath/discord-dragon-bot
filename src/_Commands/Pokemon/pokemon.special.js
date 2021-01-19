const {Markdown:md,strcmp} = require('../../Utils');
const Asset = require('../../Structures/Asset');

const Pokemon = require('./Pokemon');
const PokemonMain = require('./PokemonMain');
const PokemonList = Asset.require('Pokemon/pokemon.json');
const PokecordID  = Asset.require('Discord/bots.json')['Pokecord'];

module.exports = {
	id: 'pokemon',
	category: 'Fun',
	info: 'Spawns wild pokemon or identifies Pokecord\'s pokemon.',
	permissions: 'public',
	data: {
		//pokemon: '',
		spawns: {}
	},
	resolver({client, user, embeds, serverID, channelID, message}) {
		if (user.id == PokecordID) {
			client.warn('Pokecord is discontinued by the developer.');
			return;
			if (embeds.length && embeds[0].title.includes('A wild pokémon has аppeаred!')
			&& client.database.get('servers').get(serverID).autoPkmnID) {
				return PokemonMain.identify(embeds[0].image.url)
				.then(pokemon => {
					this.data.pokemon = pokemon;
					return 'pkmnID';
				})
				.catch(e => client.error('Pokemon identification failed:' + e));
			}
		}
		
		// make sure pokemon spawning is allowed
		let spawnChannelID = client.database.get('servers').get(serverID).pkmnSpawnChannelID;
		if (!spawnChannelID) return;
		
		let spawn = this.data.spawns[serverID];
		if (spawn && channelID == spawnChannelID && strcmp(spawn.pkmn.name, message)) {
			PokemonMain.catchPokemon(client, user.id, spawn.pkmn);
			return 'caught';
		} else if (!user.bot && Math.random() < 0.06) {
			let pkmn = new Pokemon(PokemonList[Math.floor(PokemonList.length * Math.random())]);
			spawn = this.data.spawns[serverID] = { channelID: spawnChannelID, pkmn, hints: 1 };
			// TODO: use Jimp to modify pokemon sprite to deter cheating
			client.send(spawn.channelID, '**A wild pokémon has appeared!** Type the name of the pokémon to catch it!', {image: {url: spawn.pkmn.sprite2}});
		}
	},
	events: {
		pkmnID() {
			if (this.data.pokemon) {
				return 'Pokémon identified: ' + md.code(this.data.pokemon);
			} else {
				return 'Auto-identification failed. Perhaps it\'s a new pokemon?';
			}
		},
		caught({client,userID,serverID}) {
			let pkmn = this.data.spawns[serverID].pkmn;
			delete this.data.spawns[serverID];
			return 'Congrats, ' + md.mention(userID) + '! You caught ' + md.bold(pkmn.toString());
		}
	}
};
