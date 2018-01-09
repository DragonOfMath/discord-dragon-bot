/**
	Credit to NNTin on GitHub for the algorithm: https://github.com/NNTin/Cubify-Reddit/blob/master/cubify.py
*/
module.exports = {
	id: 'wordcubify',
	title: '',
	info: 'Turn T E X T into a letter cube.',
	permissions: {
		type: 'public'
	},
	resolver({message}) {
		if (message == message.toUpperCase() && /\w( \w){3,}/gm.test(message)) {
			return 'wc';
		}
	},
	events: {
		wc({message}) {
			message = message.replace(/\s+/g,''); // remove spaces
			var thing = '';
			if (message.length < 5) {
				thing += message.split('').join(' ')
				for (let i=1;i<message.length;i++) thing += '\n' + message[i]
			} else if (message.length < 30) {
				var len = message.length
				var size   = ~~(len * 3 / 2)
				var matrix = new Array(size).fill('').map(x => new Array(size).fill(' '))
				var gap    = ~~(len / 2)
				var cor = 0
				if (len % 2 == 0) cor = 1
				try {
					for (let i = 0; i < len; i++) {
						// horizontal
						matrix[0][gap+i] = 
						matrix[gap][i] = 
						matrix[2*gap-cor][gap+(len-1-i)] = 
						matrix[3*gap-cor][(len-1-i)] = message[i];
						// vertical
						matrix[gap+i][0] = 
						matrix[i][gap] = 
						matrix[(len-1-i)][3*gap-cor] = 
						matrix[gap+(len-1-i)][2*gap-cor] = message[i];
					}
					for (let i = 1; i < gap; i++) {
						// diagonals
						matrix[gap-i][i] =
						matrix[gap-i][2*gap+i-cor] =
						matrix[3*gap-i-cor][i] =
						matrix[3*gap-i-cor][2*gap+i-cor] = '/';
					}
					thing = '```\n' + matrix.map(a => a.join(' ')).join('\n') + '\n```'
				} catch (e) {
					console.log(e)
					return;
				}
			} else {
				return;
			}
			return thing;
		}
	}
}

