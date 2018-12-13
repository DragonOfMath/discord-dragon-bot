const FileCollector = require('../Structures/FileCollector');
(function () {
	let fc = new FileCollector();
	fc.load(__dirname, {
		filter(filename) {
			return filename !== 'index.js' && filename;
		}
	});
	for (let mod in fc) {
		Object.assign(module.exports, fc[mod]);
	}
})();
