const Bank = require('../../../Bank/Bank');
const Session = require('../../../Sessions/Session');
const ListMessageBrowser = require('../../../Sessions/ListMessageBrowser');
const ContentMessageBrowser = require('../../../Sessions/ContentMessageBrowser');
const SelectionMessageBrowser = require('../../../Sessions/SelectionMessageBrowser');
const {Markdown:md,Format:fmt,random,strcmp} = require('../../../Utils');

const TAX = 0.1;
const WATER_PRICE_MULT = 0.25;
const SODA_PRICE_MULT = 0.5;
const COMBO_DISCOUNT = 0.2;
const COMBO_LIMIT = 5;

const DRINK_FLAVORS = [
	'Coke',
	'Pepsi',
	'Sprite',
	'Root Beer',
	'Dr. Pepper',
	'Mtn Dew',
	'Lemonade',
	'Iced Tea',
	'Coffee',
	'Water'
];
const DRINK_SIZES = [
	'small',
	'medium',
	'large',
	'extra large'
];
const DRINK_SIZE_OZ = {
	'small': 8,
	'medium': 16,
	'large': 24,
	'extra large': 32,
	8: 8,
	16: 16,
	24: 24,
	32: 32
};
const DRINK_PRODUCTION_TIME = 15000;
const INVOICE_WIDTH = 40;

function priceTag(price) {
	return '$' + price.toFixed(1);
}
function invoiceLine(item, value, notPrice) {
	let str = item, priceStr = notPrice ? String(value) : priceTag(value);
	if (str.length % 2) str += ' ';
	str += '.'.repeat(INVOICE_WIDTH - (str.length + priceStr.length + 1)) + ' ';
	str += priceStr;
	return str;
}
function invoiceCenter(str) {
	let padding = ' '.repeat(Math.floor((INVOICE_WIDTH - str.length) / 2));
	return padding + str;
}

