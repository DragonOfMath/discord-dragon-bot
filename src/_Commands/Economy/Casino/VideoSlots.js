const MessageGame = require('../../../Sessions/MessageGame');
const {Markdown:md,Format:fmt,tableify,random,Array} = require('../../../Utils');

const HIDDEN = ['❔','❔','❔'];

const SPIN = '🎰';
const FREE_SPIN = '🆓';
const BET_MULT_1 = '1⃣';
const BET_MULT_2 = '2⃣';
const BET_MULT_5 = '5⃣';
const BET_MULT_10 = '🔟';

const PAYLINES = [
	[0,0,0,0,0], // bar through first row
	[1,1,1,1,1], // bar through middle row
	[2,2,2,2,2], // bar through last row
	[0,1,2,1,0], // "V"
	[2,1,0,1,2], // chevron
	[0,0,1,2,2], // high to low
	[2,2,1,0,0], // low to high
];

const MULTIPLIER = {
	[BET_MULT_1]: 1,
	[BET_MULT_2]: 2,
	[BET_MULT_5]: 5,
	[BET_MULT_10]: 10
};

const TABLE = {
	'🐉': {
		value: [1,1,10,100,1000],
		count: 1
	},
	[SPIN]: {
		value: [1,1,7,77,777],
		count: 1,
	},
	'💎': {
		value: [1,1,5,50,500],
		count: 1
	},
	'😂': {
		value: [1,1,4,42,420],
		count: 1
	},
	'🤔': {
		value: [1,1,2,20,200],
		count: 1
	},
	'👌': {
		value: [1,1,1,15,150],
		count: 2
	},
	'💯': {
		value: [1,1,1,10,100],
		count: 2
	},
	'🍌': {
		value: [1,1,1,8,80],
		count: 2
	},
	'🍆': {
		value: [1,1,1,6.9,69], // Nice.
		count: 2
	},
	'🍉': {
		value: [1,1,1,3,10],
		count: 5
	},
	'🍇': {
		value: [1,1,1,3,10],
		count: 5
	},
	'🍒': {
		value: [1,1,1,3,10],
		count: 5
	},
	'🍈': {
		value: [1,1,1,3,10],
		count: 5
	},
	'💩': {
		value: [0,0,1,2,8],
		count: 6
	},
	[FREE_SPIN]: {
		value: [1,2,3,5,15],
		count: 2
	}
};

class SlotColumn {
	constructor(hidden = false) {
		this.items = [];
		for (var item in TABLE) {
			for (var i = 0; i < TABLE[item].count; i++) {
				this.items.push(item);
			}
		}
		var shuffleTimes = 3;
		while (shuffleTimes-- > 0) {
			for (var a = 0, b, temp; a < this.items.length; a++) {
				b = Math.floor(this.items.length * Math.random());
				temp = this.items[a];
				this.items[a] = this.items[b];
				this.items[b] = temp;
			}
		}
		this.offset = 0;
		this.hidden = hidden;
	}
	goto(item) {
		this.offset = this.items.indexOf(item) + (this.items.length - 1);
	}
	spin() {
		this.offset = Math.floor(this.items.length * Math.random());
	}
	get visible() {
		if (this.hidden) {
			return HIDDEN;
		} else {
			return [this.upper, this.selected, this.lower];
		}
	}
	get upper() {
		return this.items[(this.offset+0) % this.items.length];
	}
	get selected() {
		return this.items[(this.offset+1) % this.items.length];
	}
	get lower() {
		return this.items[(this.offset+2) % this.items.length];
	}
}

