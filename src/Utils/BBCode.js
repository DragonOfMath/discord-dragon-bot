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
		return (this.tag ? '[' + this.tag + (this.value ? '=' + this.value : '') + ']' : '')
		+ (this.children.map(c => c.toString()).join(''))
		+ (this.tag && !NO_END_TAG.includes(this.tag) ? '[/' + this.tag + ']' : '');
	}
	toMarkdown() {
		let markdown = this.children.map(c => c instanceof BBCode ? c.toMarkdown() : c.toString()).join('');
		return this.tag.toLowerCase() in TO_MD ? TO_MD[this.tag.toLowerCase()](markdown,this.value) : markdown;
	}
	static parse(text) {		
		let token = '', tokens = [];
		for (let i = 0, j, letter; i < text.length; i++) {
			if (text[i] == '[') {
				if (token) tokens.push(token);
				j = i;
				while (text[i] && text[i] != ']') i++;
				tag = text.substring(j,i+1);
				if (tag[1] == '/') {
					tag = tag.match(/\[\/(.+)\]/)[1];
					let value    = '';
					let children = [];
					while (tokens.length) {
						token = tokens.pop();
						if (!token) break;
						if (token.tag == tag) {
							token.children = children;
							break;
						} else {
							children.push(token);
						}
					}
				} else {
					[,tag,value] = tag.match(/\[(\w+)(?:=(.+))\]/);
					tag = new BBCode(tag,value);
					tokens.push(tag);
				}
			} else {
				token += text[i];
			}
		}
		
		return new BBCode('','',tokens);
	}
}

module.exports = {BBCode};
