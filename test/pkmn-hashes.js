const Jimp        = require('jimp');
const qs          = require('querystring');
const FilePromise = require('../src/Structures/FilePromise');
const {fetch,encodeURIComponent} = require('../src/Utils/fetch');
const PokemonList = require('../src/_Commands/Pokemon/pokemon.json');

const DIR = '../src/_Commands/Pokemon/pokemon_hashes.json';
const URL = 'https://bulbapedia.bulbagarden.net/wiki/';

function wait(t) {
	return new Promise(resolve => {setTimeout(resolve, t)});
}
(async function () {
	let hashTable = await FilePromise.read(DIR);
	
	let $;
	for (let pkmn of PokemonList) {
		console.log(pkmn);
		
		if (pkmn in hashTable) {
			console.log('Cached Hash:', hashTable[pkmn]);
			continue;
		}
		
		// get the pokemon webpage
		let url = URL + pkmn + '_(Pokémon)';
		do {
			try {
				console.log('URL:',url);
				$ = await fetch(url, {html:true});
				break;
			} catch (e) {
				console.error(e);
				url = URL + encodeURIComponent(pkmn + '_(Pokémon)');
				await wait(5000);
			}
		} while (true);
		
		// find the pokemon default image
		let imageURL = 'https:' + $('a.image[href*="wiki/File:"] > img[alt]').attr('src');
		console.log('Image:',imageURL);
		
		// read the image and calculate its hash
		let image = await Jimp.read(imageURL);
		let hash  = image.hash(2);
		console.log('Hash:',hash);
		
		// assign hash and update the hash table
		hashTable[pkmn] = hash;
		await FilePromise.create(DIR, hashTable);
	}
})();
