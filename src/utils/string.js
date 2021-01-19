//const {extend} = require('./extend');

/**
	Case-insensitive string comparison
*/
function strcmp(a,b) {
	return String(a).toLowerCase() == String(b).toLowerCase();
}
function substrcmp(a,b) {
	return String(a).toLowerCase().indexOf(String(b).toLowerCase()) > -1;
}

function matchCase(a,b) {
	//if (isUpperCase(a)) return b.toUpperCase();
	//if (isLowerCase(a)) return b.toLowerCase();
	let max = Math.min(a.length, b.length);
	for (let i = 0; i < max; i++) {
		if (isUpperCase(a[i])) {
			b[i] = b[i].toUpperCase();
		} else {
			b[i] = b[i].toLowerCase();
		}
	}
	return b;
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
	return text && text === text.toUpperCase();
}

/**
	Checks if a string is all lowercase
*/
function isLowerCase(text) {
	return text && text === text.toLowerCase();
}

/**
	Checks if a character is whitespace
*/
function isWhitespace(x) {
	return x && x.match(/\s/);
}

/**
	Checks if a character is whitespace outside the ASCII range
*/
function isUnicodeWhitespace(x) {
	return x && x.match(/\s/) && (x == '\ufeff' || x == '\u200b' || x == '\u00a0');
}

/**
	Matches a MD5 hash in the string
*/
function md5(text) {
	return text && text.match(/[0-9a-f]{32}/i);
}

/**
	Splits comma-separated values
*/
function parseCSV(values) {
	if (values instanceof Array) {
		values = values.join(' ');
	}
	return values.split(/,\s*/);
}

/**
	Convert text such as "Sample Text!" into keywords = ["sample","text"]
*/
function keywordify(text) {
	return text.toLowerCase().match(/[\w\d&]+/g);
}
/**
	Perform keyword search using an array of items and a query, returning the results by relevancy
*/
function kwsearch(items, query, iteratee = x => x) {
	query = keywordify(query);
	return items.map(item => {
		let score;
		if (query.length) {
			let text = iteratee(item);
			let kwds = typeof(text) == 'string' ? keywordify(text) : text;
			score = query.reduce((s,q) => {
				if (kwds.includes(q)) s += q.length;
				return s;
			}, 0);
		} else {
			score = 1;
		}
		return {score,item};
	})
	// remove items with no matches at all
	.filter(m => m.score)
	// order by relevancy score
	.sort((m1,m2) => m1.score > m2.score ? -1 : m2.score > m1.score ? 1 : 0);
}

/**
 * Shows the difference between two strings.
 */
function showDifference(str1, str2) {
	let diff = '', min = Math.min(str1.length, str2.length), max = Math.max(str1.length, str2.length);
	for (let i = 0, j = 0; i < min && j < min;) {
		if (str1[i++] == str2[j++]) {
			diff += ' ';
		} else {
			diff += '^';
		}
	}
	return diff;
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
	matchCase,
	isWhitespace,
	isUnicodeWhitespace,
	md5,
	parseCSV,
	keywordify,
	kwsearch,
	showDifference
};
