const Roman = require('./Roman');

module.exports = {
	'roman': {
		aliases: ['romannums','romannumerals'],
		category: 'Misc',
		title: 'Roman Numerals',
		info: 'Converts to and from Roman Numerals.',
		parameters: ['number'],
		permissions: 'inclusive',
		fn({args}) {
			let [x,y] = args;
			return isNaN(x) ? (y + ' = ' + Roman.from(y)) : (x + ' = ' + Roman.to(x));
		}
	}
};
