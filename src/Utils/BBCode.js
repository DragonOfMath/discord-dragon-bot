const {Markdown:md} = require('./Markdown');

const TO_MD = {
	b: md.bold,
	bold: md.bold,
	i: md.italics,
	italics: md.italics,
	s: md.strikethrough,
	strike: md.strikethrough,
	strikethrough: md.strikethrough,
	u: md.underline,
	underline: md.underline,
	url: md.link,
	link: md.link,
	pre: md.code,
	code: md.codeblock
};

const NO_END_TAG = ['*'];
const TAG_START_RGX = /\[(\w+)(?:[=\s](.+)?)?\]/;
const TAG_END_RGX = /\[\/(.+)\]/;

class BBCode {
	constructor(tag = '', value = '', children = []) {
		this.tag   = tag;
		this.value = value;
		if (typeof(children) === 'string') {
			children = [children];
		}
		this.children = children;
	}
	toString() {
		return (this.tag ? ('[' + this.tag + (this.value ? '=' + this.value : '') + ']') : '')
		+ (this.children.map(c => c.toString()).join(''))
		+ (this.tag && !NO_END_TAG.includes(this.tag) ? '[/' + this.tag + ']' : '');
	}
	toMarkdown() {
		let markdown = this.children.map(c => c instanceof BBCode ? c.toMarkdown() : c.toString()).join('');
		return this.tag.toLowerCase() in TO_MD ? TO_MD[this.tag.toLowerCase()](markdown,this.value) : markdown;
	}
	static parse(text) {		
		let token = '', tokens = [], tag, value, children;
		for (let i = 0, j, letter; i < text.length; i++) {
			if (text[i] == '[') {
				if (token) tokens.push(token);
				j = i;
				while (text[i] && text[i] != ']') i++;
				token = text.substring(j,i+1);
				if (token[1] == '/') {
					[,tag] = token.match(TAG_END_RGX);
					children = [];
					while (tokens.length) {
						token = tokens.pop();
						if (!token) break;
						if (token.tag == tag) {
							token.children = children;
							tokens.push(token);
							break;
						} else {
							children.push(token);
						}
					}
				} else {
					[,tag,value] = token.match(TAG_START_RGX);
					tokens.push(new BBCode(tag,value));
				}
				token = '';
			} else {
				token += text[i];
			}
		}
		if (token) tokens.push(token);
		
		return new BBCode('','',tokens);
	}
}

module.exports = {BBCode};
