const {Markdown:md,random,Base64,strcmp,substrcmp,truncate,TextBox} = require('../../Utils');
const Zalgo   = require('./zalgo');
const owo     = require('./owo');
const leet    = require('./1337');
const sheriff = require('./sheriff');
const nato    = require('./nato');
const FancyText = require('./FancyText');

const crypto = require('crypto');
const HashTypes = crypto.getHashes();

function hash(text, algorithm = 'md5', format = 'hex') {
	let h = crypto.createHash(algorithm);
	h.update(text);
	return h.digest(format);
}

module.exports = {
	'emoji': {
		aliases: ['emojis','nitro','nitropls'],
		category: 'Text',
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
		fn({arg}) {
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
		fn({arg}) {
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
		fn({arg}) {
			return Zalgo.corrupt(arg);
		}
	},
	'unzalgo': {
		aliases: ['wtfdoesitsay', 'unzuul'],
		category: 'Text',
		info: 'Removes the zalgo corruption from text.',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({arg}) {
			return Zalgo.uncorrupt(arg);
		}
	},
	'caps': {
		aliases: ['mixedcaps','mcaps','mock'],
		category: 'Text',
		info: 'SuPer WacKY aND zAnY tExT!1!',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({arg}) {
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
		fn({arg}) {
			return owo(arg);
		}
	},
	'leet': {
		aliases: ['l33t','1337'],
		category: 'Text',
		info: 'Change your text into leetspeak. -> Ch4ng3 y0ur +3x+ !n+0 13375p34k.',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({arg}) {
			return leet(arg);
		}
	},
	'reverse': {
		aliases: ['esrever','backwards'],
		category: 'Text',
		info: 'Reverses your text.',
		parameters: ['...text'],
		permissions: 'inclusive',
		fn({arg}) {
			return arg.split('').reverse().join('');
		}
	},
	'sheriff': {
		aliases: ['howdy'],
		category: 'Text',
		info: 'Creates an Emoji Sheriff meme.',
		parameters: ['[emoji]'],
		permissions: 'inclusive',
		fn({arg}) {
			return sheriff(arg);
		}
	},
	'nato': {
		category: 'Text',
		info: 'Convert to and from the NATO phonetic alphabet. (See <https://en.wikipedia.org/wiki/NATO_phonetic_alphabet>)',
		parameters: ['[from]', '...text'],
		permissions: 'inclusive',
		fn({args}) {
			let [first, ...text] = args;
			text = text.join(' ');
			if (first == 'from') {
				return nato.from(text);
			} else {
				return nato.to(first + ' ' + text);
			}
		}
	},
	'base64': {
		aliases: ['b64'],
		category: 'Text',
		info: 'Convert to and from Base 64.',
		parameters: ['[from]', '...text'],
		permissions: 'inclusive',
		fn({args}) {
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
		fn({cmds, args}) {
			let [algorithm, ...text] = args;
			if (HashTypes.includes(algorithm)) {
				// all is well
			} else if (HashTypes.includes(cmds[cmds.length-1])) {
				text.unshift(algorithm);
				algorithm = cmd[cmds.length-1];
			} else {
				algorithm = 'md5';
			}
			text = text.join(' ');
			return hash(text, algorithm);
		}
	},
	'textbox': {
		aliases: ['box'],
		category: 'Text',
		info: 'Generate a unicode box with text inside. Use the `-title:"Title"` flag to set the box title and `-buttons:ok,cancel` to add buttons (with labels separated by commas).',
		parameters: ['...text'],
		flags: ['title','buttons'],
		permissions: 'inclusive',
		fn({args, flags}) {
			let title   = flags.get('title');
			let text    = args.join(' ');
			let buttons = [];
			if (flags.has('buttons')) {
				buttons = flags.get('buttons').split(',').slice(0,4);
			} else {
				buttons.push('OK');
			}
			
			let w  = 50;
			let iw = w - 4;
			let h  = Math.ceil(text.length / iw) + 2;
			let ty = 1;
			
			if (title) {
				h += 2;
				ty += 2;
			}
			if (buttons.length) {
				h += 5;
			}
			
			let box = new TextBox(w,h);
			box.drawBox(0,0,iw,h-2,TextBox.STROKE.DOUBLE,TextBox.CORNER.RECT,{xOffset:1,yOffset:1,weight:1});
			
			if (title) {
				box.drawHorizLine(0,2,iw);
				let centerx = Math.floor((iw - title.length) / 2);
				box.print(truncate(title,iw),centerx,1);
			}
			if (text) {
				box.print(text, 2, ty);
			}
			if (buttons.length) {
				let totalWidth = buttons.reduce((s,b) => s += b.length+4, 0);
				let bx = Math.floor((iw - totalWidth) / 2);
				for (let button of buttons) {
					let len = button.length;
					box.drawBox(bx-2,h-5,bx+len+1,h-3,TextBox.STROKE.SINGLE,TextBox.CORNER.ROUND);
					box.print(button,bx,h-4);
					bx += len + 5;
				}
			}
			return md.codeblock(box.toString());
		}
	},
	'fancy': {
		aliases: ['fancytext','cancer'],
		category: 'Text',
		title: 'Fancify Text',
		info: 'Turns your text into fancy text! Types: ' + Object.keys(FancyText.TYPES).join(', '),
		parameters: ['...text'],
		flags: ['type'],
		permissions: 'inclusive',
		fn({args,flags}) {
			return FancyText.translate(args.join(' '), flags.get('type'));
		}
	},
	'portmanteau': {
		aliases: ['combine'],
		category: 'Text',
		title: 'Portmanteau',
		info: 'Combine two words into a portmanteau.',
		parameters: ['word1|user1','word2|user2'],
		permissions: 'inclusive',
		fn({client,args}) {
			let [w1,w2] = args;
			if (md.userID(w1)) {
				w1 = client.users[md.userID(w1)].username;
			}
			if (md.userID(w2)) {
				w2 = client.users[md.userID(w2)].username;
			}
			let shorter = Math.min(w1.length, w2.length);
			let longer  = Math.max(w1.length, w2.length);
			let portmanteau;
			
			if (w1 == 'no') {
				return w2 + 'n\'t';
			} else if (w2 == 'no') {
				return w1 + 'n\'t';
			}
			
			search:
			for (let commonLen = shorter; commonLen > 1; commonLen--) {
				for (let offset = 0; offset < w1.length - commonLen + 1; offset++) {
					let common = w1.substr(offset, commonLen);
					let insertIdx = w2.toLowerCase().indexOf(common.toLowerCase());
					if (insertIdx > -1) {
						let w1part1 = w1.substring(0, offset);
						let w1part2 = w1.substring(offset + commonLen);
						let w2part1 = w2.substring(0, insertIdx);
						let w2part2 = w2.substring(insertIdx + commonLen);
						portmanteau = w1part1 + common + w2part2;
						// the result is unexpectedly shorter than both... try combining the other parts
						if (portmanteau.length < w1.length && portmanteau.length < w2.length) {
							portmanteau = w2part1 + common + w1part2;
						}
						// failed at that too? try something wacky!
						if (portmanteau == w1 || portmanteau == w2) {
							portmanteau = w1part1 + w2part1 + common + w1part2 + w2part2;
						}
						break search;
					}
				}
			}
			
			if (portmanteau && portmanteau != w1 && portmanteau != w2) {
				return `${w1} + ${w2} = ${md.bold(portmanteau)}`;
			} else {
				portmanteau = w1 + '-' + w2;
				return `${w1} + ${w2} = uhhh... ${md.bold(portmanteau)}?`;
			}
		}
	}
};
