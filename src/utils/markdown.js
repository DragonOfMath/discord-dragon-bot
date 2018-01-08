class Markdown {
	static bold(x) {
		return `**${x}**`;
	}
	static italics(x) {
		return `*${x}*`;
	}
	static underline(x) {
		return `__${x}__`;
	}
	static strikethrough(x) {
		return `~~${x}~~`;
	}
	static code(x) {
		return `\`${x}\``;
	}
	static codeblock(x, lang = 'js') {
		return `\`\`\`${lang}\n${x}\n\`\`\``;
	}
	static mention(u) {
		if (isNaN(+u)) {
			return u;
		} else {
			return `<@${u}>`;
		}
	}
	static channel(c) {
		if (isNaN(+c)) {
			return c;
		} else {
			return `<#${c}>`;
		}
	}
	static role(r) {
		if (isNaN(+r)) {
			return r;
		} else {
			return `<@&${r}>`;
		}
	}
	static emoji(e,id) {
		return id ? `<:${e}:${id}>` : `:${e}:`;
	}
	static preventEmbed(x) {
		return `<${x}>`;
	}
	static tts(x) {
		return `/tts ${x}`;
	}
	static id(x) {
		try {
			return x.match(/[:@#&!]?(\d+)>$/)[1];
		} catch (e) {
			return '';
		}
	}
	static userID(x) {
		try {
			return x.match(/^<@!?(\d+)>$/)[1];
		} catch (e) {
			return '';
		}
	}
	static channelID(x) {
		try {
			return x.match(/^<#(\d+)>$/)[1];
		} catch (e) {
			return '';
		}
	}
	static roleID(x) {
		try {
			return x.match(/^<@&(\d+)>$/)[1];
		} catch (e) {
			return '';
		}
	}
	static emojiID(x) {
		try {
			return x.match(/^<:(.+):(\d+)>$/).slice(1);
		} catch (e) {
			return '';
		}
	}
}

module.exports = {Markdown};
