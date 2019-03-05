const Bank      = require('../../Bank/Bank');
const Constants = require('../../Constants/Pokemon');
const Asset     = require('../../Structures/Asset');
const {Markdown:md,Format:fmt,tableify} = require('../../Utils');

const PokeError       = require('./PokeError');
const PokemonItemList = Asset.require('Pokemon/items.json');

class PokeShop {
	static displayInventory() {
		let fields = {};
		for (let item of PokemonItemList) {
			(fields[item.title] || (fields[item.title] = [])).push([item.name, md.bold(fmt.currency(item.value,'$',1))]);
		}
		let e = tableify(['Item','Price'], Object.keys(fields), function (name) {
			return [
				md.bold(name) + '\n' + fields[name].map(i => i[0]).join('\n'),
				'----'        + '\n' + fields[name].map(i => i[1]).join('\n')
			];
		});
		e.title = 'PokéShop Inventory';
		e.color = Constants.COLOR;
		return e;
	}
	static displayItemInfo(item) {
		item = this.getItem(item);
		if (!item) {
			throw 'Invalid item.';
		}
		return {
			title: 'PokéShop Item Info',
			color: Constants.COLOR,
			fields: [
				{
					name: 'Name',
					value: item.name,
					inline: true
				},
				{
					name: 'ID',
					value: item.id,
					inline: true
				},
				{
					name: 'Type',
					value: item.type,
					inline: true
				},
				{
					name: 'Description',
					value: item.info,
					inline: true
				},
				{
					name: 'Value',
					value: fmt.currency(item.value),
					inline: true
				}
			]
		};
	}
	static buy(pkmn, bank, itemname, quantity = 1) {
		let item = this.getItem(itemname);
		if (!item) {
			throw `Shop inventory does not have a "${itemname}"!`;
		}
		quantity = Number(quantity);
		if (isNaN(quantity) || quantity < 1) {
			throw `Please specify how many items you wish to buy (1 or more).`;
		}
		let total = item.value * quantity;
		if (bank.credits < total) {
			throw md.italics(`Insufficient funds for purchase: Overdraw of ${fmt.currency(bank.credits-total)}`);
		}
		
		bank.changeCredits(-total);
		//let msg = bank.withdraw(total);
		pkmn.addItem(item, quantity);
		return `You bought ${md.bold(fmt.plural(item.name,quantity))} for ${Bank.formatCredits(total)}!`;
	}
	static sell(pkmn, bank, itemname, quantity = 1) {
		let item = this.getItem(itemname);
		if (!item) {
			throw `Shop inventory does not have a "${itemname}"!`;
		}
		quantity = Number(quantity);
		if (isNaN(quantity) || quantity < 1) {
			throw `Please specify how many items you wish to sell (1 or more).`;
		}
		if ((pkmn.items[item.id]||0) < quantity) {
			throw `You cannot sell ${quantity} when you only have ${pkmn.items[item.id]||0}!`;
		}
		
		let total = (item.value / 2) * quantity;
		bank.changeCredits(total);
		//let msg = bank.deposit(total);
		pkmn.removeItem(item, quantity);
		return `You sold ${md.bold(fmt.plural(item.name,quantity))} for ${Bank.formatCredits(total)}!`;
	}
	static getItem(itemID) {
		if (isNaN(itemID)) {
			itemID = PokemonItemList.findIndex(item => strcmp(item.name,itemID) || strcmp(item.id,itemID));
		}
		return PokemonItemList[itemID];
	}
}

module.exports = PokeShop;
