const LiveMessage = require('./LiveMessage');
const Player      = require('./Player');
const Constants   = require('../Constants/MessageGame');
const {Array,Markdown:md,Format:fmt} = require('../Utils');

/**
 * MessageGame interface for creating interactive embed games.
 * @class MessageGame
 * @prop {Array<User>} users
 * @prop {Array<Player>} players
 * @prop {IntervalHandle} playerTimeout
 * @prop {Number} playersRequestingGameEnd
 * @prop {Number} playersRequestingGameRestart
 * @prop {Object} options
 * @prop {String} options.gameType
 * @prop {String} options.displayName
 * @prop {String} options.howToPlay
 * @prop {Number} options.minPlayers
 * @prop {Number} options.maxPlayers
 * @prop {Number} options.minBotPlayers
 * @prop {Number} options.maxBotPlayers
 * @prop {Number} options.maxTurns
 * @prop {Boolean} options.canRestart
 * @prop {Boolean} options.shufflePlayers
 * @prop {Boolean} options.showSpectators
 */
class MessageGame extends LiveMessage {
    /**
     * MessageGame constructor
     * @param {MessageContext} context - the context object containing the channelID, user, and client
     * @param {Array<User>}    [players] - explicit array of users to act as players; defaults to the context user
	 * @param {Object}         [options] - additional options for setup
     */
    constructor(context, players = [], options = {}) {
		if (!players.length) players.push(context.user);
        super(context.channelID);
		this.config(this.constructor.CONFIG);
		Object.assign(this.options, options);
		
		//this.client = context.client;
		
		let botPlayers = players.filter(player => player.bot).length;
		
		// fill in remaining player spots using the client as a bot player
		while (players.length < this.options.minPlayers && botPlayers < this.options.maxBotPlayers) {
			players.push(context.client);
			botPlayers++;
		}
		if (botPlayers < this.options.minBotPlayers) {
			throw `Too many user players. Need at least ${this.options.minBotUsers} bot players.`;
		}
		if (botPlayers > this.options.maxBotPlayers) {
			throw `Cannot have more than ${this.options.maxBotPlayers} bot players.`;
		}
		if (players.length > this.options.maxPlayers) {
            throw `Cannot have more than ${this.options.maxPlayers} players.`;
        }
        if (players.length < this.options.minPlayers) {
            throw `Need at least ${this.options.minPlayers} players.`;
        }
		
		// list of all users and players
        this.players = (this.users = players).map(user => new Player(user));

        this.playerTimeout = null;
        this.playersRequestingGameEnd = 0;
        this.playersRequestingGameRestart = 0;

        // initializer the game data and embedding
        //this.init();

        // Event handlers
        this.once('ready', (client) => {
            this.startMove(client);
        });
        this.on('MESSAGE_REACTION_ADD', async (ctx) => {
            let {client, reaction, user} = ctx;

            // ignore reactions from non-players
            if (this.userPlayers.length && !this.users.includes(user)) return;

			switch (reaction) {
				// close the game if all user players requested so
                case LiveMessage.CLOSE:
					if (++this.playersRequestingGameEnd >= this.userPlayers.length) {
						this.delete(client);
					}
					return;
				// restart the game if all user players requested so
                case LiveMessage.NEW:
					if (++this.playersRequestingGameRestart >= this.userPlayers.length) {
						if (!this.options.canRestart) break;
						this.init();
						this.edit(client);
					}
					return;
				// display help information about the game
				case LiveMessage.HELP:
					this.help = true;
					if (this.userPlayers.includes(this.player)) {
						this.updateEmbed();
						this.edit(client);
					}
					return;
			}

            // immediately remove the reaction so it may be used again
            await this.removeReaction(client, reaction, user.id);

            // handle the turn player's move
            if (this.player.id == user.id) {
				// ignore reactions that aren't recognized
				if (!this.options.interface.includes(reaction)) return;
				this.player.auto = false; // revoke automation
				try {
					if (this.handlePlayerMove(reaction, client)) {
						this.edit(client);
					}
				} catch (e) {
					this.error = e;
					this.edit(client);
				}
            }
        });
        this.on('MESSAGE_REACTION_REMOVE', (ctx) => {
            let {client, reaction, user} = ctx;
            
            // ignore reactions from non-players
            if (this.userPlayers.length && !this.userPlayers.find(p => p.id == user.id)) return;

			switch (reaction) {
				case LiveMessage.CLOSE:
					this.playersRequestingGameEnd--;
					break;
				case LiveMessage.NEW:
					this.playersRequestingGameRestart--;
					break;
				case LiveMessage.HELP:
					this.help = false;
					this.updateEmbed();
					this.edit(client);
					break;
			}
        });
        this.on('update', async (client) => {
            if(this.winner) {
				// DON'T clear reactions if the game can be restarted manually
				if (this.options.canRestart) return;
                await this.clearReactions(client);
                return this.close(client);
            } else {
                this.startMove(client);
            }
        });
        this.on('close', () => {
            this.stopTimer();
        });
    }
	config(options = {}) {
		this.options = {};
		if (options.gameType) {
			for (let key in Constants.PRESETS[options.gameType]) {
				this.options[key] = Constants.PRESETS[options.gameType][key];
			}
		} else {
			options.gameType = Constants.TYPES.CASUAL;
		}
		if (!options.displayName) {
			options.displayName = this.constructor.name;
		}
		for (let key in options) {
			if (key in Constants.CONFIG) {
				this.options[key] = options[key];
			}
		}
		// validate configuration
		if (this.options.maxPlayers < 1) {
			throw 'Bad game configuration: max player count must be at least 1.';
		}
		if (this.options.maxBotPlayers < 0) {
			throw 'Bad game configuration: max bot player count must be at least 0';
		}
		if (this.options.minPlayers > this.options.maxPlayers) {
			throw 'Bad game configuration: min player count exceeds max player count.';
		}
		if (this.options.minBotPlayers > this.options.maxBotPlayers) {
			throw 'Bad game configuration: min bot player count exceeds max bot player count.';
		}
		if (this.options.minBotPlayers > this.options.maxPlayers) {
			throw 'Bad game configuration: min bot player count exceeds max player count.';
		}
	}

