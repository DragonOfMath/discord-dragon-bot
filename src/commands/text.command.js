const {Markdown:md,random,Base64} = require('../Utils');
const SOUL = require('../static/zalgo.json');
const ALL  = [].concat(SOUL.UP, SOUL.DOWN, SOUL.MID);
const EmojiNames = require('../static/emoji.json');
const NATO = require('../static/nato.json');
const crypto = require('crypto');
const HashTypes = crypto.getHashes();

/*
	Zalgorithm from https://github.com/Marak/zalgo.js/blob/master/zalgo.js
*/
function zalgo(text, size = 'maxi') {
	var result = '';
	var counts = {UP: 0, DOWN: 0, MID: 0};
	for (var letter of text) {
		if (ALL.includes(letter)) continue; // avoid zalgo compounding
		result += letter;
		
		switch(size) {
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
	 + ' ' + random(OwO);
}

const LEET = {
	'a': ['@'],
	'A': ['4'],
	'B': ['8'],
	'c': [':copyright:'],
	'C': [':copyright:'],
	'e': ['3'],
	'E': ['3'],
	'F': ['|='],
	'g': ['9'],
	'H': ['|-|','#'],
	'i': ['!'],
	'I': ['|'],
	'J': ['_)'],
	'k': ['|<','|{'],
	'K': ['|<','|{'],
	'l': ['1'],
	'L': ['1','|_'],
	'M': ['|\\/|','(\\/)'],
	'N': ['|\\|'],
	'o': ['0'],
	'O': ['0'],
	'p': ['|*'],
	'P': ['|*'],
	'q': ['*|'],
	's': ['5','$'],
	'S': ['5','$'],
	't': ['+','7'],
	'T': ['7'],
	'U': ['(_)'],
	'v': ['\\/'],
	'V': ['\\/'],
	'w': ['\\/\\/','vv'],
	'W': ['\\/\\/','VV'],
	'x': ['><'],
	'X': ['><']
};
function leet(x) {
	return x.split('').map(c => c in LEET ? random(LEET[c]) : c).join('');
}
function hash(text, algorithm = 'md5', format = 'hex') {
	let h = crypto.createHash(algorithm);
	h.update(text);
	return h.digest(format);
}

const SHERIFF = `⠀ ⠀ ⠀  🤠\n　   ???\n    ?   ?　?\n   👇   ?? 👇\n  　  ?　?\n　   ?　 ?\n　   👢     👢`;

module.exports = {
	'emoji': {
		aliases: ['emojis','nitro','nitropls'],
		category: 'Fun',
		info: 'Use a custom emoji found on any server this bot is in.',
		parameters: ['...emojiNames'],
		permissions: 'inclusive',
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
	},
	'b': {
		aliases: ['bemoji', '\uD83C\uDD71'],
		category: 'Text',
		info: 'Adds :b: emojis to your text fam.',
		parameters: ['...text'],
		permissions: 'inclusive',
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
		category: 'Text',
		info: 'Turns your text into :regional_indicator_a: emojis.',
		parameters: ['...text'],
		permissions: 'inclusive',
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
		category: 'Text',
		info: ':clap:Can:clap:you:clap:feel:clap:the:clap:memes:clap:tonight?:clap:',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({args}) {
			return ':clap:' + args.join(':clap:') + ':clap:';
		}
	},
	'greentext': {
		aliases: ['gt', 'tfw', 'mfw', 'mrw'],
		category: 'Text',
		info: '```css\n>Turns your text into greentext\n```',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({arg}) {
			return '```css\n' + arg.split('\n').map(x => '>' + x).join('\n') + '\n```';
		}
	},
	'zalgo': {
		aliases: ['justfuckmyshitup', 'zuul'],
		category: 'Text',
		info: 'HE COMES',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({client, arg}) {
			return zalgo(arg);
		}
	},
	'caps': {
		aliases: ['mixedcaps','mcaps','mock'],
		category: 'Text',
		info: 'SuPer WacKY aND zAnY tExT!1!',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({client, arg}) {
			return arg.split('').map(c => {
				if (c == '!') {
					return random('1', c);
				} else {
					return random(c.toUpperCase(), c.toLowerCase());
				}
			}).join('');
		}
	},
	'owo': {
		aliases: ['uwu', 'hewwo', 'babytalk'],
		category: 'Text',
		info: 'H-hewwo?! ',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({client, arg}) {
			return owoify(arg);
		}
	},
	'leet': {
		aliases: ['l33t','1337'],
		category: 'Text',
		info: 'Change your text into leetspeak. -> Ch4ng3 y0ur +3x+ !n+0 13375p34k.',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({client, arg}) {
			return leet(arg);
		}
	},
	'reverse': {
		aliases: ['esrever','backwards'],
		category: 'Text',
		info: 'Reverses your text.',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({client, arg}) {
			return arg.split('').reverse().join('');
		}
	},
	'sheriff': {
		aliases: ['howdy'],
		category: 'Text',
		info: 'Creates an Emoji Sheriff meme.',
		parameters: ['[emoji]'],
		permissions: 'inclusive',
		fn({client, args}) {
			var emoji = args[0] || random(Object.keys(EmojiNames));
			return SHERIFF.replace(/\?/g, emoji) + '\nhowdy. i\'m the sheriff of ' + (EmojiNames[emoji] || md.emojiName(emoji) || emoji);
		}
	},
	'nato': {
		category: 'Text',
		info: 'Convert to and from the NATO phonetic alphabet. (See <https://en.wikipedia.org/wiki/NATO_phonetic_alphabet>)',
		parameters: ['[from]', '...text'],
		permissions: 'inclusive',
		fn({client, args}) {
			let [first, ...text] = args;
			if (first == 'from') {
				return text.map(t => t[0] in NATO ? t[0] : t).join('');
			} else {
				text.unshift(first);
				return text.join(' ').split('').map(t => NATO[t[0].toUpperCase()]||t).join(' ');
			}
		}
	},
	'base64': {
		aliases: ['b64'],
		category: 'Text',
		info: 'Convert to and from Base 64.',
		parameters: ['[from]', '...text'],
		permissions: 'inclusive',
		fn({client, args}) {
			let [first, ...text] = args;
			if (first == 'from') {
				text = text.join(' ');
				return Base64.from(text);
			} else {
				text.unshift(first);
				text = text.join(' ');
				return Base64.to(text);
			}
		}
	},
	'hash': {
		aliases: ['crypto',...HashTypes],
		category: 'Text',
		info: 'Get the specified hash of some text. Specify the algorithm with a command alias or with a parameter, default is `md5`.',
		parameters: ['[algorithm]','...text'],
		permissions: 'inclusive',
		fn({client, cmds, args}) {
			let [algorithm, ...text] = args;
			if (HashTypes.includes(algorithm)) {
				// all is well
			} else if (HashTimes.includes(cmds[cmds.length-1])) {
				text.unshift(algorithm);
				algorithm = cmd[cmds.length-1];
			} else {
				algorithm = 'md5';
			}
			text = text.join(' ');
			return hash(text, algorithm);
		}
	}
};
