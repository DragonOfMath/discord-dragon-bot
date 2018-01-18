function parseString(str) {
	var tokens = [], token = '', quote = '', esc = false;
	for (var letter of str.split('')) {
		if (esc) {
			esc = false;
		} else if (/\s/.test(letter) && !quote) {
			if (token) tokens.push(token);
			token = '';
			continue;
		} else if (letter == '\\') {
			esc = true;
			continue;
		} else if (letter == '"') {
			if (!quote) {
				quote = letter;
			} else {
				quote = '';
			}
			continue;
		}
		token += letter;
	}
	if (token) tokens.push(token);
	return tokens;
}

function escapeString(str) {
	var escStr = '';
	for (var letter of str.split('')) {
		if (letter == '\\' || letter == '"') {
			escStr += '\\';
		}
		escStr += letter;
	}
	return escStr;
}

module.exports = {parseString,escapeString};
