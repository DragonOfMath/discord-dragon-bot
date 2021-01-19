const {Jimp,DiscordUtils,random} = require('../../Utils');

// palettes taken from https://www.schemecolor.com/halloween-themed-color-schemes.php
const HALLOWEEN_COLORS = {
	'devil':        [0x810806FF,0xBF200EFF,0xFA4113FF,0xFE9B13FF,0xF9C10EFF,0x5C1009FF],
	'birthday':     [0x5E32BAFF,0xE9804DFF,0xEB6123FF,0x18181AFF,0xBFDA7AFF,0x96C457FF],
	'ghost':        [0xEA5F21FF,0xF6FAFDFF,0xC0C3C6FF,0xA6A6A6FF,0x151515FF],
	'pumpkin':      [0x090B06FF,0x1B3711FF,0x2A5420FF,0xF5D913FF,0x5B912DFF,0xF46D0EFF],
	'goldandblack': [0x400001FF,0x2A231DFF,0xFFF093FF,0xF2C900FF,0xE0A42BFF,0xBD7B1FFF],
	'fashionista':  [0xDF4C20FF,0xF56C3CFF,0xC8C7D1FF,0x9C9AA3FF,0x684B42FF,0x583D34FF],
	'scared':       [0x5F1003FF,0x8D3312FF,0xA94915FF,0xCF7B20FF,0xDDD1AEFF,0x33110EFF],
	'witch':        [0x141412FF,0x353534FF,0x2FA71CFF,0x5EC61AFF,0x321291FF],
	'love':         [0x363B3FFF,0xD94E49FF,0xEE7867FF,0xF2C359FF,0xE2B44EFF,0x494F55FF],
	'cake':         [0x1A9511FF,0x27C424FF,0xDB4512FF,0xEB6123FF,0xEF742EFF],
	'nightmare':    [0xF6200BFF,0x7B2C13FF,0xB14424FF,0xD35721FF,0xF17E23FF,0xFBA11CFF],
	'trickortreat': [0xC03C09FF,0xEB6123FF,0xF5CD08FF,0x171615FF,0x67A032FF,0x5F2B93FF],
	'dark':         [0x594021FF,0x674E30FF,0x878579FF,0x3E3D42FF,0x1C1B20FF],
	'playful':      [0x1B1919FF,0xDDD4C0FF,0x969696FF,0x5E3291FF,0xE77120FF,0x6EBE44FF],
	'makeup':       [0x100F10FF,0xE1BBA8FF,0xDAA698FF,0xDB818AFF,0x9B0713FF,0x440605FF],
	'deadly':       [0x1A211CFF,0x20291FFF,0x2C3A21FF,0x84531AFF,0x643A12FF,0x441311FF],
	'monster':      [0x322B24FF,0x433A30FF,0x755E43FF,0x9F7824FF,0x0F1110FF],
	'horror':       [0x1F2807FF,0x2E3718FF,0x3E4821FF,0x94987CFF,0x767627FF,0x454C21FF],
	'simple':       [0xF36A1FFF,0xF3861FFF,0x000000FF],
	'happyhalloween': [0x1C1C1CFF,0xF4831BFF,0x902EBBFF,0x63C328FF,0xEEEB27FF,0xD02823FF]
};
const HALLOWEEN_PALETTES = Object.keys(HALLOWEEN_COLORS);

const RETROWAVE_COLORS = {
	'outrun1': [],
	'outrun2': [],
	'outrun3': []
};
const RETROWAVE_PALETTES = Object.keys(RETROWAVE_COLORS);

module.exports = {
	'halloween': {
		aliases: ['halloweenify','hallowify','spookify','spoopify'],
		category: 'Image',
		info: 'Available only during October: posterizes your avatar (or any image) to halloween colors. Palettes to choose from: ' + HALLOWEEN_PALETTES.join(', '),
		parameters: ['[imageURL]','[palette]'],
		permissions: 'inclusive',
		fn({client, user, args, links, images}) {
			if (new Date().getMonth() !== 9) {
				throw 'It is not the spookiest time of the year yet!';
			}
			let palette, imgURL;
			if (images.length) {
				imgURL = images[0];
				palette = args[0];
			} else if (links.length) {
				[imgURL,palette] = args;
			} else {
				imgURL = DiscordUtils.getAvatarURL(user);
				palette = args[0];
			}
			
			if (palette) palette = palette.toLowerCase();
			if (!(palette && palette in HALLOWEEN_COLORS)) {
				palette = random(HALLOWEEN_PALETTES);
			}
			
			return Jimp.read(imgURL).then(image => {
				return image.posterize(HALLOWEEN_COLORS[palette])
				.getBufferAs('halloweenified.png');
			});
		}
	},
	'retrowave': {
		aliases: ['synthwave','outrun','retrofy','outrunify'],
		category: 'Image',
		info: 'Posterizes your avatar (or any image) to a color palette used in Retrowave/Synthwave/Outrun media. Optional customization includes chromatic aberration and "glitch" effects. Palettes to choose from: ' + RETROWAVE_PALETTES.join(', '),
		parameters: ['[imageURL]','[palette]'],
		flags: ['a|aberration','g|glitch'],
		permissions: 'inclusive',
		enabled: false,
		fn({client, user, args, links, images, flags}) {
			let palette, imgURL;
			if (images.length) {
				imgURL = images[0];
				palette = args[0];
			} else if (links.length) {
				[imgURL,palette] = args;
			} else {
				imgURL = DiscordUtils.getAvatarURL(user);
				palette = args[0];
			}
			
			if (palette) palette = palette.toLowerCase();
			if (!(palette && palette in RETROWAVE_COLORS)) {
				palette = random(RETROWAVE_PALETTES);
			}
			
			return Jimp.read(imgURL).then(image => {
				image = image.posterize(RETROWAVE_COLORS[palette]);
				if (flags.has('g') || flags.has('glitch')) {
					glitch = Number(flags.get('glitch')) || Number(flags.get('g')) || 5;
					glitch = Math.min(glitch, 20);
					image = image.glitchify(glitch);
				}
				if (flags.has('a') || flags.has('aberration')) {
					let aberration = Number(flags.get('aberration')) || Number(flags.get('a')) || 10;
					image = image.aberrate(aberration, 0);
				}
				return image.getBufferAs('retrowave.png');
			});
		}
	}
};
