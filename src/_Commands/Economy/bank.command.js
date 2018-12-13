const Bank = require('../../Bank/Bank');
const Constants = require('../../Constants/Bank');
const {Markdown:md,Format:fmt} = require('../../Utils');

function resolveTargetUser(args, userID) {
	let id = md.userID(args[0]);
	if (id) args.splice(0,1);
	else id = userID;
	if (id) return id;
	else throw 'Invalid user ID.';
}

module.exports = {
	'bank': {
		aliases: ['account', 'profile'],
		title: Bank.header,
		category: 'Economy',
		info: 'View a bank account\'s summary.\nCredits can be used to play games, like Blackjack, Slots, Fishing, and Lottery. Users can transfer their credits or make investments. Authorized bank staff may offer loans and custom bank amounts.',
		parameters: ['[user]'],
		permissions: 'inclusive',
		fn({client, args, user, userID, server, channelID}) {
			let thisUserID = resolveTargetUser(args, userID);
			if (Bank.getAuth(client, userID)) {
				// OK
			} else if (thisUserID != userID) {
				return 'Not authorized.';
			}
			return Bank.summary(client, thisUserID);
		},
		subcommands: {
			'auth': {
				aliases: ['authorize'],
				title: Bank.header + ' | Authorize User',
				info: 'Authorizes special privileges to a user, such as the ability to open others\' accounts and deposit/withdraw at will.',
				parameters: ['user'],
				permissions: 'privileged',
				fn({client, args, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, '');
					Bank.authorize(client, thisUserID);
					return md.mention(thisUserID) + ' Your account has been authorized as staff.';
				}
			},
			'unauth': {
				aliases: ['unauthorize', 'deauthorize'],
				title: Bank.header + ' | Unauthorize User',
				info: 'Strips authorized privileges from a user.',
				parameters: ['user'],
				permissions: 'privileged',
				fn({client, args, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, '');
					Bank.unauthorize(client, thisUserID);
					return md.mention(thisUserID) + ' Your account has been un-authorized.';
				}
			},
			'isauth': {
				aliases: ['isauthorized'],
				title: Bank.header + ' | Check Authorization',
				info: 'Checks account for authorized privileges.',
				parameters: ['[user]'],
				fn({client, args, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					if (Bank.getAuth(client, thisUserID)) {
						return md.mention(thisUserID) + ' is ' + md.bold('authorized');
					} else {
						return md.mention(thisUserID) + ' is ' + md.bold('not authorized');
					}
				}
			},
			'open': {
				aliases: ['create', 'new'],
				title: Bank.header + ' | Open Account',
				info: 'Opens an account to you or another user. If the account already exists, it reopens it if closed.',
				parameters: ['[user]'],
				fn({client, args, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					if (Bank.getAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Not authorized.';
					}
					Bank.open(client, thisUserID)
					return md.mention(thisUserID) + ' Your account has been opened!';
				}
			},
			'close': {
				title: Bank.header + ' | Close Account',
				info: 'Closes `user`\'s account, which prevents transactions.',
				parameters: ['[user]'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					if (Bank.getAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Not authorized.';
					}
					Bank.close(client, thisUserID)
					return md.mention(thisUserID) + ' Your account has been closed. You may not do transactions or receive daily cash.';
				}
			},
			'delete': {
				aliases: ['reset'],
				title: Bank.header + ' | Delete Account',
				info: 'Deletes `user`\'s account. (This effectively just resets their bank account...)',
				parameters: ['user'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, '');
					if (Bank.getAuth(client, userID)) {
						// OK
					} else {
						return 'Not authorized.';
					}
					Bank.delete(client, thisUserID);
					return md.mention(thisUserID) + ' Your account has been deleted.';
				}
			},
			'add': {
				aliases: ['loan', 'deposit'],
				title: Bank.header + ' | Deposit',
				info: 'Gives `amount` credits to the `user`\'s account.',
				parameters: ['[user]','amount'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					if (Bank.getAuth(client, userID)) {
						// OK
					} else {
						return 'Not authorized.';
					}
					let amount = args[0];
					Bank.deposit(client, thisUserID, amount);
					return md.mention(thisUserID) + ' Your account balance has received ' + Bank.formatCredits(amount) + '.';
				}
			},
			'remove': {
				aliases: ['tax', 'confiscate', 'withdraw'],
				title: Bank.header + ' | Withdraw',
				info: 'Takes `amount` credits from `user`\'s account.',
				parameters: ['[user]', 'amount'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					if (Bank.getAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Not authorized.';
					}
					let amount = args[0];
					Bank.withdraw(client, thisUserID, amount);
					return md.mention(thisUserID) + ' Your account balance has been deducted by ' + Bank.formatCredits(amount) + '.';
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
					if (Bank.getAuth(client, thisUserID)) {
						// OK
					} else {
						if (thisUserID != userID) {
							throw 'Not authorized to assign a different receiver.';
						}
						if (targetUserID == userID) {
							throw 'Not authorized to assign themselves as the receiver.';
						}
					}
					Bank.transfer(client, thisUserID, targetUserID, args[0]);
					return md.mention(thisUserID) + ' has transferred ' + Bank.formatCredits(amt) + ' to ' + md.mention(targetUserID) + '.';
				}
			},
			'invest': {
				title: Bank.header + ' | Invest',
				info: 'Set aside some of your credits for investing. The longer you wait, the more cash you get out of it.',
				parameters: ['<help|start|stop|check>','[amount|invID]'],
				fn({client, args, user, userID, server, channelID}) {
					switch (String(args[0]).toLowerCase()) {
						case 'start':
							let amount = args[1];
							return Bank.startInvestment(client, userID, amount).then(invID => {
								return `${md.mention(userID)} You set aside ${Bank.formatCredits(amount)} for investing. It will earn interest over time, which you can monitor with ${md.code('bank.invest check ' + invID)}.`;
							});
						case 'stop':
							return Bank.stopInvestment(client, userID, args[1]-1);
						case 'check':
							return Bank.checkInvestment(client, userID, args[1]-1);
						default:
							return {
								title: `Help`,
								description: `For all intended purposes, the current interest rate is ${md.bold(fmt.percent(Constants.Investment.RATE))}, compounded ${md.bold(Constants.Investment.COMPOUNDING + ' time(s) per day')}, and the minimum to start investing is ${Bank.formatCredits(Constants.Investment.MINIMUM)}.`,
								fields: [
									{
										name: 'Starting an Investment',
										value: 'To start investing, use ' + md.code(client.PREFIX + 'bank.invest start <amount>') + '. You can pay any amount above the minimum, and for the duration of the investment, you cannot access that cash until you stop investing for it.'
									},
									{
										name: 'While Investing',
										value: 'To check on your investing, use ' + md.code(client.PREFIX + 'bank.invest check <id>') + '. The total time that has elapsed since you started will be shown, along with the estimated interest and net gain you will earn. The formula used for calculating interest is A = Pe^(rt)'
									},
									{
										name: 'Stopping an Investment',
										value: 'To stop investing, use ' + md.code(client.PREFIX + 'bank.invest stop <id>') + '. If at least an hour has passed, investing will cease, and the earned interest will be calculated and added to your account balance. You will then be able to transfer credits and receive daily payroll again.'
									}
								]
							};
					}
				}
			},
			'history': {
				title: Bank.header + ' | Account History',
				info: 'Provides a history of `user`\'s transactions, in order from newest to oldest.',
				parameters: ['[user]', '[page]'],
				fn({client, args, user, userID, server, channelID}) {
					let thisUserID = resolveTargetUser(args, userID);
					
					if (Bank.getAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Viewing another bank account\'s history is not authorized.';
					}
					
					return Bank.history(client, thisUserID, args[0]);
				},
				subcommands: {
					'save': {
						title: Bank.header + ' | Save',
						info: 'Backs up your account as proof of value for future issues.',
						parameters: ['[user]'],
						fn({client, args, userID, channelID}) {
							let thisUserID = resolveTargetUser(args, userID);
					
							if (Bank.getAuth(client, userID)) {
								// OK
							} else if (thisUserID != userID) {
								return 'Saving another bank account is not authorized.'
							}
							
							return Bank.pushHistory(client, thisUserID).then(() => {
								return md.mention(thisUserID) + ' Your account state has been preserved.';
							});
						}
					},
					'load': {
						aliases: ['revert'],
						info: 'Reverts an account\'s state back to a log entry with the given timestamp ID.',
						parameters: ['user', 'timestamp'],
						permissions: 'private',
						fn({client, args, userID, channelID}) {
							let thisUserID = resolveTargetUser(args);
							let histID = args[0];
							let record = Bank.revertHistory(client, thisUserID, histID);
							if (record) {
								return md.mention(userID) + ' Your account has been reverted to data from ' + record.timestamp;
							} else {
								return `There is no entry with the ID ${histID} in ${md.mention(userID)}'s history log.`;
							}
						}
					},
					'purge': {
						title: Bank.header + ' | Purge History',
						info: 'Deletes account history, just in case...',
						parameters: ['user'],
						permissions: 'private',
						fn({client, args, user, userID, server, channelID}) {
							let thisUserID = resolveTargetUser(args);
							Bank.purgeHistory(client, thisUserID);
							return md.mention(thisUserID) + ' Your bank history has been cleared.';
						}
					}
				}
			},
			'ledger': {
				title: Bank.header + ' | Bank Ledger',
				info: 'Provides a history of all transactions in the server, in order from newest to oldest.',
				parameters: ['[page]'],
				fn({client, args, user, userID, server, channelID}) {
					if (Bank.getAuth(client, userID)) {
						// ok
					} else {
						return 'Accessing bank ledger is not authorized.'
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
					
					if (Bank.getAuth(client, userID)) {
						// OK
					} else if (thisUserID != userID) {
						return 'Not authorized.';
					}
					
					let credits = Bank.getBalance(client, thisUserID);
					return md.mention(thisUserID) + ' You have ' + Bank.formatCredits(credits);
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
		permissions: 'inclusive',
		fn({client, args, user, userID, server, channelID}) {
			return Bank.daily(client, userID)
			.then(amount => {
				return md.mention(userID) + ' You received your daily ' + Bank.formatCredits(amount);
			});
		}
	}
};

