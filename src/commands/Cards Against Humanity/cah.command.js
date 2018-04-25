const Resource = require('../../Resource');
const {Markdown:md,random,tableify,paginate} = require('../../Utils');
const Packs = require('./cards_against_humanity.json');

class Pack {
	constructor(pack) {
		this.name = pack.name || 'Custom Pack';
		this.id   = pack.id   || 'custom';
		this.b = pack.b || [];
		this.w = pack.w || [];
	}
	get white() {
		return this.w.length;
	}
	get black() {
		return this.b.length;
	}
	get total() {
		return this.black + this.white;
	}
	get all() {
		return this.b.concat(this.w);
	}
	get cardCount() {
		return `${this.total} (${this.black}/${this.white})`;
	}
	getType(type) {
		switch (type) {
			case 'b':
			case 'black':
				return this.b;
			case 'w':
			case 'white':
				return this.w;
			default:
				return this.all;
		}
	}
	combine(pack) {
		return new Pack({
			b: this.b.concat(pack.b),
			w: this.w.concat(pack.w)
		});
	}
	hasBlack(card) {
		return this.b.includes(card);
	}
	hasWhite(card) {
		return this.w.includes(card);
	}
}

class CardsAgainstHumanity extends Resource {
	constructor(cah) {
		super({
			packs: [],
			custom: {
				b: [],
				w: []
			}
		}, cah);
	}
	addPack(pack) {
		if (this.packs.includes(pack)) {
			throw md.code(pack) + ' is already included.';
		}
		if (!(pack in Packs)) {
			throw md.code(pack) + ' is not a valid pack ID.';
		}
		this.packs.push(pack);
		return this;
	}
	removePack(pack) {
		if (!this.packs.includes(pack)) {
			throw md.code(pack) + ' was not included.';
		}
		if (!(pack in Packs)) {
			throw md.code(pack) + ' is not a valid pack ID.';
		}
		this.packs.splice(this.packs.indexOf(pack), 1);
		return this;
	}
	assemble() {
		var pack = new Pack(this.custom);
		for (var p of this.packs) {
			pack = pack.combine(Packs[p]);
		}
		return pack;
	}
	getBlackCard() {
		var cards = this.assemble().b;
		if (cards.length == 0) {
			throw 'No black cards. Add some packs or create custom black cards!';
		}
		return random(cards);
	}
	getWhiteCard(count) {
		var cards = this.assemble().w;
		if (!cards.length) {
			throw 'No white cards. Add some packs or create custom white cards!';
		}
		var picked = [];
		count = Math.min(count, 10); // avoid crashing the bot
		while (count-- > 0) {
			var c = random(cards.length);
			picked.push(cards[c]);
			cards.splice(c,1);
		}
		return picked;
	}
	addCustomCard(type, text) {
		this.custom[type].push(text);
	}
	removeCustomCard(type, id) {
		return this.custom[type].splice(id, 1)[0];
	}
	clearCustomCards(type) {
		if (type != 'b') this.custom.w = [];
		if (type != 'w') this.custom.b = [];
	}
	static resolveType(type) {
		switch (type.toLowerCase()) {
			case 'w':
			case 'white':
				return 'w';
				break;
			case 'b':
			case 'black':
				return 'b';
				break;
			default:
				throw 'Please specify whether you are making a __b__lack card or a __w__hite card.';
		}
	}
}