class Food {
	constructor(name, price, time) {
		this.name  = name;
		this.price = price;
		this.time  = time;
	}
	get originalPrice() {
		return this.price;
	}
	get quantity() {
		return 1;
	}
	toString(excludePrice = false) {
		return this.name + (!excludePrice ? ' ' + md.bold(priceTag(this.price)) : '');
	}
	toInvoiceString() {
		return invoiceLine(this.name, this.price);
	}
}
class Drink {
	constructor(flavor, size = 'small') {
		this.flavor = flavor;
		this._size  = size; // small, medium, large, extra large
	}
	get size() {
		return DRINK_SIZE_OZ[this._size] || 0;
	}
	set size(size) {
		for (let sz in DRINK_SIZE_OZ) {
			if (sz == size || DRINK_SIZE_OZ[sz] == size) {
				this._size == sz;
				break;
			}
		}
	}
	get quantity() {
		return 1;
	}
	get originalPrice() {
		return this.price;
	}
	get price() {
		return (this.flavor == 'Water' ? WATER_PRICE_MULT : SODA_PRICE_MULT) * this.size;
	}
	get name() {
		let str = this.flavor;
		switch (this._size) {
			case 'small':
				str += ' sm.';
				break;
			case 'medium':
				str += ' md.';
				break;
			case 'large':
				str += ' lg.';
				break;
			case 'extra large':
				str += ' xl.';
				break;
		}
		return str;
	}
	toString(excludePrice = false) {
		return this.name + (!excludePrice ? ' ' + md.bold(priceTag(this.price)) : '');
	}
	toInvoiceString() {
		return invoiceLine(this.name, this.price);
	}
}
class Combo {
	constructor(food, side, drink) {
		this.food  = food;
		this.side  = side;
		this.drink = drink;
	}
	get quantity() {
		return (this.food ? 1 : 0) + (this.side ? 1 : 0) + (this.drink ? 1 : 0);
	}
	get isDiscountable() {
		return this.food && this.side && this.drink;
	}
	get originalPrice() {
		return (this.food  ? this.food.price  : 0)
		     + (this.side  ? this.side.price  : 0)
			 + (this.drink ? this.drink.price : 0);
	}
	get price() {
		let price = this.originalPrice;
		if (this.isDiscountable) {
			price *= 1 - COMBO_DISCOUNT;
		}
		return price;
	}
	get time() {
		return (this.food  ? this.food.time : 0)
		     + (this.side  ? this.side.time : 0)
		     + (this.drink ? DRINK_PRODUCTION_TIME : 0);
	}
	toString(excludePrice = false) {
		if (this.isDiscountable) {
			return this.food.name + ' Combo'
			+ (!excludePrice ? ' ' + md.bold(priceTag(this.price)) : '')
			+ '\n + ' + this.side.name
			+ '\n + ' + this.drink.name;
		} else {
			let str = '';
			if (this.food) {
				str += this.food.toString(excludePrice) + '\n';
			}
			if (this.side) {
				str += this.side.toString(excludePrice) + '\n';
			}
			if (this.drink) {
				str += this.drink.toString(excludePrice) + '\n';
			}
			return str.trim();
		}
	}
	toInvoiceString() {
		if (this.isDiscountable) {
			return invoiceLine(this.food.name + ' Combo', this.price)
			+ '\n  ' + this.food.name
			+ '\n  ' + this.side.name
			+ '\n  ' + this.drink.name;
		} else {
			let str = '';
			if (this.food) {
				str += this.food.toInvoiceString() + '\n';
			}
			if (this.side) {
				str += this.side.toInvoiceString() + '\n';
			}
			if (this.drink) {
				str += this.drink.toInvoiceString() + '\n';
			}
			return str.trim();
		}
	}
}
class Order {
	constructor(restaurant) {
		this.id = Date.now().toString().substr(-4);
		this.items = [];
		this.restaurant = restaurant;
		this.confirmed = false;
		this.deliveryTime = 0;
		
		// cached values
		this._quantity = 0;
		this._totalPrice = 0;
		this._totalOriginalPrice = 0;
		this._totalProductionTime = 0;
	}
	get quantity() {
		if (this.confirmed) return this._quantity;
		return this.items.reduce((count, item) => count + item.quantity, 0);
	}
	get totalPrice() {
		if (this.confirmed) return this._totalPrice;
		return this.items.reduce((total, item) => total + item.price, 0);
	}
	get totalOriginalPrice() {
		if (this.confirmed) return this._totalOriginalPrice;
		return this.items.reduce((total, item) => total + item.originalPrice, 0);
	}
	get totalProductionTime() {
		if (this.confirmed) return this._totalProductionTime;
		return this.items.reduce((total, item) => total + item.time, 0);
	}
	getInvoice() {
		let subtotal = this.totalPrice;
		let tax = subtotal * TAX;
		let total = subtotal + tax;
		let savings = this.totalOriginalPrice - subtotal;
		return {subtotal, tax, total, savings};
	}
	confirm() {
		this._quantity = this.quantity;
		this._totalPrice = this.totalPrice;
		this._totalOriginalPrice = this.totalOriginalPrice;
		this._totalProductionTime = this.totalProductionTime;
		this.deliveryTime = random(5,15) * 60000;
		this.confirmed = true;
	}
	toString(excludePrice = false) {
		return this.items.map(item => item.toString(excludePrice)).join('\n');
	}
	toInvoiceString() {
		return this.items.map(item => item.toInvoiceString()).join('\n');
	}
}
class Restaurant {
	constructor(name, logo, mainFoodItems, sideItems, customDrinks) {
		this.name = name;
		this.logo = logo;
		this.menu = {
			main: mainFoodItems,
			sides: sideItems,
			drinks: customDrinks
		};
	}
	toString() {
		return this.name;
	}
	embed() {
		return {
			description: md.bold(this.name),
			thumbnail: (this.logo ? { url: this.logo } : null),
			fields: [{
				name: 'Entrées',
				value: this.menu.main.map(food => food.toString()).join('\n'),
				inline: true
			},{
				name: 'Sides',
				value: this.menu.sides.map(food => food.toString()).join('\n'),
				inline: true
			},{
				name: 'Drinks',
				value: (this.menu.drinks ? this.menu.drinks.map(d => d.toString()) : DRINK_FLAVORS).join(', '),
				inline: true
			}]
		};
	}
}