    get userPlayers() {
        return this.players.filter(p => !p.bot);
    }
    get botPlayers() {
        return this.players.filter(p => p.bot);
    }
    get activePlayers() {
        return this.players.filter(player => player.active);
    }
    get inactivePlayers() {
        return this.players.filter(player => player.inactive || player.forfeited);
    }
    get forfeitedPlayers() {
        return this.players.filter(player => player.forfeited);
    }
	get otherPlayers() {
		return this.players.filter(player => player != this.player);
	}

    get playerID() {
        return this.playerIdx + 1;
    }
    get player() {
        return this.players[this.playerIdx];
    }
    get token() {
        return this.options.tokens[this.playerID];
    }
    get status() {
        if (this.winner == 'tie' || this.winner == 'draw') {
            return {
                name: 'Tie',
                value: 'It\'s a tie!'
            };
        } else if (this.winner == 'nobody') {
            return {
                name: 'Failure',
                value: 'Better luck next time?'
            };
        } else if (this.winner) {
            if (this.winner instanceof Player) {
				return {
                    name: 'Game Complete',
                    value: `The winner is: ${this.winner.username}!`
                };
            } else if (this.winner instanceof Array) {
                return {
                    name: 'Game Complete',
                    value: `The winners are: ${this.winner.map(w => w.username).join(', ')}`
                };
            } else {
				return {
					name: 'Game Complete',
					value: `The winner is: ${this.winner}!`
				};
			}
        } else if (this.options.gameType == Constants.TYPES.CASUAL) {
			return {
				name: `Turn ${this.turns}`,
				value: `Take your time, ${this.player.username}...`
			};
		} else {
            return {
                name: `Turn ${this.turns}`,
                value: `It is ${this.player.username}'s turn.` + (this.timer > 0 ? `\nYou have ${this.timer} seconds.` : '')
            };
        }
    }
	get color() {
		switch (this.options.gameType) {
			case Constants.TYPES.CASUAL:
				if (this.winner) {
					if (this.winner instanceof Player) {
						return Constants.COLORS.WIN;
					} else {
						return Constants.COLORS.LOSE;
					}
				}
				break;
				
			case Constants.TYPES.COOPERATIVE:
				if (this.winner instanceof Player || this.winner instanceof Array) {
					return Constants.COLORS.WIN;
				} else if (this.winner) {
					return Constants.COLORS.LOSE;
				}
				break;
				
			case Constants.TYPES.COMPETITIVE:
				if (this.winner instanceof Player) {
					if (this.winner.bot) {
						return Constants.COLORS.LOSE;
					} else {
						return Constants.COLORS.WIN;
					}
				} else if (this.winner instanceof Array) {
					if (this.winner.length) {
						return Constants.COLORS.WIN;
					} else {
						return Constants.COLORS.LOSE;
					}
				} else if (this.winner) {
					return Constants.COLORS.TIE;
				}
				break;
		}
		return 0;
	}

