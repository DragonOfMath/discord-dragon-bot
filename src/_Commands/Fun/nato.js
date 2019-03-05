const Asset = require('../../Structures/Asset');
const NATO  = Asset.load('Text/nato.json');

module.exports = {
	from(text) {
		return text.split(' ').map(t => t[0] in NATO ? t[0] : t).join('');
	},
	to(text) {
		return text.split('').map(t => NATO[t[0].toUpperCase()]||t).join(' ');
	}
};
