const FilePromise = require('../../Structures/FilePromise');
const {Jimp}      = require('../../Utils');
const Brainfuck  = require('./Brainfuck');
const Befunge    = require('./Befunge');
const Malbolge   = require('./Malbolge');
const Whitespace = require('./Whitespace');
const Piet       = require('./Piet');

function processFile(type = 'text', attachments, args, callback) {
	if (attachments[0]) {
		let url = attachments[0].url;
		let input = args.join(' ');
		if (type == 'image') {
			return processImage(url, input, callback);
		} else if (isUrl(url)) {
			return FilePromise.read(url, 'utf8')
			.then(code => callback(code, input));
		} else {
			throw 'You need to provide a valid text file!';
		}
	} else {
		let [code, ...input] = args;
		input = input.join(' ');
		if (type == 'image') {
			return processImage(code, input, callback);
		} else if (isUrl(code)) {
			return FilePromise.read(code, 'utf8')
			.then(code => callback(code, input));
		} else {
			return callback(code, input);
		}
	}
}
function processImage(url, input, callback) {
	if (isImage(url)) {
		return Jimp.read(url).then(image => callback(image, input));
	} else {
		throw 'You need to provide an image!';
	}
}
function isUrl(url) {
	try {
		return /https?\:\/\//.test(url);
	} catch (e) { return false; }
}
function isImage(url) {
	try {
		return ['jpeg','jpg','png','gif'].includes(url.split('.').pop().split('?')[0]);
	} catch (e) { return false; }
}

module.exports = {
	'brainfuck': {
		category: 'Programming',
		title: 'Brainfuck Interpreter',
		info: 'Run a Brainfuck program. You may type your code in a code block or upload a file to run. https://en.wikipedia.org/wiki/Brainfuck',
		parameters: ['[code]','[input]'],
		flags: ['d|debug','s|strict'],
		permissions: 'inclusive',
		fn({attachments,flags,args}) {
			let debug  = flags.get('d') || flags.get('debug');
			let strict = flags.get('s') || flags.get('strict');
			strict = (!strict || strict === 'false') ? false : true;
			return processFile('text', attachments, args, (code, input) => {
				let interp = new Brainfuck(code, {debug,strict});
				return interp.run(input);
			});
		}
	},
	'befunge': {
		category: 'Programming',
		title: 'Befunge Interpreter',
		info: 'Run a Befunge program. You may type your code in a code block or upload a file to run. You can specify a version such as 93 or 98. https://en.wikipedia.org/wiki/Befunge',
		parameters: ['[code]','[input]'],
		flags: ['d|debug','v|version'],
		permissions: 'inclusive',
		fn({attachments,flags,args}) {
			let debug   = flags.get('d') || flags.get('debug');
			let version = flags.get('version') || flags.get('v') || 93;
			return processFile('text', attachments, args, (code, input) => {
				let interp = new Befunge(code, {debug,normalize:true,version});
				return interp.run(input);
			});
		}
	},
	'malbolge': {
		category: 'Programming',
		title: 'Malbolge Interpreter',
		info: 'Run a Malbolge program. You may type your code in a code block or upload a file to run. https://en.wikipedia.org/wiki/Malbolge',
		parameters: ['[code]', '[input]'],
		flags: ['d|debug'],
		permissions: 'inclusive',
		fn({attachments,flags,args}) {
			let debug = flags.get('d') || flags.get('debug');
			return processFile('text', attachments, args, (code, input) => {
				let interp = new Malbolge(code, {debug});
				return interp.run(input);
			});
		}
	},
	'whitespace': {
		category: 'Programming',
		title: 'Whitespace Interpreter',
		info: 'Run a Whitespace program (use S for space, T for tab, and L for newline). You may type your code in a code block or upload a file to run. https://en.wikipedia.org/wiki/Whitespace_(programming_language)',
		parameters: ['[image]','[input]'],
		flags: ['d|debug'],
		permissions: 'inclusive',
		fn({attachments,flags,args}) {
			let debug = flags.get('d') || flags.get('debug');
			return processFile('text', attachments, args, (code, input) => {
				let interp = new Whitespace(code, {debug,normalize:true});
				return interp.run(input);
			});
		}
	},
	'piet': {
		category: 'Programming',
		title: 'Piet Interpreter',
		info: 'Run a Piet program. Since all Piet programs are images, you must upload a file or link one. Optional flags include `-t` for tracing (for simpler programs), and `-cs:value` for codel size. http://www.dangermouse.net/esoteric/piet.html',
		parameters: ['[image]','[input]'],
		flags: ['d|debug','t|trace','cs|codelsize'],
		permissions: 'inclusive',
		fn({attachments,flags,args}) {
			let debug     = flags.get('d')  || flags.get('debug');
			let trace     = flags.has('t')  || flags.has('trace');
			let codelSize = flags.get('cs') || flags.get('codelsize') || 1;
			return processFile('image', attachments, args, (code, input) => {
				let interp = new Piet(code, {debug,trace,codelSize});
				return interp.run(input);
			});
		}
	}
};
