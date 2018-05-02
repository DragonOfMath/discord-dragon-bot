/*
	>greentext
	
	Parses text, and if it comes across >text, it will embed that text in a codeblock
	Example:
		>test >test
		yes >test
	
	Becomes:
		```fix
		>test
		>test
		```
		yes
		```fix
		>test
		```
*/

const {Markdown:md} = require('../Utils');

module.exports = {
	id: 'greentext',
	data: {
		message: ''
	},
	permissions: {
		type: 'exclusive',
		users: ['172002275412279296'] // tatsu
	},
	resolver({message}) {
		var gt = this.data.message = message.replace(/<.*>/gm, '').replace(/\s{2,}/g,'\n').match(/>*[^<>\n]+/g);
		if (gt && gt.some(ln => ln.startsWith('>') && ln[1] != '>')) {
			return 'greentext';
		}
	},
	events: {
		greentext() {
			var input = this.data.message;
			var output = '';
			var lines = '';
			var gt = false;
			for (var line of input) {
				if (line.startsWith('>') && (gt || line[1] != '>')) {
					if (!gt) {
						output += lines;
						lines = '';
						gt = true;
					}
				} else {
					if (gt) {
						output += md.codeblock(lines,'css');
						lines = '';
						gt = false;
					}
				}
				lines += line + '\n';
			}
			if (gt) {
				output += md.codeblock(lines,'css');
			} else {
				output += lines;
			}
			
			return output.trim();
		}
	}
}

