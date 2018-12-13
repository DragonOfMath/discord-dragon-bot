const Resource = require('../../../Structures/Resource');
const FilePromise = require('../../../Structures/FilePromise');
const {random} = require('../../../Utils');

const DIR = __dirname + '/markov.json';
const WORD_REGEX = /[\b\s]+/;
const MARKOV_TEMPLATE = {
	nodes: [],
	chains: [],
	heads: []
};

class Markov extends Resource {
	constructor(markov) {
		super(MARKOV_TEMPLATE, markov);
	}
	add(x,c) {
		var xi = this.nodes.indexOf(x);
		if (xi === -1) {
			xi = this.nodes.length;
			this.nodes.push(x);
			this.chains.push([]);
		}
		if (c) {
			var ci = this.nodes.indexOf(c);
			if (ci > -1 && !this.chains[ci].includes(xi)) {
				this.chains[ci].push(xi);
			}
		} else if (!this.heads.includes(xi)) {
			this.heads.push(xi);
		}
	}
	digest(text, sliceSize = 1) {
		var off = sliceSize - 1;
		var words = text.split(WORD_REGEX);
		if (words.length <= sliceSize) return;
		for (var i = off, node, lastNode; i < words.length; i++) {
			lastNode = node;
			node = words.slice(i - off, i + 1).join(' ');
			this.add(node, lastNode);
		}
		return this;
	}
	output(iterations = 20, seed) {
		var node = '', xi;
		if (seed) xi = this.nodes.indexOf(seed);
		else xi = random(this.heads);
		var str = node = this.nodes[xi];
		while (iterations-- > 0 && node) {
			xi   = random(this.chains[xi]);
			node = this.nodes[xi];
			if (node) {
				// stitch together the nodes into a sentence (the slice of the node has two words)
				str +=  ' ' + node.split(' ').pop();
			}
		}
		return str;
	}
	save() {
		return Markov.save(this);
	}
	static load() {
		return new Markov(FilePromise.readSync(DIR));
	}
	static save(data) {
		return FilePromise.createSync(DIR, data);
	}
	static clear() {
		return FilePromise.createSync(DIR, new Markov());
	}
}

module.exports = Markov;
