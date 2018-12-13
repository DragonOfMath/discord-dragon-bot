const UNO = require('./UNO');
const FilePromise = require('../../../Structures/FilePromise');
const {Markdown:md,DiscordUtils} = require('../../../Utils');

async function setupEmojis(client) {
	let unoCardFolder = require.main.dirname + '/assets/UNO';
	console.log('Reading files in',unoCardFolder);
	let unoCardFiles = FilePromise.readDirSync(unoCardFolder);
	
	let emojis = {};
	for (let file of unoCardFiles) {
		let name = FilePromise.getName(file,'.png');
		emojis[name] = await client.emojis.get(name);
		if (emojis[name]) {
			console.log('Found card',name,emojis[name].id);
		} else {
			emojis[name] = await client.emojis.set(name, FilePromise.readSync(file));
			console.log('Added card',name,emojis[name].id);
		}
	}
	return emojis;
}

module.exports = {
	'uno': {
		aliases: ['unocardgame'],
		title: 'UNO',
		info: 'Play the UNO card game!',
		parameters: ['...co-players'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, context, args}) {
			setupEmojis(client)
			.then(emojis => {
				let players = [context.user];
				for (let a of args) {
					a = md.userID(a);
					if (a && a in client.users) players.push(client.users[a]);
				}
				let uno = new UNO(context, players, emojis);
				uno.startGame(client);
			});
		}
	}
};
