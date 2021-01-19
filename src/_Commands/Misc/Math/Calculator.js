const MessageGame = require('../../../Sessions/MessageGame');
const {Math,Markdown:md} = require('../../../Utils');

const SOLVE = '🆗';
const BACKSPACE = '🔙';

const PLUS     = '➕';
const MINUS    = '➖';
const MULTIPLY = '✖';
const DIVIDE   = '➗';
const DECIMAL  = '▫';

const NUMBERS = [`0⃣`,`1⃣`,`2⃣`,`3⃣`,`4⃣`,`5⃣`,`6⃣`,`7⃣`,`8⃣`,`9⃣`];
const OPERATORS = [PLUS,MINUS,MULTIPLY,DIVIDE];

class Calculator extends MessageGame {
	constructor(context, expression = '') {
		super(context);
		this.init(expression);
	}
	init(expr = '') {
		super.init();
		this.expression = expr;
		this.eval = !!expr;
		if (this.eval) {
			this.finishMove();
		} else {
			this.updateEmbed();
		}
	}
	handlePlayerMove(reaction) {
		if (NUMBERS.includes(reaction)) {
			this.expression += String(NUMBERS.indexOf(reaction));
		} else if (OPERATORS.includes(reaction)) {
			switch (reaction) {
				case PLUS:
					this.expression += '+';
					break;
				case MINUS:
					this.expression += '-';
					break;
				case MULTIPLY:
					this.expression += '*';
					break;
				case DIVIDE:
					this.expression += '/';
					break;
			}
		} else {
			switch (reaction) {
				case DECIMAL:
					this.expression += '.';
					break;
				case BACKSPACE:
					this.backspace();
					break;
				case SOLVE:
					this.eval = true;
					break;
			}
		}
		this.finishMove();
		return true;
	}
	backspace() {
		if (this.expression.length) {
			this.expression = this.expression.substring(0, this.expression.length - 1);
		}
	}
	checkWinCondition() {
		if (this.eval) {
			this.eval = false;
			try {
				this.expression = String(eval(this.expression));
				return this.player;
			} catch (e) {
				return e;
			}
		}
	}
	get color() {
		if (this.winner) {
			if (this.winner == this.player) {
				return 0x00FF00;
			} else {
				return 0xFF0000;
			}
		}
	}
	get status() {
		if (this.winner instanceof Error) {
			return {
				name: 'ERROR',
				value: this.winner.toString()
			};
		}
	}
	toString() {
		return md.codeblock(this.expression||'_') + '\n'
		 + NUMBERS[7] + NUMBERS[8] + NUMBERS[9] + DIVIDE   + '\n'
		 + NUMBERS[4] + NUMBERS[5] + NUMBERS[6] + MULTIPLY + '\n'
		 + NUMBERS[1] + NUMBERS[2] + NUMBERS[3] + MINUS    + '\n'
		 + NUMBERS[0] + DECIMAL    + SOLVE      + PLUS     + '\n';
	}
}

Calculator.CONFIG = {
	gameType: MessageGame.CASUAL,
	howToPlay: 'This is just a novelty calculator. Use a real one, dammit.',
	maxBotPlayers: 0,
	interface: [...NUMBERS,DECIMAL,...OPERATORS,SOLVE,BACKSPACE]
};

module.exports = Calculator;
