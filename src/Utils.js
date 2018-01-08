const FileCollector = require('./FileCollector');

const Utils = {};

var fc = new FileCollector();
fc.load(__dirname + '/utils');
fc.forEach((mod, file) => {
	//console.log('Module:',mod);
	for (let item in file) {
		//console.log('  Utility:',item);
		Utils[item] = file[item];
	}
});

//console.log(Utils);

module.exports = Utils;