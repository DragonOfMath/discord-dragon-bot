/*
	Algorithm stolen from https://github.com/Marak/zalgo.js/blob/master/zalgo.js
*/

const SOUL = { 
	UP: [
		'̍','̎','̄','̅',
		'̿','̑','̆','̐',
		'͒','͗','͑','̇',
		'̈','̊','͂','̓',
		'̈','͊','͋','͌',
		'̃','̂','̌','͐',
		'̀','́','̋','̏',
		'̒','̓','̔','̽',
		'̉','ͣ','ͤ','ͥ',
		'ͦ','ͧ','ͨ','ͩ',
		'ͪ','ͫ','ͬ','ͭ',
		'ͮ','ͯ','̾','͛',
		'͆','̚'
	],
  DOWN: [
		'̖','̗','̘','̙',
		'̜','̝','̞','̟',
		'̠','̤','̥','̦',
		'̩','̪','̫','̬',
		'̭','̮','̯','̰',
		'̱','̲','̳','̹',
		'̺','̻','̼','ͅ',
		'͇','͈','͉','͍',
		'͎','͓','͔','͕',
		'͖','͙','͚','̣'
    ],
  MID: [
		'̕','̛','̀','́',
		'͘','̡','̢','̧',
		'̨','̴','̵','̶',
		'͜','͝','͞',
		'͟','͠','͢','̸',
		'̷','͡',' ҉'
    ]
};
const ALL = [].concat(SOUL.UP, SOUL.DOWN, SOUL.MID);

function r(range) {
  return Math.floor(Math.random()*range);
}

function zalgo(text, size = 'maxi') {
	let result = '';
	let counts;
	for (var letter of text) {
		if (ALL.indexOf(letter) > -1) continue;
		result += letter;
		counts = {UP: 0, DOWN: 0, MID: 0};
		
		switch(size) {
			case 'mini':
				counts.UP   = r(8);
				counts.MID  = r(2);
				counts.DOWN = r(8);
				break;
			case 'maxi':
				counts.UP   = r(16) + 3;
				counts.MID  = r(4)  + 1;
				counts.DOWN = r(64) + 3;
				break;
			case 'up':
				counts.UP = r(64);
				break;
			case 'down':
				counts.DOWN = r(64);
				break;
			case 'mid':
				counts.MID = r(16);
				break;
			default:
				counts.UP   = r(8) + 1;
				counts.MID  = r(6) / 2;
				counts.DOWN = r(8) + 1;
				break;
		}
		
		for (let dir in SOUL) {
			while (counts[dir]--) {
				result += SOUL[dir][r(SOUL[dir].length)];
			}
		}
	}
	return result;
}

module.exports = {
	'b': {
		aliases: ['bemoji', '\uD83C\uDD71'],
		category: 'Fun',
		info: 'Adds :b: emojis to your text fam.',
		parameters: ['...text'],
		fn({args, userID}) {
			let consonants = 'bvpdrmcsfh'.split('');
			let vowels = 'aeiou'.split('');
			return args.map(word => {
				let first = word[0].toLowerCase();
				if (consonants.includes(first)) {
					return word.replace(new RegExp(first,'gi'),':b:');
				} else if (word.length > 3) {
					return word.replace(/[bvdpg]/gi,':b:');
				} else {
					return word;
				}
			}).join(' ');
		}
	},
	'regional': {
		aliases: ['reg','remoji'],
		category: 'Fun',
		info: 'Turns your text into :regional_indicator_a: emojis.',
		parameters: ['...text'],
		fn({arg, userID}) {
			let letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
			return arg.split('').map(letter => {
				let lower = letter.toLowerCase();
				if (letters.includes(lower)) {
					return `:regional_indicator_${lower}:`;
				} else {
					return letter;
				}
			}).join('');
		}
	},
	'clap': {
		aliases: ['clapemoji', 'clapping', 'preach'],
		category: 'Fun',
		info: ':clap:Can:clap:you:clap:feel:clap:the:clap:memes:clap:tonight?:clap:',
		parameters: ['...text'],
		fn({args}) {
			return ':clap:' + args.join(':clap:') + ':clap:';
		}
	},
	'greentext': {
		aliases: ['gt', 'tfw', 'mfw', 'mrw'],
		category: 'Fun',
		info: '```css\n>Turns your text into greentext\n```',
		parameters: ['...text'],
		fn({arg}) {
			return '```css\n' + arg.split('\n').map(x => '>' + x).join('\n') + '\n```';
		}
	},
	'zalgo': {
		aliases: ['justfuckmyshitup', 'zuul'],
		category: 'Fun',
		info: 'HE COMES',
		parameters: ['...text'],
		fn({client, arg}) {
			return zalgo(arg);
		}
	},
	'caps': {
		aliases: ['mixedcaps','mcaps'],
		category: 'Fun',
		info: 'SuPer WacKY aND zAnY tExT!1!',
		parameters: ['...text'],
		fn({client, arg}) {
			return arg.split('').map(c => {
				if (c == '!') {
					return r(2) ? '1' : c;
				} else {
					return r(2) ? c.toUpperCase() : c.toLowerCase();
				}
			}).join('');
		}
	}
};
