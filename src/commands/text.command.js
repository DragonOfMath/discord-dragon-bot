const {Markdown:md} = require('../Utils');

/*
	Zalgorithm from https://github.com/Marak/zalgo.js/blob/master/zalgo.js
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

/*
	owoify from https://github.com/MalHT/hewwobot/blob/master/bot.js
	Additional tidbits from https://github.com/Printendo/HewwoStudio
*/

const OwO = ['(・`ω´・)','(´・ω・`)',';;w;;','OwO','owo','UwU','uwu','>w<','^w^','x3','X3',':3'];
function owoify(x) {
	function isUpper(x) {
		return x.toUpperCase() == x;
	}
	function isLower(x) {
		return x.toLowerCase() == x;
	}
	function replaceWith(str, rep) {
		for (var i = 0; i < rep.length; i++) {
			if (str[i] && isUpper(str[i])) {
				rep[i] = rep[i].toUpperCase();
			}
		}
		return rep;
	}
	return x
	.replace(/damn/gi, function(s) {
		return replaceWith(s, 'dang');
	})
	.replace(/fuck/gi, function(s) {
		return replaceWith(s, 'heck');
	})
	.replace(/shit/gi, function(s) {
		return replaceWith(s, 'poop');
	})
	.replace(/piss/gi, function(s) {
		return replaceWith(s, 'pee');
	})
	.replace(/(?:r|l)/gi, function(s) {
		return replaceWith(s, 'w');
	})
	.replace(/ove/gi, function(s) {
		return replaceWith(s, 'uv');
	})
	.replace(/qu/gi, function(s) {
		return replaceWith(s, 'kw');
	})
	.replace(/\bth/gi, function(s) {
		return replaceWith(s, 'd');
	})
	.replace(/th\b/gi, function(s) {
		return replaceWith(s, 'f');
	})
	.replace(/n([aeiou])/g, 'ny$1').replace(/N([aeiou])/g, 'Ny$1').replace(/N([AEIOU])/g, 'NY$1')
	 + ' ' + OwO[r(OwO.length)];
}

module.exports = {
	'b': {
		aliases: ['bemoji', '\uD83C\uDD71'],
		category: 'Fun',
		info: 'Adds :b: emojis to your text fam.',
		parameters: ['...text'],
		fn({arg, userID}) {
			let consonants = 'bvpdrmcsfh'.split('');
			let vowels = 'aeiou'.split('');
			return arg.split(' ').map(word => {
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
	},
	'owo': {
		aliases: ['uwu', 'hewwo'],
		category: 'Fun',
		info: 'H-hewwo?! ',
		parameters: ['...text'],
		fn({client, arg}) {
			return owoify(arg);
		}
	},
	'emoji': {
		aliases: ['emojis'],
		category: 'Fun',
		info: 'Use a custom emoji found on any server this bot is in.',
		parameters: ['...emojiNames'],
		fn({client, args}) {
			var emojis = [];
			nextArg: for (var a of args) {
				a = a.toLowerCase();
				for (var sid in client.servers) {
					var serverEmojis = client.servers[sid].emojis;
					for (var eid in serverEmojis) {
						var ename = serverEmojis[eid].name
						if (a == ename.toLowerCase() || a == eid) {
							emojis.push(md.emoji(ename,eid));
							continue nextArg;
						}
					}
				}
				// custom emoji not found. possible default emoji?
				emojis.push(md.emoji(a));
			}
			return emojis.join(' ');
		}
	}
};