const RESTAURANTS = [
	new Restaurant('McDonald\'s', 'https://pbs.twimg.com/profile_images/1150268408287698945/x4f3ITmx_400x400.png', [
		new Food('Deluxe Quarter Pounder', 40, 180000),
		new Food('Big Mac', 35, 120000),
		new Food('McChicken', 25, 80000),
		new Food('Cheeseburger', 20, 70000),
		new Food('Chicken McNuggets', 15, 60000)
	],[
		new Food('Small Fries', 10, 45000),
		new Food('Medium Fries', 16, 60000),
		new Food('Large Fries', 24, 75000),
		new Food('Salad', 8, 30000)
	]),
	new Restaurant('Burger King', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Burger_King_Logo.svg/1200px-Burger_King_Logo.svg.png', [
		new Food('Deluxe Whopper', 45, 240000),
		new Food('Whopper', 32, 180000),
		new Food('Burger', 24, 120000),
		new Food('Chicken Tenders', 16, 80000)
	],[
		new Food('Small Fries', 10, 45000),
		new Food('Medium Fries', 16, 60000),
		new Food('Large Fries', 24, 75000),
		new Food('Salad', 8, 30000)
	]),
	new Restaurant('Pizza Hut', 'https://vignette.wikia.nocookie.net/logopedia/images/d/d3/Pizza_Hut_2010.png/revision/latest?cb=20190627174535', [
		new Food('Cheese Pizza', 60, 600000),
		new Food('Pepperoni Pizza', 65, 630000),
		new Food('Supreme Pizza', 75, 720000),
		new Food('Deepdish Pizza', 70, 700000),
		new Food('Dessert Pizza', 90, 1080000)
	],[
		new Food('Cheesebread', 30, 120000),
		new Food('Breadsticks', 20, 60000),
		new Food('Hot Wings', 24, 80000),
		new Food('Mild Wings', 24, 75000),
	]),
	new Restaurant('Taco Bell', 'https://1000logos.net/wp-content/uploads/2017/06/Taco-Bell-Logo.png', [
		new Food('Burrito', 20, 60000),
		new Food('Quesadilla', 20, 60000),
		new Food('6 Tacos', 18, 60000),
		new Food('6 Doritos Locos:tm: Tacos', 24, 72000)
	],[
		new Food('Nacho Fries', 15, 32000),
		new Food('Nachos', 10, 30000),
		new Food('Salad', 8, 15000),
		new Food('Cinnabons', 12, 24000)
	])/*,
	new Restaurant('IHOP'),
	new Restaurant('Sonic', ),
	new Restaurant('KFC'),
	new Restaurant('Chipotle'),
	new Restaurant('Starbucks')*/
];

const PAGE_RESTAURANT = 0;
const PAGE_ORDER = 1;
const PAGE_COMBO = 2;
const PAGE_FOOD  = 3;
const PAGE_SIDE  = 4;
const PAGE_DRINK_FLAVOR = 5;
const PAGE_DRINK_SIZE = 6;
const PAGE_CONFIRM = 10;

const PLACEHOLDER_COMBO = 'Add Combo...';
const PLACEHOLDER_FOOD = 'Add Food...';
const PLACEHOLDER_SIDE = 'Add Side...';
const PLACEHOLDER_DRINK = 'Add Drink...';
const TEXT_CONFIRM = 'Done';
const TEXT_CANCEL  = 'Cancel';
const TEXT_REMOVE  = 'Remove';

const CONFIRM = '✅';
const CANCEL  = '❎';

