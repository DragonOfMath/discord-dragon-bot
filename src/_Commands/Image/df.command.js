const ProcPromise = require('../../Structures/ProcPromise');
const FilePromise = require('../../Structures/FilePromise');
const {Jimp} = require('../../Utils');

const DF_ROOT = FilePromise.resolve('../../My Games/Dwarf Fortress 0.44.12');
const DF_ID   = '9999';
const DF_TEMP = 'region' + DF_ID;

function quote(x) {
	return '"' + x + '"';
}

module.exports = {
	'df': {
		aliases: ['dwarffortress'],
		category: 'Image',
		title: 'Dwarf Fortress Map Generator',
		info: 'Generate a worldmap through Dwarf Fortress. You can specify a seed and world size/type, and whether to send the ASCII or rendered version.',
		parameters: ['[seed]','[<POCKET|SMALLER|SMALL|MEDIUM|LARGE>]','[<REGION|ISLAND>]'],
		flags: ['a|ascii'],
		permissions: 'private',
		analytics: false,
		cooldown: 600000,
		fn({client, channelID, args, flags}) {
			let [seed='RANDOM',size='SMALL',type='REGION'] = args;
			let world = size + ' ' + type;
			let useAscii = flags.has('a') || flags.has('ascii');
			
			return client.send(channelID, 'Preparing Dwarf Fortress map generator, please wait...')
			.then(async (tempmsg) => {
				// fire up Dwarf Fortress in command line to generate a world
				try {
					let output = await ProcPromise.exec('df.bat', [DF_ID,seed,quote(world)]);
					
					// I don't know what this will log yet
					console.log('Dwarf Fortress returned:',output);
				} catch (e) {
					if (e.message.includes('Command failed')) {} // skip
					else console.error(e);
				}
				
				// give it a few seconds to finish writing the bitmaps
				//await client.wait(5000);
				
				//await client.edit(channelID, tempmsg.id, 'Finishing...');
				
				// Locate the .BMP for the world just generated, and choose the detailed or ASCII version
				let bmp = useAscii ? 'world_map.bmp' : 'detailed.bmp';
				let file = FilePromise.readDirSync(DF_ROOT).find(filename => {
					return filename.startsWith(DF_TEMP) && filename.endsWith(bmp);
				});
				if (!file) throw 'Output BMP file not found...?';
				
				await client.deleteMessage({channelID, messageID: tempmsg.id});
				
				// read the image
				let image = await Jimp.read(FilePromise.join(DF_ROOT, file));
				return image.getBufferAs('dfmap.png');
			});
		}
	}
};