class VideoSlotMachine extends MessageGame {
	constructor(context, bank, bet = 0) {
		super(context, [context.user]);
		
		this.bank      = bank;
		this.bet       = bet;
		this.betMult   = 1;
		this.freeSpins = 0;
		this.init();
	}
	init() {
		super.init();
		this.game = [
			new SlotColumn(),
			new SlotColumn(),
			new SlotColumn(),
			new SlotColumn(),
			new SlotColumn()
		];
		
		let coolEmoji = random(TABLE);
		this.game.forEach(slot => slot.goto(coolEmoji));
		
		this.spinning = false;
		this.spinIdx  = 0;
		this.reward     = 0;
		this.rewardMult = 1;
		
		this.updateEmbed();
	}
	get totalBet() {
		return this.bet * this.betMult;
	}
	get totalReward() {
		return this.reward * this.rewardMult;
	}
	get status() {
		return null;
	}
	startMove(client) {
		if (this.spinning && this.spinIdx < this.game.length) {
			setTimeout(() => {
				if (this.closed) return;
				
				// spin the hidden columns, then reveal one
				let i = this.spinIdx;
				if (i >= this.game.length) return;
				while (i < this.game.length) this.game[i++].spin();
				this.game[this.spinIdx++].hidden = false;
				
				if (this.spinIdx == this.game.length) {
					this.finishMove();
				} else {
					this.updateEmbed();
				}
				this.edit(client);
			}, 1500);
		}
	}
	handlePlayerMove(reaction) {
		if (this.spinning) return false;
		if (reaction in MULTIPLIER) {
			this.betMult = MULTIPLIER[reaction];
			this.updateEmbed();
			return true;
		} else if (reaction == SPIN) {
			if (this.freeSpins) {
				this.betMult = 1; // cannot bet higher than 1x on free spins, for obvious reasons
				this.freeSpins--;
			} else {
				if (this.bank.credits < this.totalBet) {
					throw 'Insufficient funds to spin!';
				}
				this.emit('creditchange', -this.totalBet);
			}
			this.spin();
			return true;
		}
	}
	spin() {
		this.winner   = null;
		this.spinning = true;
		this.spinIdx  = 0;
		this.reward     = this.totalBet;
		this.rewardMult = 1;
		this.paylines = [];
		this.game.forEach(slot => {slot.hidden = true});
		this.updateEmbed();
	}
	checkWinCondition() {
		this.spinning = false;
		
		this.rewardMult = 0;
		
		let good = false, totalMult, amount, items, counts;
		for (let combo of PAYLINES) {
			items = this.game.map((col,i) => col.items[combo[i]]);
			counts = {};
			for (let item of items) {
				counts[item] = (counts[item] || 0) + 1;
			}
			totalMult = 1;
			for (let item in counts) {
				amount = TABLE[item].value[counts[item]-1];
				if (item == FREE_SPIN) {
					this.freeSpins += amount;
					good = true;
				} else {
					totalMult *= amount;
				}
			}
			if (totalMult > 1) {
				this.rewardMult += totalMult;
				good = true;
			}
		}
		
		this.emit('creditchange', this.totalReward);
		return good ? this.player : 'nobody';
	}
	toString() {
		let columnItems = this.game.map(c => c.visible);
		let rows = Array.transpose(columnItems);
		return rows.map(row => row.join(' | ')).join('\n');
	}
	updateEmbed() {
		super.updateEmbed();
		if (this.bet) {
			this.embed.fields.push({
				name: 'Bank',
				value: fmt.currency(this.bank.credits),
				//inline: true
			});
			
			this.embed.fields.push({
				name: 'Bet (Multiplier) | Free Spins',
				value: `${fmt.currency(this.bet)} (x${this.betMult}) | Free: ${this.freeSpins}`,
				inline: true
			});
			
			if (!this.spinning && this.totalReward) {
				this.embed.fields.push({
					name: 'Reward',
					value: `${fmt.currency(this.reward)} x${this.rewardMult} = ${md.bold(fmt.currency(this.totalReward))}`,
					inline: true
				});
			}
		}
		return this.embed;
	}
	static showPayoutTable() {
		let total = 0;
		for (let item in TABLE) {
			total += TABLE[item].count;
		}
		return tableify(['Item','Multipliers','Rarity'], Object.keys(TABLE), item => {
			return [
				item, // TODO: keep the emoji but align the other columns
				TABLE[item].value.map(x => 'x'+x).join('|'),
				fmt.percent(TABLE[item].count / total)
			].map(c => '`' + c + '`');
		});
	}
}

VideoSlotMachine.CONFIG = {
	gameType: MessageGame.CASUAL,
	displayName: 'Video Slot Machine',
	howToPlay: 'Just like slots but with 5 columns and several more ways to win per spin!',
	minPlayers: 1,
	maxPlayers: 1,
	minBotPlayers: 0,
	maxBotPlayers: 0,
	canRestart: true,
	interface: [SPIN,BET_MULT_1,BET_MULT_2,BET_MULT_5,BET_MULT_10]
};

module.exports = VideoSlotMachine;
