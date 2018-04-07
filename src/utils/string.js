/**
	Case-insensitive string comparison
*/
function strcmp(a,b) {
	return String(a).toLowerCase() == String(b).toLowerCase();
}

/**
	Truncate text to a fixed length
*/
function truncate(text,limit) {
	if (text.length > limit) {
		text = text.substring(0,limit-3) + '...';
	}
	return text;
}

/**
	Escapes quote marks
*/
function escape(text) {
	return text.replace(/\\|"/g, match => '\\' + match);
}

/**
	Turns raw string into a quoted string
*/
function quote(text) {
	return '"' + escape(text) + '"';
}

module.exports = {strcmp,truncate,escape,quote};
