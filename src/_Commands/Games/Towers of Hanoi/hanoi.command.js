const TowerOfHanoi = require('./TowerOfHanoi');

module.exports = {
	'towers': {
		aliases: ['hanoi','towersofhanoi','towerofhanoi','toh'],
		category: 'Fun',
		title: 'Tower of Hanoi',
		info: 'Play the Tower of Hanoi minigame. The difficulty value is the number of blocks to stack.',
		parameters: ['[difficulty]'],
		permissions: 'inclusive',
		fn({client, context, user, args}) {
			let difficulty = isNaN(args[0]) ? 4 : args[0];
			let toh = new TowerOfHanoi(context, {difficulty});
			toh.startGame(client);
		}
	}
};
