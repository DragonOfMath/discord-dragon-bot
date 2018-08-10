/**
	cmd_fun.js
	Command file for various fun activities.
*/

const {Markdown:md,random,fetch} = require('../Utils');
const DiscordUtils = require('../DiscordUtils');
const EmojiNames = require('../static/emoji.json');

function randomDistribution(o,i) {
	o = Number(o) || 2;
	i = Number(i) || 1;
	let outcomes = Array(o).fill(0);
	i = Math.max(1,Math.min(i,1000));
	while (i--) outcomes[~~(outcomes.length*Math.random())]++;
	return outcomes;
}
function rollSum(rolls) {
	let sum = 0;
	for (let r = 0; r < rolls.length; r++) {
		sum += (r+1) * rolls[r];
	}
	return sum;
}

const RPS = {
	choices: ['✊','✋','✌'],
	outcomes: [
		[0,-1,1],
		[1,0,-1],
		[-1,1,0]
	]
};

module.exports = {
	'rate': {
		aliases: ['outta10'],
		category: 'Fun',
		title: ':100:',
		info: 'I will rate anything out of 10 points.',
		paramters: ['...thing'],
		permissions: 'inclusive',
		fn({arg,userID}) {
			return md.mention(userID) + ', I rate ' + arg + ' a ' + md.bold(random(11) + '/10');
		}
	},
	'decide':{
		aliases: ['choose','choices'],
		category: 'Fun',
		title: ':scales:',
		info: 'Let me choose between your choices (use quotation marks/OR/`|` to separate mult-word choices; if left out, all words are choices)',
		parameters: ['...choices'],
		permissions: 'inclusive',
		fn({args,userID}) {
			
			let decisions = [];
			let or = args.indexOf('OR');
			if (or < 0) or = args.indexOf('|');
			if (or > -1) {
				while (or > -1) {
					decisions.push(args.splice(0,or).join(' '));
					args.shift();
					or = args.indexOf('OR');
					if (or < 0) or = args.indexOf('|');
				}
				decisions.push(args.join(' '));
			} else {
				decisions = args;
			}
			
			return md.mention(userID) + random([
				' I\'d go with ',
				' I choose ',
				' Maybe ',
				' Probably ',
				' Definitely ',
				' Obviously ',
				' Ooh, tough choice. How about ',
				' Hmmm, I pick ',
				' '
			]) + md.bold(random(decisions));
		}
	},
	'eightball':{
		aliases: ['8ball','8'],
		category: 'Fun',
		title: ':8ball:',
		info: 'Ask me a yes-no question and I\'ll tell you the answer!',
		parameters: ['...question'],
		permissions: 'inclusive',
		fn({client, args}) {
			var chance = 100 * Math.random();
			if (chance < 40) {
				return ['Yes', 'Yeah', 'Yup', 'Yep', 'Absolutely', 'Totally'];
			} else if (chance < 60) {
				return ['Maybe', 'Perhaps', 'Hmmm', 'Let me think...', ':thinking:'];
			} else if (chance < 90) {
				return ['No', 'Nope', 'Never', 'Nah', 'Absolutely not'];
			} else {
				return ['Prefer not to answer', 'I don\'t know', 'I can\'t answer that yet'];
			}
		}
	},
	'card': {
		aliases: ['pickcard','pickacard','cardpick'],
		category: 'Fun',
		title: ':black_joker:',
		info: 'Pick a card (or number of cards, limit of 5) from a standard 52-card deck',
		parameters: ['[number]'],
		permissions: 'inclusive',
		fn({userID,args}) {
			var cards = [];
			var i = Math.min(Math.max(args[0],1),5);
			while (i > 0) {
				var suit  = random(":spades:",":hearts:",":diamonds:",":clubs:");
				var value = random('A',2,3,4,5,6,7,8,9,10,'J','Q','K');
				var card = `${value}${suit}`;
				if (!cards.includes(card)) {
					cards.push(card);
					i--;
				}
			}
			return md.mention(userID) + ' drew ' + cards.map(md.bold).join(', ');
		}
	},
	'coin': {
		aliases: ['flipcoin','coinflip','tosscoin','cointoss'],
		category: 'Fun',
		title: ':coin:',
		info: 'Flip a coin.',
		parameters: ['[rolls]'],
		permissions: 'inclusive',
		fn({args, userID}) {
			let [rolls = 1] = args;
			let [heads,tails] = randomDistribution(2,rolls);
			if (rolls == 1) {
				return md.mention(userID) + ' ' + (heads ? 'Heads' : 'Tails');
			} else {
				return md.mention(userID) + ' ' + md.bold(`Heads: ${heads} | Tails: ${tails}`);
			}
		}
	},
	'dice': {
		aliases: ['rolldice','diceroll','dice6','d6'],
		category: 'Fun',
		title: ':game_die:',
		info: 'Roll a 6-sided die.',
		parameters: ['[rolls]'],
		permissions: 'inclusive',
		fn({args, userID}) {
			let [rolls = 1] = args;
			let sides = randomDistribution(6,rolls);
			if (rolls == 1) {
				return md.mention(userID) + ' rolled a ' + md.bold(sides.findIndex(x=>!!x)+1);
			} else {
				return md.mention(userID) + ' ' + sides.map((x,i) => `${i+1}x${x}`).join(' + ') + ' = ' + md.bold(roleSum(sides));
			}
		}
	},
	'dice20': {
		aliases: ['rolldice20','diceroll20','d20'],
		category: 'Fun',
		title: ':game_die:',
		info: 'Roll a 20-sided die.',
		parameters: ['[rolls]'],
		permissions: 'inclusive',
		fn({args, userID}) {
			let [rolls = 1] = args;
			let sides = randomDistribution(20,rolls);
			if (rolls == 1) {
				return md.mention(userID) + ' rolled a ' + md.bold(sides.findIndex(x=>!!x)+1);
			} else {
				return md.mention(userID) + ' ' + sides.map((x,i) => `${i+1}x${x}`).join(' + ') + ' = ' + md.bold(roleSum(sides));
			}
		}
	},
	'roll': {
		category: 'Fun',
		title: ':game_die:',
		info: 'Advanced dice-roll command, using an expression of dice rolls in the form XdXX, plus modifiers.',
		parameters: ['XdXX + offset + ...'],
		permissions: 'inclusive',
		fn({args, userID}) {
			let expression = args.map(a => {
				try {
					let [,rolls,sides] = a.match(/^(\d+)d(\d+)$/);
					let s = randomDistribution(sides, rolls);
					return s.map((x,i) => `(${i+1} * ${x})`).join(' + ');
				} catch (e) {
					return a;
				}
			}).join(' ');
			
			return md.mention(userID) + ' rolled ' + md.code(expression) + ' = ' + md.bold(eval(expression));
		}
	},
	'rps': {
		aliases: ['rockpaperscissors'],
		category: 'Fun',
		title: 'Rock Paper Scissors',
		info: 'A classic game of Rock Paper Scissors versus the bot!',
		parameters: ['<r|rock|✊|p|paper|✋|s|scissors|✌>'],
		permissions: 'inclusive',
		fn({args, userID}) {
			let p = args[0].toLowerCase();
			switch (p) {
				case 'r':
				case 'rock':
				case '✊':
					p = 0;
					break;
				case 'p':
				case 'paper':
				case '✋':
					p = 1;
					break;
				case 's':
				case 'scissors':
				case '✌':
					p = 2;
					break;
			}
			let c = random(RPS.choices.length);
			switch (RPS.outcomes[p][c]) {
				case 1:
					return RPS.choices[c] + ', you win!';
				case 0:
					return RPS.choices[c] + ', it\'s a tie!';
				case -1:
					return RPS.choices[c] + ', I win!';
			}
		}
	},
	'bottle': {
		aliases: ['messageinabottle','miab'],
		category: 'Fun',
		title: ':ocean: :newspaper2:',
		info: 'Send an anonymous message in a bottle to a random online user on the server. Or opt-in/opt-out from receiving bottles. (You automatically opt-in when sending)',
		parameters: ['[opt-in|opt-out|...message]'],
		permissions: 'inclusive',
		fn({client, server, user, arg}) {
			let userTable = client.database.get('users');
			if (arg === 'opt-out') {
				userTable.modify(user.id, u => {return u.miab = false, u}).save();
				return 'You opted-out of receiving bottles from strangers.';
			} else {
				userTable.modify(user.id, u => {return u.miab = true, u}).save();
				if (arg === 'opt-in') {
					return 'You opted-in to receive bottles from strangers.';
				}
				setTimeout(() => {
					let onlineUsers = DiscordUtils.getUsersByStatus(server, 'online').filter(u => !u.bot && userTable.get(u.id).miab);
					let recipient = random(onlineUsers) || user;
					client.log('Message in a bottle sent by',md.atUser(user),'has been received by',md.atUser(recipient));
					let message;
					if (recipient.id == user.id) {
						message = 'Your message in a bottle found its way back to you... ';
					} else {
						message = 'You got a message in a bottle! It reads... ';
					}
					client.send(recipient.id, message, {title: ':ocean: :newspaper2:', description: arg})
					.catch(err => client.error(err));
				}, random(5000, 60000));
				return 'Message in a bottle sent!';
			}
		}
	},
	'xkcd': {
		category: 'Fun',
		title: 'XKCD Comic',
		info: 'Shows you a random XKCD comic.',
		parameters: ['[number]'],
		permissions: 'inclusive',
		fn({client, args}) {
			if (args[0] && Number(args[0])) {
				return 'https://xkcd.com/'+args[0];
			} else {
				return fetch('https://c.xkcd.com/random/comic/', {responseOnly:true})
				.then(response => {
					//console.log(JSON.stringify(response));
					return response.request.uri.href;
				});
			}
		}
	},
	'random': {
		aliases: ['rand', 'rng'],
		category: 'Fun',
		info: 'Random',
		permissions: 'inclusive',
		analytics: false,
		subcommands: {
			'integer': {
				aliases: ['int','i'],
				title: 'Random | Integer',
				info: 'Get a random intger between two values. Default is in range of 0 to 10^10.',
				parameters: ['[lowerbound]','[upperbound]'],
				fn({args, userID}) {
					let [a = 0, b = 1e10] = args;
					return md.mention(userID) + ' ' + Math.round(random(a,b));
				}
			},
			'number': {
				aliases: ['num','n'],
				title: 'Random | Number',
				info: 'Get a random real number between two values. Default is in range of 0 to 10^10.',
				parameters: ['[lowerbound]','[upperbound]'],
				fn({args, userID}) {
					let [a = 0, b = 1e10] = args;
					return md.mention(userID) + ' ' + random(a,b);
				}
			},
			'letter': {
				aliases: ['let','l'],
				title: 'Random | Letter',
				info: 'Get a random letter from the standard English alphabet, or your own charset.',
				parameters: ['[letters]'],
				fn({arg, userID}) {
					return md.mention(userID) + ' ' + random(arg||'abcdefghijklmnopqrstuvwxyz');
				}
			},
			'string': {
				aliases: ['str','s'],
				title: 'Random | String',
				info: 'Generate a random string of letters. Default length of 10 and using the standard English alphabet.',
				parameters: ['[length]','[letters]'],
				fn({args, userID}) {
					let [length = 10, chars = 'abcdefghijklmnopqrstuvwxyz'] = args;
					length = Math.max(1,Math.min(length,100));
					chars = chars.split('');
					let word = "";
					while (length-- > 0) {
						word += random(chars);
					}
					return md.mention(userID) + ' ' + word;
				}
			},
			'user': {
				aliases: ['member','mention','m'],
				title: 'Random | User',
				info: 'Pick a random user on the server and mention them (lol). Optionally, you can specify if you want to pick from only online users or everyone.',
				parameters: ['[<everyone|here>]'],
				fn({server, args}) {
					let [scope = 'here'] = args;
					if (scope.toLowerCase() == 'everyone') {
						return md.mention(random(DiscordUtils.getServerMembers(server)));
					} else if (scope.toLowerCase() == 'here') {
						let onlineUsers = DiscordUtils.getUsersByStatus(server, 'online');
						return md.mention(random(onlineUsers));
					}
				}
			},
			'channel': {
				aliases: ['chan','c'],
				title: 'Random | Channel',
				info: 'Pick a random channel on the server.',
				fn({server}) {
					return md.channel(random(DiscordUtils.getServerChannels(server)));
				}
			},
			'emoji': {
				aliases: ['e'],
				title: 'Random | Emoji',
				info: 'Pick a random emoji, either from Discord emojis, custom emojis, or any.',
				parameters: ['[<discord|custom|any>]'],
				fn({client, server, args}) {
					switch (args[0]) {
						case 'discord':
							return md.emoji(random(Object.keys(EmojiNames)));
						case 'custom':
							return md.emoji(random(Object.values(server.emojis)));
						default:
							return md.emoji(random(Object.keys(EmojiNames).concat(Object.values(server.emojis))));
					}
				}
			},
			'command': {
				aliases: ['cmd'],
				title: 'Random | Command',
				info: 'Pick a random command.',
				fn({client,userID}) {
					let cmds = client.commands.items;
					if (userID != client.ownerID) {
						cmds = cmds.filter(c => !c.suppress);
					}
					let cmd = random(cmds);
					while (random(true) && cmd.hasSubcommands) {
						cmd = random(cmd.subcommands.items);
					}
					return cmd.usage;
				}
			},
			'token': {
				title: 'Random | Token',
				info: 'Generate a random fake Discord Token.',
				fn({userID}) {
					return md.code(DiscordUtils.generateFakeToken(userID));
				}
			}
		}
	}
};