    init() {
        this.players.forEach(player => player.init());

        this.winner    = null;
        this.turns     = 1;
        this.playerIdx = 0;

        this.timer = this.options.timeLimit;
        this.stopTimer();

        this.game = null;
		this.error = null;
        this.help = false;

        if (this.options.shufflePlayers) {
            this.players = this.players.shuffle();
        }
        
        // assign avatars to the players
        if (this.options.tokens) {
            this.players.forEach((player, idx) => {
                player.avatar = this.options.tokens[idx+1];
            });
        }

        this.embed = {};
        this.embed.title = this.options.displayName;
		switch (this.options.gameType) {
			case Constants.TYPES.CASUAL:
				break;
				
			case Constants.TYPES.COOPERATIVE:
				this.embed.title += ': ' + this.players.map((p,i) => p.toString()).join(' & ');
				break;
				
			case Constants.TYPES.COMPETITIVE:
				this.embed.title += ': ' + this.players.map((p,i) => p.toString()).join(' vs. ');
				break;
		}
		return this.embed;
    }
    getPlayer(user) {
        return this.players.find(player => 
			player.user == user
			|| player.id == user.id
			|| player.username == user.username
			|| player.id == user
			|| player.username == user);
    }
    startGame(client) {
		if (!this.options.interface) {
			throw 'Missing "interface" in CONFIG.';
		}
		let reactions = this.options.interface.slice();
		if (this.options.howToPlay) {
			reactions.push(LiveMessage.HELP);
		}
		if (this.options.canRestart) {
			reactions.push(LiveMessage.NEW);
		}
		return this.setupReactionInterface(client, reactions);
    }
    startMove(client) {
		this.error = null;
        if (this.player.auto) {
            setTimeout(() => {
                if (this.closed || !this.player.auto) return;
                this.handleBotMove(client);
                this.edit(client);
            }, Constants.UPDATE_SPEED);
        } else {
            //this.startTimer(client);
        }
    }
    setNextTimer() {
        if (this.player.bot) {
            this.timer = 0;
        } else {
            this.timer = this.options.timeLimit;
        }
    }
    startTimer(client, time) {
        this.timer = time || this.timer;
        let interval = Math.min(this.timer, 10);
        this.playerTimeout = setTimeout(() => {
            this.stopTimer();
            this.timer -= interval;
            if (this.timer > 0) {
                this.startTimer(client);
                this.updateEmbed();
            } else {
                this.player.forfeit('waited too long');
                this.finishMove();
            }
            this.edit(client);
        }, interval * 1000);
    }
    stopTimer() {
        clearTimeout(this.playerTimeout);
    }
    finishMove() {
        this.stopTimer();
        this.rotatePlayers();
        this.setNextTimer();

        // if just 1 player remains amongst 2 or more who forfeited, then that player wins by default
        if(this.players.length > 1 && this.forfeitedPlayers.length == this.players.length - 1) {
            this.winner = this.player;
        } else {
            // check the winning condition and get the winning player, if solved
            this.winner = this.checkWinCondition();
        }
        
        if(typeof(this.winner) === 'number') {
            this.winner = this.players[this.winner-1]; // playerID -> playerIndex -> player
        } else if (!this.winner && this.options.maxTurns > -1 && this.turns > this.options.maxTurns) {
			this.winner = 'tie';
        } else {
			this.turns++;
		}

		this.updateEmbed();
    }
    rotatePlayers() {
		if (this.activePlayers.length) {
			do {
				this.playerIdx = (this.playerIdx + 1) % this.players.length;
			} while (this.player.inactive);
		}
    }
    handlePlayerMove(reaction) {
        throw 'You need to override MessageGame#handlePlayerMove()';
    }
    handleBotMove() {
        throw 'You need to override MessageGame#andleBotMove()';
    } 
    checkWinCondition() {
        throw 'You need to override MessageGame#checkWinCondition()';
    }
    toString() {
        throw 'You need to override MessageGame#toString()';
    }
	updateEmbed() {
        this.embed.description = this.toString();
		
		let color = this.color;
        if (color) {
            this.embed.color = color;
        } else {
			delete this.embed.color;
		}
		
        this.embed.fields = [];
        if (this.inactivePlayers.length && this.options.showSpectators) {
            this.embed.fields.push({
                name: 'Spectators',
                value: this.inactivePlayers.map(p => `${p.username}: ${p.reason}`).join('\n')
            });
        }
		let status = this.status;
		if (status) {
			this.embed.fields.push(status);
		}
		if (this.help && this.options.howToPlay) {
			this.embed.fields.push({
				name: 'How To Play',
				value: this.options.howToPlay
			});
		}
		if (this.error) {
			this.embed.color = 0xFF0000;
			this.embed.fields.push({
				name: 'Error',
				value: this.error
			})
		}
        return this.embed;
    }
}

// Game configuration
MessageGame.CONFIG      = Constants.CONFIG;
MessageGame.CASUAL      = Constants.TYPES.CASUAL;
MessageGame.COOP        = Constants.TYPES.COOP;
MessageGame.COMPETITIVE = Constants.TYPES.COMPETITIVE;

// Default Reactions
MessageGame.NEW   = LiveMessage.NEW;
MessageGame.CLOSE = LiveMessage.CLOSE;
MessageGame.HELP  = LiveMessage.HELP;

module.exports = MessageGame;
