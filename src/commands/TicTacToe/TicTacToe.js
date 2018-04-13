const Session = require('../../Session');
const {Markdown:md,Format:fmt,random} = require('../../Utils');

const checkingTable = [
	[0,1,2],
	[3,4,5],
	[6,7,8],
	[0,3,6],
	[1,4,7],
	[2,5,8],
	[0,4,8],
	[2,4,6]
];
const placementIndex = [
	['1','upper-left','left-upper','top-left','left-top'],
	['2','upper-middle','upper-center','middle-upper','center-upper','top-middle','top-center','middle-top','center-top'],
	['3','upper-right','right-upper','top-right','right-top'],
	['4','middle-left','left-middle','center-left','left-middle'],
	['5','middle','center','middle-middle','center-center','middle-center','center-middle'],
	['6','middle-right','right-middle','center-right','right-middle'],
	['7','lower-left','left-lower','bottom-left','left-bottom'],
	['8','lower-middle','lower-center','middle-lower','center-lower','bottom-middle','bottom-center','middle-bottom','center-bottom'],
	['9','lower-right','right-lower','bottom-right','right-bottom']
];

class TicTacToe extends Session {
	static generateID(context) {
		return `tictactoe-${context.channelID}-${context.userID}`;
	}
	constructor(client, context, playerType = 'X') {
		super({
			id: TicTacToe.generateID(context),
			title: 'TicTacToe',
			info: 'Play a game of Tic-Tac-Toe against the bot!',
			category: 'tictactoe',
			settings: {
				expires: 30000,
				reset: true,
				cancel: 3,
				silent: false
			},
			data: {
				move: -1
			},
			permissions: {
				type: 'inclusive',
				users: [context.userID],
				channels: [context.channelID],
				servers: [context.serverID]
			},
			resolver({client,message}) {
				if (this.turn != this.player) return;
				var choice = message.toLowerCase().replace(' ','-').replace(/[^\w\-]+/g, '');
				if (choice == 'cancel') {
					return 'cancel';
				}
				var idx = this.data.move = placementIndex.findIndex(p => p.includes(choice));
				if (idx > -1) {
					if (this.board[idx] == this.player || this.board[idx] == this.bot) {
						return 'occupied';
					} else {
						return 'playerMove';
					}
				}
			},
			events: {
				start() {
					if (this.turn == this.bot) {
						this.botMove();
					} else {
						this.client.send(this.last_channel_id, md.mention(this.playerID) + ' You make the first move.', this.toEmbed());
					}
				},
				playerMove() {
					this.makeMove(this.data.move);
				},
				occupied() {
					return 'That spot is already occupied. Please choose another.';
				},
				cancel() {
					this.close();
					return 'Game canceled.';
				},
				goodbye() {
					return 'You waited too long. Game forfeited.';
				}
			}
		});
		playerType = playerType.toUpperCase();
		
		this.client   = client;
		this.playerID = context.userID;
		this.player   = playerType == 'X' ? 'X' : 'O'; // TODO: find suitable emojis that don't affect the board alignment?
		this.bot      = playerType == 'X' ? 'O' : 'X';
		this.winner   = '';
		this.turn     = random(this.player, this.bot);
		this.turns    = 1;
		this.board    = [
			'1️','2️','3️',
			'4️','5️','6️',
			'7️','8️','9️'
		];
	}
	botMove() {
		var indices     = this.board.map((x,i) => i);
		var playerMoves = indices.filter(i => this.board[i] == this.player);
		var botMoves    = indices.filter(i => this.board[i] == this.bot);
		var free        = indices.filter(i => this.board[i] != this.player && this.board[i] != this.bot);
		var chosenMove;
		
		// endgame rows include those which are not occupied by the other player
		var playerRows = checkingTable.filter(row => 3 == row.reduce((x,i) => (playerMoves.includes(i) || !botMoves.includes(i) ? ++x : x), 0));
		var botRows    = checkingTable.filter(row => 3 == row.reduce((x,i) => (botMoves.includes(i) || !playerMoves.includes(i) ? ++x : x), 0));
		
		// close wins are rows occupied in at least 2 spots by a single player
		var playerCloseWins = playerRows.filter(row => 2 == row.reduce((x,i) => (playerMoves.includes(i) ? ++x : x), 0));
		var botCloseWins    = botRows.filter(   row => 2 == row.reduce((x,i) => (botMoves.includes(i)    ? ++x : x), 0));
		
		// look for moves that decide who wins (from the player's perspective)
		var winningMoves = free.filter(i => playerCloseWins.some(row => row.includes(i)));
		var losingMoves  = free.filter(i => botCloseWins.some(   row => row.includes(i)));
		
		if (botCloseWins.length > 0) {
			chosenMove = random(losingMoves);
		} else if (playerCloseWins.length > 0) {
			chosenMove = random(winningMoves);
		} else {
			chosenMove = random(free);
		}
		
		this.makeMove(chosenMove);
	}
	makeMove(idx) {
		this.board[idx] = this.turn;
		this.turn = this.turn == this.player ? this.bot : this.player;
		this.turns++;
		this.winner = this.checkBoard();
		this.client.send(this.last_channel_id, md.mention(this.playerID), this.toEmbed());
		
		if (this.winner) {
			this.close();
		} else if (this.turn == this.bot) {
			this.client.wait(3000).then(() => this.botMove());
		}
	}
	get status() {
		if (this.winner == this.player) {
			return {
				name: 'Win',
				value: 'You win against the bot!'
			};
		} else if (this.winner == this.bot) {
			return {
				name: 'Lose',
				value: 'The bot wins!'
			};
		} else if (this.winner == 'tie') {
			return {
				name: 'Tie',
				value: 'It\'s a stalemate!'
			};
		} else if (this.turn == this.player) {
			return {
				name: `Turn ${this.turns}`,
				value: 'It is your turn. Choose your square.'
			};
		} else if (this.turn == this.bot) {
			return {
				name: `Turn ${this.turns}`,
				value: 'It is the bot\'s turn.'
			};
		} else {
			return '';
		}
	}
	checkBoard() {
		return checkingTable.map(a => this.checkThree(a)).filter(String)[0] || (this.turns == 10 ? 'tie' : '');
	}
	checkThree([a,b,c]) {
		if (this.board[a] == this.board[b] && this.board[b] == this.board[c]) {
			return this.board[a];
		} else {
			return '';
		}
	}
	toString() {
		var boardString = [
			this.board.slice(0,3).join(' | '),
			'--+---+--',
			this.board.slice(3,6).join(' | '),
			'--+---+--',
			this.board.slice(6,9).join(' | ')
		].join('\n');
		return md.codeblock(boardString);
	}
	toEmbed() {
		var embed = {
			title: `Tic-Tac-Toe: Player (${this.player}) vs. Bot (${this.bot})`,
			description: this.toString(),
			fields: []
		};
		var status = this.status;
		if (status) {
			embed.fields.push(status);
		}
		if (this.bet) {
			embed.fields.push({
				name: 'Player Bet',
				value: fmt.currency(this.bet)
			});
		}
		if (this.winner == this.player) {
			embed.color = 0x00FF00;
		} else if (this.winner == this.bot) {
			embed.color = 0xFF0000;
		} else if (this.winner == 'tie') {
			embed.color = 0xFFFFFF;
		}
		return embed;
	}
}

module.exports = TicTacToe;
