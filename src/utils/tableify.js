function tableify(columns = [], rows = [], callback) {
	if (columns.length > 3) {
		throw 'Limit of 3 columns for correct embedding of the table.';
	}
	var fields = columns.map(name => ({
		name,
		value: '',
		inline: true
	}));
	var row;
	for (var i of rows) {
		row = callback(i);
		for (var r = 0; r < row.length; r++) {
			fields[r].value += String(row[r]) + '\n';
		}
	}
	return {fields};
}

module.exports = {tableify};