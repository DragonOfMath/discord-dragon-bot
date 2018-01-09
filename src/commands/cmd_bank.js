/**
	cmd_bank.js
	Command file for utilizing the Bank.js system of dragon currency.
*/

const Bank = require('../Bank');
const {Markdown:md} = require('../Utils');

function resolveTargetUser(args, userID) {
	let id = md.userID(args[0]);
	if (id) args.splice(0,1);
	else id = userID;
	return id;
}

module.exports = {
	'bank': {
		title: Bank.header,
		category: 'Fun',
		info: 'The bank tracks the credits of all users on the server. Credits can be used to play games, like Blackjack, Slots, Fishing, and Lottery. Users can transfer their credits or make investments. Authorized bank staff may offer loans and custom bank amounts.',
		subcommands: {
			'auth': {
				aliases: ['authorize'],
				title: Bank.header + ' | Authorize User',
				info: 'Authorizes special privileges to a user, such as the ability to open others\' accounts and deposit/withdraw at will.',
				parameters: ['user'],
				permissions: { type: 'private' },
				fn({client, args, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, '');
					return Bank.auth(client, thisUserID);
				}
			},
			'unauth': {
				aliases: ['unauthorize', 'deauthorize'],
				title: Bank.header + ' | Unauthorize User',
				info: 'Strips authorized privileges from a user.',
				parameters: ['user'],
				permissions: { type: 'private' },
				fn({client, args, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, '');
					return Bank.unauth(client, thisUserID);
				}
			},
			'isauth': {
				aliases: ['isauthorized'],
				title: Bank.header + ' | Check Authorization',
				info: 'Checks account for authorized privileges.',
				parameters: ['[user]'],
				permissions: { type: 'public' },
				fn({client, args, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					if (Bank.checkAuth(client, thisUserID)) {
						return md.mention(thisUserID) + ' is **authorized**.';
					} else {
						return md.mention(thisUserID) + ' is **not authorized**.';
					}
				}
			},
			'open': {
				aliases: ['create', 'new'],
				title: Bank.header + ' | Open Account',
				info: 'Opens a new account to `user` (or you).',
				parameters: ['[user]'],
				fn({client, args, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					
					if (Bank.checkAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Not authorized.';
					}
					
					return Bank.open(client, thisUserID);
				}
			},
			'reopen': {
				title: Bank.header + ' | Re-Open Account',
				info: 'Re-opens `user`\'s account.',
				parameters: ['user'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, '');
					
					if (Bank.checkAuth(client, userID)) {
						// ok, user has authorization
					} else {
						return 'Not authorized.';
					}
					
					return Bank.reopen(client, thisUserID);
				}
			},
			'close': {
				title: Bank.header + ' | Close Account',
				info: 'Closes `user`\'s account permanently.',
				parameters: ['[user]'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);

					if (Bank.checkAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Not authorized.';
					}
					
					return Bank.close(client, thisUserID);
				}
			},
			'delete': {
				title: Bank.header + ' | Delete Account',
				info: 'Deletes `user`\'s account permanently.',
				parameters: ['user'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, '');

					if (Bank.checkAuth(client, userID)) {
						// ok, user has authorization
					} else {
						return 'Not authorized.';
					}
					
					return Bank.delete(client, thisUserID);
				}
			},
			'view': {
				aliases: ['check', 'summary', 'account', 'profile'],
				title: Bank.header + ' | Account Summary',
				info: 'Returns a summary of `user`\'s account.',
				parameters: ['[user]'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					
					if (Bank.checkAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Not authorized.';
					}
					
					return Bank.summary(client, thisUserID);
				}
			},
			'add': {
				aliases: ['loan', 'deposit'],
				title: Bank.header + ' | Deposit',
				info: 'Gives `amount` credits to the `user`\'s account.',
				parameters: ['[user]','amount'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					
					if (Bank.checkAuth(client, userID)) {
						// OK
					} else {
						return 'Not authorized.';
					}
					
					return Bank.deposit(client, thisUserID, args[0]);
				}
			},
			'remove': {
				aliases: ['tax', 'confiscate', 'withdraw'],
				title: Bank.header + ' | Withdraw',
				info: 'Takes `amount` credits from `user`\'s account.',
				parameters: ['[user]', 'amount'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					
					if (Bank.checkAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Not authorized.';
					}
					
					return Bank.withdraw(client, thisUserID, args[0]);
				}
			},
			'transfer': {
				aliases: ['give'],
				title: Bank.header + ' | Transfer',
				info: 'Transfers `amount` credits `from user` -> `to user`.',
				parameters: ['[user]', 'recipient', 'amount'],
				fn({client, args, user, userID, server, channelID}) {
					// users with auth can assign someone else as the source user
					// users without auth can only assign themselves as the source user
					// users with auth can assign themselves as the target user
					// users without auth cannot assign themselves as the target user
					
					let thisUserID   = resolveTargetUser(args, userID);
					let targetUserID = resolveTargetUser(args, thisUserID);
					if (thisUserID == targetUserID) {
						thisUserID = userID;
					}
					
					//console.log(thisUserID, targetUserID, userID, args)
					
					if (Bank.checkAuth(client, userID)) {
						// OK
					} else {
						if (thisUserID != userID) {
							return 'Assigning a different source user is not authorized.'
						}
						if (targetUserID == userID) {
							return 'Assigning yourself as target user is not authorized.'
						}
					}

					return Bank.transfer(client, thisUserID, targetUserID, args[0]);
				}
			},
			'invest': {
				title: Bank.header + ' | Invest',
				info: 'Investment starts with a cost, but can pay-off given enough time. You must meet the requirement(s) for investing.',
				parameters: ['<help|start|stop|check>'],
				fn({client, args, user, userID, server, channelID}) {
					return Bank.invest(client, userID, args[0]);
				}
			},
			'history': {
				title: Bank.header + ' | Account History',
				info: 'Provides a history of `user`\'s transactions, in order from newest to oldest.',
				parameters: ['[user]', '[page]'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					
					if (Bank.checkAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Viewing another bank account not authorized.'
					}
					
					return Bank.history(client, thisUserID, args[0]);
				},
				subcommands: {
					'purge': {
						title: Bank.header + ' | Purge History',
						info: 'Deletes account history, just in case...',
						parameters: ['user'],
						permissions: {
							type: 'private'
						},
						fn({client, args, user, userID, server, channelID}) {
							let thisUserID = md.id(args[0]);
							return Bank.purgeHistory(client, thisUserID);
						}
					}
				}
			},
			'ledger': {
				title: Bank.header + ' | Bank Ledger',
				info: 'Provides a history of all transactions in the server, in order from newest to oldest.',
				parameters: ['[page]'],
				fn({client, args, user, userID, server, channelID}) {
					if (Bank.checkAuth(client, userID)) {
						// ok
					} else {
						return 'Accessing bank ledger not authorized.'
					}
					
					return Bank.ledger(client, server, userID, args[0]);
				}
			},
			'credits': {
				aliases: ['balance'],
				title: Bank.header + ' | Balance',
				info: 'Checks your account balance.',
				parameters: ['[user]'],
				fn({client, args, userID}) {
					let thisUserID = resolveTargetUser(args, userID);
					
					if (Bank.checkAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Not authorized.';
					}
					
					return Bank.getBalance(client, thisUserID);
				}
			},
			'top': {
				aliases: ['leaderboard','hiscore'],
				title: Bank.header + ' | Leaderboard',
				info: 'Displays the top ranking users with the highest bank balances.',
				parameters: ['[page]'],
				fn({client, args, server}) {
					return Bank.leaderboard(client, server, args[0]);
				}
			}
		}
	},
	'daily': {
		aliases: ['money', 'cash', 'freebie', 'welfare', '877-cash-now'],
		category: 'Fun',
		title: Bank.header + ' | Daily Cash',
		info: 'Earn free money every day!',
		fn({client, args, user, userID, server, channelID}) {
			return Bank.daily(client, userID);
		}
	}
};

