const {Color} = require('../Utils');

function embed(color) {
	return {
		title: color.hex,
		color: color.val,
		description: color.toString()
	};
}

module.exports = {
	'color': {
		category: 'Misc',
		title: 'Color',
		info: 'View a color.',
		parameters: ['[red]','[green]','[blue]'],
		permissions: 'inclusive',
		fn({args}) {
			args = args.map(x => {
				if (typeof x === 'string') {
					return parseInt(x, 16);
				} else {
					return x;
				}
			});
			return embed(new Color(...args));
		},
		subcommands: {
			'random': {
				title: 'Color | Random',
				info: 'Generate a random color.',
				fn() {
					return embed(Color.random());
				}
			},
			'hsl': {
				title: 'Color | From HSL',
				info: 'Generate a color from HSL format.',
				paramters: ['hue','saturation','lightness'],
				fn({args}) {
					return embed(Color.hsl(...args));
				}
			}
		}
	}
};
