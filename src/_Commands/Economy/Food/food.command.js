const {FoodMenu,FoodSelector,PendingOrder,PendingOrderBrowser} = require('./Food');

module.exports = {
	'food': {
		aliases: ['fastfood','menu','foodmenu'],
		category: 'Fun',
		title: 'Food Menu',
		info: 'Get a list of food that can be delivered to you! Pay via credits, wait a bit, and enjoy fresh food! You can specify which restaurant\'s menu to look at.',
		parameters: ['[restaurant]'],
		permissions: 'inclusive',
		fn({client, context, arg}) {
			let menu = FoodMenu.getMenu(context, arg);
			if (menu instanceof FoodMenu) {
				menu.startBrowser(client);
			} else {
				return menu;
			}
		},
		subcommands: {
			'order': {
				title: 'Food | Make an Order',
				info: 'Order food! Use the reactions to select a restaurant, choose food items with sides and drinks, then confirm!',
				fn({client, context, user}) {
					let fs = new FoodSelector(context, user);
					fs.startBrowser(client);
				}
			},
			'cancel': {
				title: 'Food | Cancel Order',
				info: 'Cancel a pending order, but only if it is still being prepared. You will be refunded half of what you paid for.',
				parameters: ['orderID'],
				fn({client, userID, args}) {
					let id = args[0];
					let orders = PendingOrder.getOrders(client, userID);
					if (orders.length) {
						let o = orders.find(order => order.data.order.id === id);
						if (o) {
							if (o.prepared) {
								throw 'You cannot cancel a prepared order!';
							}
							let invoice = o.getInvoice(), refund  = invoice.total * 0.5;
							client.bank.deposit(client, userID, refund);
							return 'You were refunded ' + client.bank.formatCredits(refund) + ' for that order.';
						} else {
							throw 'Cannot find a pending order with the ID ' + id;
						}
					} else {
						return 'You have no food orders pending.';
					}
				}
			},
			'check': {
				title: 'Food | Pending Orders',
				info: 'Check on your pending orders. For more info, use the ID of an order you made.',
				parameters: ['[orderID]'],
				fn({client, context, userID, args}) {
					let id = args[0];
					let orders = PendingOrder.getOrders(client, userID);
					if (orders.length) {
						if (id) {
							let o = orders.find(order => order.data.order.id == id);
							if (o) {
								return o.embed();
							} else {
								throw 'Cannot find a pending order with the ID ' + id;
							}
						} else {
							let pob = new PendingOrderBrowser(context, orders);
							pob.startBrowser(client);
						}
					} else {
						return 'You have no food orders pending.';
					}
				}
			}
		}
	}
};
