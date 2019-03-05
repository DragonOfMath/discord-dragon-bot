const Asset = require('../../Structures/Asset');
const {Markdown:md,Format:fmt,fetch,strcmp} = require('../../Utils');
const Currency = Asset.load('Text/currency.json');

function resolveCurrency(id) {
	for (let ID in Currency) {
		if (strcmp(ID, id) || strcmp(Currency[ID].currencyName, id) || strcmp(Currency[ID].currencySymbol, id)) {
			return Currency[ID];
		}
	}
	return null;
}

module.exports = {
	'currency': {
		category: 'Economy',
		title: ':currency_exchange: Currency Converter',
		info: 'Convert an amount from any currency to another. Default target currency is USD.',
		parameters: ['amount','from','[to]'],
		permissions: 'inclusive',
		fn({client, args}) {
			let [amount, from, to = 'usd'] = args;
			amount = Number(amount);
			if (isNaN(amount) || amount < 0) {
				throw 'Invalid amount.';
			}
			from = resolveCurrency(from);
			if (!from) {
				throw 'Invalid source currency: ' + from;
			}
			to = resolveCurrency(to);
			if (!to) {
				throw 'Invalid target currency: ' + to;
			}
			
			// use this API (restricted to 100 uses per hour, sadly)
			let q = `${from.id}_${to.id}`;
			return fetch('https://free.currencyconverterapi.com/api/v6/convert', {json: true, qs: {q, compact: 'ultra'}})
			.then(conversion => {
				// value returned is the equivalent amount of 1 unit of the source currency
				let result = amount * conversion[q];
				return fmt.currency(amount, from.currencySymbol || from.id, 2) + ' ↔ ' + md.bold(fmt.currency(result, to.currencySymbol || to.id, 2));
			});
		}
	}
};