class FoodSelector extends SelectionMessageBrowser {
	constructor(context) {
		super(context);
		
		this.on('update', async (client) => {
            if(this.order && this.order.confirmed) {
                await this.clearReactions(client);
                return this.close(client);
            }
        });
		
		this.init();
	}
	get isEditingCombo() {
		return this.order && this.combo && this.order.items.includes(this.combo);
	}
	init() {
		super.init();
		this.restaurant = null;
		this.order      = null;
		this.combo      = null;
		this.invoice    = null;
		this.page_selectRestaurant();
		this.updateEmbed();
	}
	handleOK(context) {
		if (this.selected == TEXT_CONFIRM) {
			return this.handleConfirm(context);
		} else if (this.selected == TEXT_CANCEL) {
			return this.handleCancel(context);
		} else if (this.selected == TEXT_REMOVE) {
			return this.handleRemove(context);
		} else switch (this.menu) {
			case PAGE_RESTAURANT:
				this.restaurant = this.selected;
				this.page_previewOrder();
				break;
			case PAGE_ORDER:
				this.combo = (this.selected == PLACEHOLDER_COMBO) ? new Combo() : this.selected;
				this.page_editCombo();
				break;
			case PAGE_COMBO:
				switch (this.selectedIdx) {
					case 0:
						this.page_addComboFood();
						break;
					case 1:
						this.page_addComboSide();
						break;
					case 2:
						this.page_addComboDrink1();
						break;
				}
				break;
			case PAGE_FOOD:
				this.combo.food = this.selected;
				this.page_editCombo(1);
				break;
			case PAGE_SIDE:
				this.combo.side = this.selected;
				this.page_editCombo(2);
				break;
			case PAGE_DRINK_FLAVOR:
				if (!this.combo.drink) this.combo.drink = new Drink();
				this.combo.drink.flavor = this.selected;
				this.page_addComboDrink2();
				break;
			case PAGE_DRINK_SIZE:
				this.combo.drink._size = this.selected;
				this.page_editCombo(4);
				break;
		}
		return true;
	}
	async handleCustomAction(context) {
		if (context.change > 0) {
			await this.removeReaction(context.client, context.reaction, context.userID);
		} else {
			return false;
		}
		switch (context.reaction) {
			case CONFIRM:
				return this.handleConfirm(context);
			case CANCEL:
				return this.handleCancel(context);
			default:
				return false;
		}
	}
	handleConfirm(context) {
		switch (this.menu) {
			case PAGE_ORDER:
				return this.confirmOrder(context);
			case PAGE_COMBO:
				if (!this.isEditingCombo) {
					this.order.items.push(this.combo);
					this.combo = null;
				}
				this.page_previewOrder();
				return true;
		}
	}
	handleCancel(context) {
		switch (this.menu) {
			case PAGE_ORDER:
				this.page_selectRestaurant();
				break;
			case PAGE_COMBO:
				this.combo = null;
				this.page_previewOrder();
				break;
			case PAGE_FOOD:
				this.page_editCombo();
				break;
			case PAGE_SIDE:
				this.page_editCombo();
				break;
			case PAGE_DRINK_FLAVOR:
				this.page_editCombo();
				break;
			case PAGE_DRINK_SIZE:
				if (!this.combo.drink.size) {
					this.combo.drink = null;
				}
				this.page_editCombo();
				break;
		}
		return true;
	}
	handleRemove(context) {
		switch (this.menu) {
			case PAGE_COMBO:
				let idx = this.order.items.indexOf(this.combo);
				this.order.items.splice(idx, 1);
				this.page_previewOrder();
				break;
			case PAGE_FOOD:
				this.combo.food = null;
				this.page_editCombo();
				break;
			case PAGE_SIDE:
				this.combo.side = null;
				this.page_editCombo();
				break;
			case PAGE_DRINK_FLAVOR:
			case PAGE_DRINK_SIZE:
				this.combo.drink = null;
				this.page_editCombo();
				break;
		}
		return true;
	}
	setMenu(menu, idx = 0) {
		this.menu = menu;
		this.selectedIdx = idx;
		this.error = '';
	}
	page_selectRestaurant() {
		this.setMenu(PAGE_RESTAURANT);
		this.data = RESTAURANTS;
		this.restaurant = null;
		this.order = null;
		this.combo = null;
	}
	page_previewOrder() {
		this.setMenu(PAGE_ORDER);
		if (!this.order) this.order = new Order(this.restaurant);
		this.data = [
			...this.order.items,
			TEXT_CONFIRM
		];
		if (this.order.items.length < COMBO_LIMIT) {
			this.data.unshift(PLACEHOLDER_COMBO);
		}
		this.combo  = null;
	}
	page_editCombo(idx = 0) {
		this.setMenu(PAGE_COMBO, idx);
		this.data = [
			this.combo.food  || PLACEHOLDER_FOOD,
			this.combo.side  || PLACEHOLDER_SIDE,
			this.combo.drink || PLACEHOLDER_DRINK,
			this.isEditingCombo ? TEXT_REMOVE : TEXT_CANCEL,
			TEXT_CONFIRM
		];
	}
	page_addComboFood() {
		this.setMenu(PAGE_FOOD);
		this.data = [
			...this.restaurant.menu.main,
			this.combo.food ? TEXT_REMOVE : TEXT_CANCEL
		];
	}
	page_addComboSide() {
		this.setMenu(PAGE_SIDE);
		this.data = [
			...this.restaurant.menu.sides,
			this.combo.side ? TEXT_REMOVE : TEXT_CANCEL
		];
	}
	page_addComboDrink1() {
		this.setMenu(PAGE_DRINK_FLAVOR);
		this.data = [
			...this.restaurant.menu.drinks || DRINK_FLAVORS,
			this.combo.drink ? TEXT_REMOVE : TEXT_CANCEL
		];
	}
	page_addComboDrink2() {
		this.setMenu(PAGE_DRINK_SIZE);
		this.data = [
			...DRINK_SIZES,
			TEXT_CANCEL
		];
	}
	confirmOrder(context) {
		if (!this.restaurant) {
			this.error = 'You need to select a restaurant first!';
			return true;
		}
		if (!this.order.items.length) {
			this.error = 'You need to order food first!';
			return true;
		}
		let client = context.client, userID = context.userID;
		let invoice = this.order.getInvoice();
		try {
			client.bank.withdraw(client, userID, invoice.total);
		} catch (e) {
			this.error = 'You do not have enough credits for this order!\n' + e;
			return true;
		}
		this.invoice = invoice;
		this.order.confirm();
		client.sessions.start(new PendingOrder(context, this.order));
		this.setMenu(PAGE_CONFIRM);
		return true;
	}
	updateEmbed() {
		super.updateEmbed();
		if (this.menu == PAGE_CONFIRM) {
			let receipt = '', line = '-'.repeat(INVOICE_WIDTH);
			receipt += invoiceCenter(this.restaurant.name + ' for Discord') + '\n';
			receipt += invoiceCenter('ORDER #' + this.order.id) + '\n';
			receipt += line + '\n';
			receipt += this.order.toInvoiceString() + '\n';
			receipt += line + '\n';
			receipt += invoiceLine('QUANTITY', this.order.quantity, true) + '\n';
			receipt += invoiceLine('SAVINGS',  this.invoice.savings) + '\n';
			receipt += invoiceLine('SUBTOTAL', this.invoice.subtotal) + '\n';
			receipt += invoiceLine(fmt.percent(TAX,0) + ' TAX', this.invoice.tax) + '\n';
			receipt += line + '\n';
			receipt += invoiceLine('TOTAL', this.invoice.total);
			
			//receipt = receipt.toUpperCase();
			
			this.embed.color = 0x00FF00;
			this.embed.title = 'Here is your receipt...';
			this.embed.description = md.codeblock(receipt);
			this.embed.timestamp = new Date();
			this.embed.footer = {
				text: 'Thank you! Your food will be ready in '
				+ fmt.time(this.order.totalProductionTime)
				+ ' and will be delivered in '
				+ fmt.time(this.order.deliveryTime)
				+ ' afterwards.'
			};
		} else {
			this.embed.fields = [];
			if (this.order) {
				this.embed.fields.push({
					name: 'Your Order',
					value: this.menu == PAGE_ORDER ? this.toString() : (this.order.toString() || '...'),
					inline: true
				});
				if (this.menu > PAGE_ORDER) {
					this.embed.fields.push({
						name: 'Make a Combo',
						value: this.menu == PAGE_COMBO ? this.toString() : (this.combo.toString() || '...'),
						inline: true
					});
					let title;
					switch (this.menu) {
						case PAGE_FOOD:
							title = 'Pick an Entrée';
							break;
						case PAGE_SIDE:
							title = 'Pick a Side';
							break;
						case PAGE_DRINK_FLAVOR:
							title = 'Pick a Drink';
							break;
						case PAGE_DRINK_SIZE:
							title = 'Pick a Drink Size';
							break;
					}
					if (title) {
						this.embed.fields.push({
							name: title,
							value: this.toString(),
							inline: true
						});
					}
				}
			} else {
				this.embed.fields.push({
					name: 'Select a Restaurant',
					value: this.toString()
				});
			}
			if (this.error) {
				this.embed.color = 0xFF0000;
				this.embed.fields.push({
					name: 'Error!',
					value: this.error
				});
			}
		}
		
		return this.embed;
	}
}
FoodSelector.CONFIG = {
	displayName: 'Order Food',
	interface: [CONFIRM,CANCEL]
};

