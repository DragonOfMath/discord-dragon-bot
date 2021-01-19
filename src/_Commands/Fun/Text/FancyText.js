const Asset = require('../../../Structures/Asset');
const TYPES = Asset.load('Text/fancytext.json');
const {random} = require('../../../Utils');

class FancyText {
	static translate(text, type) {
		if (!type || !(type in TYPES || type == 'random')) {
			type = random(Object.keys(TYPES));
		}
		let output = '';
		for (let letter of text) {
			let idx = TYPES['default'].indexOf(letter);
			if (idx > -1) {
				if (type == 'random') {
					output += TYPES[random(Object.keys(TYPES))][idx] || letter;
				} else {
					output += TYPES[type][idx] || letter;
				}
			} else {
				output += letter;
			}
		}
		return output;
	}
	static decancer(text) {
		let output = '';
		
		find:
		for (let letter of text) {
			for (let type in TYPES) {
				let idx = TYPES[type].indexOf(letter);
				if (idx > -1) {
					output += TYPES['default'][idx];
					continue find;
				}
			}
			output += letter;
		}
		
		return output;
	}
}

FancyText.TYPES = TYPES;

module.exports = FancyText;
