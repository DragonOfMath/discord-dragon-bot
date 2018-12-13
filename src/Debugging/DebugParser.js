const Logger = require('./LoggerMixin');
const Block  = require('../Parser/Block');
const Parser = require('../Parser/Parser');

class DebugParser extends Logger(Parser) {
	static createBlock(input, asCommand = false) {
		if (typeof(input) === 'string') {
			let instance = new DebugParser(input);
			input = instance.tokenize();
		}
		return new Block(input, asCommand);
	}
	tokenize() {
		this.log('==== Begin Tokenization ====');
		let tokens = super.tokenize();
		this.log('==== End Tokenization ====');
		return tokens;
	}
	skipWhitespace() {
		this.log('Skipping whitespace');
		super.skipWhitespace(...arguments);
		//this.log('  Next:', this.letter);
	}
	parseAny() {
		//this.log('Parse Any');
		let token = super.parseAny(...arguments);
		//this.log('  ->', token);
		return token;
	}
	parseChar() {
		this.log('Parse Char');
		let token = super.parseChar(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseEscape() {
		this.log('Parse Escape');
		let token = super.parseEscape(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseRaw() {
		this.log('Parse Raw');
		let token = super.parseRaw(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseNumber() {
		this.log('Parse Number');
		let token = super.parseNumber(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseBoolean() {
		this.log('Parse Boolean');
		let token = super.parseBoolean(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseString() {
		this.log('Parse String');
		let token = super.parseString(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseMultilineString() {
		this.log('Parse String (Block)');
		let token = super.parseMultilineString(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseInlineComment() {
		this.log('Parse Comment (Inline)');
		let token = super.parseInlineComment(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseBlockComment() {
		this.log('Parse Comment (Block)');
		let token = super.parseBlockComment(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseExpression() {
		this.log('Parse Expression');
		let token = super.parseExpression(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseArray() {
		this.log('Parse Array');
		let token = super.parseArray(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseObject() {
		this.log('Parse Object');
		let token = super.parseObject(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseRegex() {
		this.log('Parse Regular Expression');
		let token = super.parseRegex(...arguments);
		this.log('  ->', token);
		return token;
	}
	parseFlag() {
		this.log('Parse Flag');
		let token = super.parseFlag(...arguments);
		this.log('  ->', token);
		return token;
	}
}

module.exports = DebugParser;