class FoodMenu extends ContentMessageBrowser {
	constructor(context) {
		super(context, RESTAURANTS);
		this.init();
		this.updateEmbed();
	}
	mapItem(item) {
		return item.embed();
	}
	static getMenu(context, restaurant) {
		if (restaurant) {
			restaurant = RESTAURANTS.find(R => strcmp(R,restaurant));
			if (restaurant) {
				return restaurant.embed();
			} else {
				throw 'Restaurant menu not found.';
			}
		} else {
			return new FoodMenu(context);
		}
	}
}
FoodMenu.CONFIG = {
	displayName: 'Restaurant Menus',
	canSort: false,
	interface: []
};

class PendingOrder extends Session {
	constructor(context, order) {
		super({
			id: `order-${Date.now()}-${context.user.id}`,
			category: 'food',
			data: {order},
			settings: {
				expires: order.totalProductionTime + order.deliveryTime,
				silent: false
			},
			permissions: {
				type: 'inclusive',
				servers: {
					[context.server.id]: {
						channels: [context.channel.id],
						users: [context.user.id]
					}
				}
			},
			events: {
				goodbye() {
					return this.embed();
				}
			}
		});
		this.customerID = context.userID;
	}
	get prepared() {
		return this.elapsed >= this.data.order.totalProductionTime;
	}
	get delivered() {
		return this.elapsed >= (this.data.order.totalProductionTime + this.data.order.deliveryTime);
	}
	get preparationElapsed() {
		return Math.min(this.elapsed, this.data.order.totalProductionTime);
	}
	get preparationRemaining() {
		return Math.max(0, this.data.order.totalProductionTime - this.elapsed);
	}
	get deliveryElapsed() {
		return this.elapsed - this.preparationElapsed;
	}
	get deliveryRemaining() {
		return Math.max(0, this.data.order.deliveryTime - this.deliveryElapsed);
	}
	embed() {
		let order = this.data.order, restaurant = order.restaurant;
		let embed = {
			title: restaurant.name + ' | Order #' + order.id,
			description: this.data.order.toString(true),
			thumbnail: (restaurant.logo ? {
				url: restaurant.logo
			} : null),
			timestamp: new Date(this.started)
		};
		if (this.delivered) {
			return {
				message: md.mention(this.customerID) + ' Your food has arrived!',
				embed
			};
		} else {
			let prepRemaining = this.preparationRemaining;
			let delRemaining  = this.deliveryRemaining;
			if (prepRemaining) {
				embed.fields = [{
					name: CANCEL + ' Preparing',
					value: ' 🕓 ' + fmt.time(prepRemaining),
					inline: true
				},{
					name: CANCEL + ' Delivery',
					value: ' 🕓 ' + fmt.time(delRemaining) + ' (after preparing)',
					inline: true
				}];
			} else if (delRemaining) {
				embed.fields = [{
					name: CONFIRM + ' Prepared!',
					value: 'Awaiting delivery...',
					inline: true
				},{
					name: CANCEL + ' Delivering',
					value: ' 🕓 ' + fmt.time(delRemaining),
					inline: true
				}];
			}
			return embed;
		}
	}
	toField() {
		let prepRemaining = this.preparationRemaining;
		let delRemaining  = this.deliveryRemaining;
		return {
			name: this.data.order.restaurant.name + ' | Order #' + this.data.order.id,
			value: this.data.order.quantity + ' items\n'
			     + (prepRemaining ? CANCEL + ' Prepared in ' + fmt.time(prepRemaining) : CONFIRM + ' Prepared') + '\n'
				 + (delRemaining ? CANCEL + ' Delivered in ' + fmt.time(delRemaining) : CONFIRM + ' Delivered')
		};
	}
	static getOrders(client, userID) {
		return client.sessions.filter((sID,session) => {
			return session.category === 'food' && session.id.endsWith(userID);
		}).map(sID => client.sessions[sID]);
	}
}
class PendingOrderBrowser extends ListMessageBrowser {
	constructor() {
		super(...arguments);
		this.init();
	}
	init() {
		super.init();
		this.updateEmbed();
	}
	mapItem(item) {
		return item.toField();
	}
	toString() {
		return '';
	}
}
PendingOrderBrowser.CONFIG = {
	displayName: 'Your Pending Food Orders',
	canSort: false,
	itemsPerPage: 10,
	interface: []
};

module.exports = {
	Food, Drink, Combo, Order, Restaurant,
	FoodMenu, FoodSelector,
	PendingOrder, PendingOrderBrowser
};
