function tableify(columns = [], rows = [], callback) {
	if ((columns.length > 3 && columns.length % 3 !== 0) || columns.length > 24) {
		throw '# of columns must be a multiple of 3 and not be more than 24.';
	}
	var fields = columns.map(name => ({
		name,
		value: '',
		inline: true
	}));
	var row, item, r;
	for (item of rows) {
		row = callback(item);
		for (r = 0; r < row.length; r++) {
			fields[r].value += String(row[r]) + '\n';
		}
	}
	return {fields};
}

module.exports = {tableify};