module.exports = {
	'cah': {
		aliases: ['cardsagainsthumanity'],
		category: 'Fun',
		title: 'Cards Against Humanity',
		info: 'Picks a random white answer card.',
		parameters: ['[count]'],
		fn({client, args, serverID}) {
			var count = ~~args[0] || 1;
			var server = client.database.get('servers').get(serverID);
			server.cah = new CardsAgainstHumanity(server.cah);
			try {
				var cardsChosen = server.cah.getWhiteCard(count);
				return {
					title: 'White Card',
					color: 0xFFFFFF,
					description: cardsChosen.join('\n----\n')
				};
			} catch (e) {
				return e;
			}
		},
		subcommands: {
			'black': {
				aliases: ['b'],
				title: 'Cards Against Humanity',
				info: 'Picks a random black template card.',
				fn({client, serverID}) {
					var server = client.database.get('servers').get(serverID);
					server.cah = new CardsAgainstHumanity(server.cah);
					try {
						var card = server.cah.getBlackCard();
						return {
							title: 'Black Card',
							color: 0,
							description: card.replace(/_/g, '\\_') // to prevent markdown formatting
						};
					} catch (e) {
						return e;
					}
				}
			},
			'packs': {
				aliases: ['list','listpacks'],
				title: 'Cards Against Humanity',
				info: 'Lists CAH Packs by Name, ID, and Count (Black/White). Bolded packs are in use on the server.',
				fn({client, args, serverID}) {
					var server = client.database.get('servers').get(serverID);
					server.cah = new CardsAgainstHumanity(server.cah);
					var serverPack = new Pack(server.cah.custom);
					var totalPack = new Pack({});
					var embed = tableify(['Pack Name','ID','Cards (B/W)'],Object.keys(Packs), function (id) {
						var pack = new Pack(Packs[id]);
						var r = [pack.name,id,pack.cardCount];
						if (server.cah.packs.includes(id)) {
							totalPack = totalPack.combine(pack);
							r = r.map(md.bold);
						}
						return r;
					});
					embed.fields.push({
						name: 'Server Packs',
						value: server.cah.packs.length,
						inline: true
					});
					embed.fields.push({
						name: 'Custom Cards',
						value: serverPack.cardCount,
						inline: true
					});
					embed.fields.push({
						name: 'Total Cards',
						value: md.bold(totalPack.combine(serverPack).cardCount),
						inline: true
					});
					embed.title = 'Pack List';
					embed.footer = {text: 'Bolded packs are in use on this server.'};
					return embed;
				}
			},
			'add': {
				aliases: ['use','pack','usepack'],
				title: 'Cards Against Humanity | Add Pack',
				info: 'Choose card packs to use for this server. See `cah.packs` for a list of pack codes (online packs cannot be added).',
				parameters: ['...packIDs'],
				fn({client, args, serverID}) {
					var info = '';
					client.database.get('servers').modify(serverID, server => {
						server.cah = new CardsAgainstHumanity(server.cah);
						for (var pack of args) {
							pack = pack.toLowerCase();
							try {
								server.cah.addPack(pack);
								info += md.code(pack) + ' added.';
							} catch (e) {
								info += e;
							} finally {
								info += '\n';
							}
						}
						return server;
					}).save();
					return info;
				}
			},
			'remove': {
				aliases: ['unuse','unpack','unusepack'],
				title: 'Cards Against Humanity | Remove Pack',
				info: 'Remove card packs from use on this server. See `cah.packs` for a list of pack codes.',
				parameters: ['...packIDs'],
				fn({client, args, serverID}) {
					var info = '';
					client.database.get('servers').modify(serverID, server => {
						server.cah = new CardsAgainstHumanity(server.cah);
						for (var pack of args) {
							pack = pack.toLowerCase();
							try {
								server.cah.removePack(pack);
								info += md.code(pack) + ' removed.';
							} catch (e) {
								info += e;
							} finally {
								info += '\n';
							}
						}
						return server;
					}).save();
					return info;
				}
			},
			'customcards': {
				aliases: ['customlist'],
				title: 'Cards Against Humanity | Custom Card List',
				info: 'Lists the custom cards for the server.',
				parameters: ['[page]', '[<w|white|b|black>]'],
				fn({client, args, serverID}) {
					var page = Number(args[0]);
					if (isNaN(page)) {
						page = 1;
					} else {
						args.splice(0,1);
					}
					var type = args[0] ? args[0].toLowerCase() : 'all';
					var server = client.database.get('servers').get(serverID);
					server.cah = new CardsAgainstHumanity(server.cah);
					var pack = new Pack(server.cah.custom);
					var cards = pack.getType(type);
					return paginate(cards, page, 20, function(a,i) {
						return {
							name: (pack.hasBlack(cards[i]) ? 'Black Card' : 'White Card') + (' #' + i),
							value: a[i]
						};
					});
				}
			},
			'new': {
				aliases: ['make','create','custom'],
				title: 'Cards Against Humanity | Custom Card',
				info: 'Create a new white or black card to use on the server.',
				parameters: ['<w|white|b|black>', '...text'],
				fn({client, args, serverID}) {
					var type = CardsAgainstHumanity.resolveType(args[0]);
					var text = args.slice(1).join(' ');
					client.database.get('servers').modify(serverID, server => {
						server.cah = new CardsAgainstHumanity(server.cah);
						server.cah.addCustomCard(type, text);
						return server;
					}).save();
					return (type == 'b' ? 'Black' : 'White') + ' card saved as ' + md.code(text);
				}
			},
			'remove': {
				aliases: ['delete'],
				title: 'Cards Against Humanity | Remove Custom Card',
				info: 'Remove a single custom card from this server.',
				parameters: ['<w|white|b|black>', 'id'],
				fn({client, args, serverID}) {
					var cardRemoved;
					var type = CardsAgainstHumanity.resolveType(args[0]);
					var id = args[1];
					client.database.get('servers').modify(serverID, server => {
						server.cah = new CardsAgainstHumanity(server.cah);
						cardRemoved = server.cah.removeCustomCard(type, id);
						if (!cardRemoved) {
							throw 'Invalid card ID: ' + id;
						}
						return server;
					}).save();
					return (type == 'b' ? 'Black' : 'White') + ' card removed: ' + md.code(cardRemoved);
				}
			},
			'clear': {
				aliases: ['reset'],
				title: 'Cards Against Humanity | Clear Custom Cards',
				info: 'Clears all custom white/black cards for this server. Can choose a type of card, otherwise all are cleared.',
				parameters: ['[<w|white|b|black>]'],
				fn({client, args, serverID}) {
					var type = CardsAgainstHumanity.resolveType(args[0]);
					client.database.get('servers').modify(serverID, server => {
						server.cah = new CardsAgainstHumanity(server.cah);
						server.cah.clearCustomCards(type);
						return server;
					}).save();
					return (type != 'w' ? 'All Black' : type != 'b' ? 'All White' : 'All') + ' cards for this server cleared.';
				}
			}
		}
	}
};
