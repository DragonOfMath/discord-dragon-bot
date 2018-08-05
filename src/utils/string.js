/**
	Case-insensitive string comparison
*/
function strcmp(a,b) {
	return String(a).toLowerCase() == String(b).toLowerCase();
}
function substrcmp(a,b) {
	return String(a).toLowerCase().indexOf(String(b).toLowerCase()) > -1;
}

/**
	Capitalization of a word
*/
function capitalize(x) {
	x = String(x);
	return x[0].toUpperCase() + x.substring(1);
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
	Escapes Regex special chars
	https://stackoverflow.com/a/6969486
*/
function escapeRegExp(text) {
	return text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

/**
	Turns raw string into a quoted string
*/
function quote(text) {
	return '"' + escape(text) + '"';
}

/**
	checks if the substring at the given index matches
	(alternatively, if text is an array, does a simple comparison)
*/
function includesAt(text, sub, idx) {
	if (typeof(text) === 'string') {
		return text.substr(idx, sub.length) == sub;
	} else {
		return text[idx] == sub;
	}
}


/**
	Returns the string inside an HTML tag
*/
function innerHTML(html) {
	try {
		return html.match(/<[^<>]+>(.+)<\/[^<>]+>$/)[1].trim();
	} catch (e) {
		return html;
	}
}

/**
	Replaces entities such as &amp; with &
*/
const HTML_ENTITY = /&#?(.+);/g;
const ENTITY_MAP = {
	'lt': '<',
	'gt': '>',
	'amp': '&',
	'quot': '"',
	'apos': '\'',
	'cent': '¢',
	'pound': '£',
	'yen': '¥',
	'euro': '€',
	'copy': '©',
	'reg': '®'
};
function unescapeHTMLEntities(text) {
	return text.replace(HTML_ENTITY, function (html, code) {
		return ENTITY_MAP[code] || String.fromCharCode(code) || code;
	});
}

/**
	Checks if a string is all uppercase
*/
function isUpperCase(text) {
	return text === text.toUpperCase();
}

/**
	Checks if a string is all lowercase
*/
function isLowerCase(text) {
	return text === text.toLowerCase();
}

/**
	Matches a MD5 hash in the string
*/
function md5(text) {
	return text.match(/[0-9a-f]{32}/i);
}

module.exports = {
	strcmp,
	substrcmp,
	capitalize,
	truncate,
	escape,
	escapeRegExp,
	quote,
	includesAt,
	innerHTML,
	unescapeHTMLEntities,
	isUpperCase,
	isLowerCase,
	md5
};
