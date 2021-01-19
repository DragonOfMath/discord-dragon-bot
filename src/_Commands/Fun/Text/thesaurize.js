const Asset = require('../../../Structures/Asset');
const {capitalize,matchCase} = require('../../../Utils');
const Thesaurus = Asset.require('Text/thesaurus.json');

module.exports = function thesaurize(text) {
	return text.split(' ').map(word => {
		let _word = word.toLowerCase().match(/[\w\-]+/);
		if (_word && _word in Thesaurus) {
			_word = Thesaurus[_word];
			return matchCase(word, _word);
		} else {
			return word;
		}
	}).join(' ');
};
