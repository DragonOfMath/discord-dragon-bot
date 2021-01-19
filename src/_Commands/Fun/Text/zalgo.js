const {random} = require('../../../Utils');
const Asset = require('../../../Structures/Asset');
const SOUL  = Asset.load('Text/zalgo.json');
const ALL   = [].concat(SOUL.UP, SOUL.DOWN, SOUL.MID);

class Zalgo {
	/**
	 * Corrupts text using zalgo characters.
	 * Zalgorithm from https://github.com/Marak/zalgo.js/blob/master/zalgo.js
	 * @param {String} text
	 * @param {String} [option] - mini, maxi, up, down, mid, or normal
	 */
	static corrupt(text, option = 'maxi') {
		var result = '';
		var counts = {UP: 0, DOWN: 0, MID: 0};
		for (var letter of text) {
			if (ALL.includes(letter)) continue; // avoid zalgo compounding
			result += letter;
			
			switch(option) {
				case 'mini':
					counts.UP   = random(8);
					counts.MID  = random(2);
					counts.DOWN = random(8);
					break;
				case 'maxi':
					counts.UP   = random(16) + 3;
					counts.MID  = random(4)  + 1;
					counts.DOWN = random(64) + 3;
					break;
				case 'up':
					counts.UP = random(64);
					counts.MID  = 0;
					counts.DOWN = 0;
					break;
				case 'down':
					counts.UP   = 0;
					counts.MID  = 0;
					counts.DOWN = random(64);
					break;
				case 'mid':
					counts.UP   = 0;
					counts.MID = random(16);
					counts.DOWN = 0;
					break;
				default:
					counts.UP   = random(8) + 1;
					counts.MID  = random(6) / 2;
					counts.DOWN = random(8) + 1;
					break;
			}
			
			for (var dir in SOUL) {
				while (counts[dir]--) {
					result += random(SOUL[dir]);
				}
			}
		}
		return result;
	}
	/**
	 * Removes zalgo corruption from text.
	 */
	static uncorrupt(text) {
		for (let letter of ALL) {
			text = text.replace(letter, '');
		}
		return text;
	}
};

module.exports = Zalgo;
