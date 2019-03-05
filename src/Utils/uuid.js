/**
 * Generates a random UUID.
 * Format: xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx
 */
module.exports.UUID = function UUID() {
	function randint(i) {
		return Math.floor(i * Math.random()).toString(16);
	}
	return randint(0xFFFFFFFF).padStart(8,'0') + '-'
	+ randint(0xFFFF).padStart(4,'0') + '-'
	+ '4' + randint(0xFFF).padStart(3,'0') + '-'
	+ randint(0xFFFF).padStart(4,'0') + '-'
	+ randint(0xFFFFFFFF).padStart(8,'0')
	+ randint(0xFFFF).padStart(4,'0');
};
