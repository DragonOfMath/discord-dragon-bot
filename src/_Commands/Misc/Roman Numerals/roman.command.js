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
			let n = args[0];
			return n + ' = ' + (isNaN(n) ? Roman.from(n) : Roman.to(n));
		}
	}
};
