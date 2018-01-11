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

const IGNORE_REGEX = /<.*>/gm;
const GT_REGEX = />*[^>\n]+/g;
const START_GT = '\n```css\n';
const END_GT   = '\n```\n';

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
		var gt = this.data.message = message.replace(IGNORE_REGEX, '').replace(/\s{2,}/g,'\n').match(GT_REGEX);
		if (gt && gt.some(ln => ln[0] == '>' && ln[1] != '>')) {
			return 'greentext';
		}
	},
	events: {
		greentext() {
			var gt = this.data.message;
			var inGT = false;
			gt = gt.map(line => {
				//console.log('Checking line:',line)
				if (line[0] == '>' && (inGT || line[1] != '>')) {
					if (!inGT) {
						line = START_GT + line;
						inGT = true;
					}
				} else if (inGT) {
					line = END_GT + line;
					inGT = false;
				}
				return line.trim();
			}).join('\n');
			if (inGT) {
				gt += END_GT;
			}
			return gt.trim();
		}
	}
}

