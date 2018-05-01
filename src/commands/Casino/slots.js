const {Format:fmt,tableify} = require('../../Utils');

const TABLE = {
	':dragon:': {
		value: [5,200,10000],
		count: 1
	},
	':gem:': {
		value: [2,50,2500],
		count: 1
	},
	':slot_machine:': {
		value: [7,77,777],
		count: 1
	},
	':eggplant:': {
		value: [6.9,69,690], // Nice.
		count: 1
	},
	':ok_hand:': {
		value: [1,50,500],
		count: 2
	},
	':joy:': {
		value: [1,42,420],
		count: 2
	},
	':thinking:': {
		value: [1,24,400],
		count: 2
	},
	':banana:': {
		value: [1,10,350],
		count: 4
	},
	':watermelon:': {
		value: [1,5,300],
		count: 4
	},
	':grapes:': {
		value: [1,5,300],
		count: 4
	},
	':cherries:': {
		value: [1,5,300],
		count: 4
	},
	':melon:': {
		value: [1,5,300],
		count: 4
	},
	':100:': {
		value: [1,10,100],
		count: 5
	},
	':poop:': {
		value: [0,0,200],
		count: 5
	}
};
const HIDDEN = [':grey_question:',':grey_question:',':grey_question:'];

class SlotColumn {
	constructor(hidden) {
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

class SlotMachine {
	constructor(bet) {
		this.bet = bet;
		this.columns = [
			new SlotColumn(true),
			new SlotColumn(true),
			new SlotColumn(true)
		];
	}
	spin(i = 0) {
		while (i < 3) this.columns[i++].spin();
	}
	calculateMultiplier() {
		var items = this.columns.map(c => c.selected);
		var counts = {};
		for (var item of items) {
			counts[item] = (counts[item] || 0) + 1;
		}
		var multiplier = 1;
		for (var item in counts) {
			multiplier *= TABLE[item].value[counts[item]-1];
		}
		if (multiplier === 1) {
			multiplier = 0;
		}
		return multiplier;
	}
	toString() {
		var columnItems = this.columns.map(c => c.visible);
		var rows = columnItems.map((x,i) => columnItems.map(c => c[i]));
		return rows[0].join(' | ') + '\n' + rows[1].join(' | ') + ' :point_left:\n' + rows[2].join(' | ');
	}
	toEmbed() {
		return {
			title: 'Slot Machine :slot_machine: - Bet = ' + this.bet,
			description: this.toString()
		};
	}
	static showPayoutTable() {
		var total = 0;
		for (var item in TABLE) {
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

module.exports = SlotMachine;
