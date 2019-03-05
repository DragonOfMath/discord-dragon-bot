const {Color,ColorPalette,Jimp} = require('../../../Utils');

async function generateColorEmbed(color) {
	if (!(color instanceof Color)) {
		color = new Color(color);
	}
	var image = new Jimp(100,100,color.rgba);
	var pkg = await image.getBufferAs('color.png');
	pkg.embed = {
		title: color.hex,
		color: color.val,
		description: color.toString(),
		image: {
			url: 'attachment://color.png'
		}
	};
	return pkg;
}
async function generatePaletteEmbed(style) {
	var width  = 1000,
	    height = 50,
	    image  = new Jimp(width, height, 0xFFFFFFFF),
	    colors = style.colors.length,
	    dx = width / colors,
	    dy = height / 2,
	    x;
	for (x=0;x<colors;x++) {
		image.fill(style.colors[x].rgba, x * dx, 0, dx, dy);
	}
	for (x=0;x<width;x++) {
		image.drawScanY(x, dy, height, style.get(x/dx).rgba);
	}
	var pkg = await image.getBufferAs('palette.png');
	pkg.embed = Object.assign(style.embed(), {
		title: 'Color Palette',
		color: style.colors[0].val,
		image: {
			url: 'attachment://palette.png'
		}
	});
	return pkg;
}

module.exports = {
	'color': {
		category: 'Misc',
		title: 'Color',
		info: 'View a color.',
		parameters: ['[red]','[green]','[blue]'],
		permissions: 'inclusive',
		fn({args}) {
			return generateColorEmbed(new Color(...args));
		},
		subcommands: {
			'random': {
				title: 'Color | Random',
				info: 'Generate a random color.',
				fn() {
					return generateColorEmbed(Color.random());
				}
			},
			'hsl': {
				title: 'Color | From HSL',
				info: 'Generate a color from HSL format.',
				paramters: ['hue','saturation','lightness'],
				fn({args}) {
					return generateColorEmbed(Color.hsl(...args));
				}
			},
			'day': {
				aliases: ['oftheday','daily'],
				title: 'Color of the Day',
				info: 'Get the color of the day.',
				fn({client}) {
					return generateColorEmbed(client.storage.cotd.color);
				}
			},
			'palette': {
				aliases: ['pallete','colors'],
				title: 'Color | Palette',
				info: 'Generate a palette of random colors, up to 10 max (default 5).',
				parameters: ['[number]'],
				fn({args,flags}) {
					var style = new ColorPalette();
					style.random(Math.max(0, Math.min(args[0], 10)) || 5);
					return generatePaletteEmbed(style);
				}
			}
		}
	}
};
