/**
	cmd_fun.js
	Command file for various fun activities.
*/

const {Markdown:md,random} = require('../Utils');

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
				return ['Maybe', 'Perhaps', 'Hmmm', 'Let me think...', '<:thinking:>'];
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
			var i = Math.min(args[0],5);
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
				return `<@${userID}> **${heads ? 'Heads' : 'Tails'}**`;
			} else {
				return `<@${userID}> **Heads: ${heads} | Tails: ${tails}**`;
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
				return `<@${userID}> rolled a **${s.findIndex(x=>!!x)+1}**`;
			} else {
				return `<@${userID}> ${sides.map((x,i) => `${i+1}x${x}`).join(' + ')} = **${rollSum(sides)}**`;
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
				return `<@${userID}> rolled a **${s.findIndex(x=>!!x)+1}**`;
			} else {
				return `<@${userID}> ${sides.map((x,i) => `${i+1}x${x}`).join(' + ')} = **${rollSum(sides)}**`;
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
			var expression = args.map(a => {
				try {
					var [,rolls,sides] = a.match(/^(\d+)d(\d+)$/);
					var s = randomDistribution(sides, rolls);
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
		title: 'Rock Paper Scissors',
		parameters: ['<r|rock|✊|p|paper|✋|s|scissors|✌>'],
		permissions: 'inclusive',
		fn({args, userID}) {
			var p = args[0].toLowerCase();
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
			var c = random(RPS.choices.length);
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
	'random': {
		aliases: ['rand', 'rng'],
		category: 'Fun',
		info: 'Random',
		permissions: 'inclusive',
		subcommands: {
			'integer': {
				aliases: ['int','i'],
				title: 'Random | Integer',
				info: 'Get a random intger between two values. Default is in range of 0 to 10^10.',
				parameters: ['[lowerbound]','[upperbound]'],
				fn({args, userID}) {
					let [a = 0, b = 1e10] = args;
					return `<@${userID}> ${Math.round(random(a,b))}`;
				}
			},
			'number': {
				aliases: ['num','n'],
				title: 'Random | Number',
				info: 'Get a random real number between two values. Default is in range of 0 to 10^10.',
				parameters: ['[lowerbound]','[upperbound]'],
				fn({args, userID}) {
					let [a = 0, b = 1e10] = args;
					return `<@${userID}> ${random(a,b)}`;
				}
			},
			'letter': {
				aliases: ['let','l'],
				title: 'Random | Letter',
				info: 'Get a random letter from the standard English alphabet, or your own charset.',
				parameters: ['[letters]'],
				fn({arg, userID}) {
					return `<@${userID}> ${random((arg||'abcdefghijklmnopqrstuvwxyz').split(''))}`;
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
					return `<@${userID}> ${word}`;
				}
			}
		}
	}
};
