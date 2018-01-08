/**
	Case-insensitive string comparison
*/
function strcmp(a,b) {
	return String(a).toLowerCase() == String(b).toLowerCase();
}

module.exports = {strcmp};
