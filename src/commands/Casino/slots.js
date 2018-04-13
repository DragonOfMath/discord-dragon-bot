const TABLE = {
	':dragon:': {
		value: [1,100,10000],
		count: 1
	},
	':gem:': {
		value: [1,90,1000],
		count: 1
	},
	':slot_machine:': {
		value: [7,77,777],
		count: 1
	},
	':joy:': {
		value: [1,42,420],
		count: 1
	},
	':thinking:': {
		value: [1,25,250],
		count: 2
	},
	':ok_hand:': {
		value: [1,50,150],
		count: 2
	},
	':100:': {
		value: [1,10,100],
		count: 3
	},
	':eggplant:': {
		value: [6,9,69], // Nice.
		count: 3
	},
	':banana:': {
		value: [1,16,40],
		count: 4
	},
	':watermelon:': {
		value: [1,12,35],
		count: 4
	},
	':grapes:': {
		value: [1,8,30],
		count: 4
	},
	':cherries:': {
		value: [1,6,25],
		count: 4
	},
	':melon:': {
		value: [1,5,20],
		count: 4
	},
	':poop:': {
		value: [0,0,5],
		count: 4
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
		return rows[0].join(' | ') + '\n' + rows[1].join(' | ') + ' <-\n' + rows[2].join(' | ');
	}
	toEmbed() {
		return {
			title: 'Slot Machine :slot_machine: - Bet = ' + this.bet,
			description: this.toString()
		};
	}
}

module.exports = SlotMachine;
