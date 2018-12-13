const FileCollector = require('../Structures/FileCollector');
module.exports = new FileCollector().load(__dirname, {
	recursive: false,
	filter(filename) {
		return filename !== 'index.js' && filename;
	}
});
