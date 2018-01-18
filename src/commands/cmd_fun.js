/**
	cmd_fun.js
	Command file for various fun activities.
*/

const {random} = require('../Utils');

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

module.exports = {
	'decide':{
		aliases: ['choose','choices'],
		category: 'Fun',
		title: ':scales:',
		info: 'Let me choose between your choices (use quotation marks to separate mult-word choices; if left out, all words are choices)',
		parameters: ['...choices'],
		fn({args,userID}) {
			let decisions = args;
			/*
			let decisions = [];
			let or = args.indexOf('OR');
			
			if (or > -1) {
				while (or > -1) {
					decisions.push(args.splice(0,or).join(' '));
					args.shift();
					or = args.indexOf('OR');
				}
				decisions.push(args.join(' '));
			} else {
				decisions = args;
			}
			*/
			return `<@${userID}> ` + random(
				'I\'d go with ',
				'I choose ',
				'Maybe ',
				'Probably ',
				'Definitely ',
				'Ooh, tough choice. How about ',
				'Hmmm, I pick ',
				''
			) + `**${random(decisions)}**`;
		}
	},
	'eightball':{
		aliases: ['8ball','8'],
		category: 'Fun',
		title: ':8ball:',
		info: 'Ask me a yes-no question and I\'ll tell you the answer!',
		parameters: ['...question'],
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
		info: 'Pick a card from a standard 52-card deck',
		parameters: [],
		fn({userID}) {
			let suit  = random(":spades:",":hearts:",":diamonds:",":clovers:");
			let value = random('A',2,3,4,5,6,7,8,9,10,'J','Q','K');
			return `<@${userID}> drew **${value}${suit}**`;
		}
	},
	'coin': {
		aliases: ['flipcoin','coinflip','tosscoin','cointoss'],
		category: 'Fun',
		title: ':coin:',
		info: 'Flip a coin.',
		parameters: ['[rolls]'],
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
		info: 'Generic dice-roll command, specify number of sides and number of roles. Alternatively, use the XdXX format to roll a XX-sided die X times.',
		parameters: ['XdXX|sides','[rolls]'],
		fn({args, userID}) {
			var rolls, sides;
			try {
				;[,rolls,sides] = args[0].match(/^(\d+)d(\d+)$/);
			} catch (e) {
				;[sides,rolls] = args;
			}
			s = randomDistribution(sides, rolls);
			if (rolls == 1) {
				return `<@${userID}> rolled a **${s.findIndex(x=>!!x)+1}**`;
			} else {
				return `<@${userID}> ${s.map((x,i) => `${i+1}x${x}`).join(' + ')} = **${rollSum(s)}**`;
			}
		}
	},
	'random': {
		aliases: ['rand', 'rng'],
		category: 'Fun',
		info: 'Random',
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
