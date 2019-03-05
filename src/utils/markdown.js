const {truncate,substrcmp} = require('./string');

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
	static spoiler(x) {
		return `||${x}||`;
	}
	static link(text, url) {
		return `[${text}](${url})`;
	}
	static header(text, level = 1) {
		return '#'.repeat(level) + ' ' + text;
	}
	static list(items) {
		return items.map(item => ' * ' + item).join('\n');
	}
	static mention(u) {
		if (isNaN(+u.id) && isNaN(+u)) {
			return u;
		} else {
			return `<@${u.id||u}>`;
		}
	}
	static channel(c) {
		if (isNaN(+c.id) && isNaN(+c)) {
			return c;
		} else {
			return `<#${c.id||c}>`;
		}
	}
	static role(r) {
		if (isNaN(+r.id) && isNaN(+r)) {
			return r;
		} else {
			return `<@&${r.id||r}>`;
		}
	}
	static emoji(e,id,a) {
		if (typeof(e) === 'string' && ((e.startsWith(':') && e.endsWith(':')) || e.charCodeAt(0) > 127)) {
			return e;
		} else {
			return (e.id || id) ? `<${(e.animated||a)?'a':''}:${e.name||e}:${e.id||id}>` : `:${e.name||e}:`;
		}
	}
	static preventEmbed(x) {
		return `<${x}>`;
	}
	static tts(x) {
		return `/tts ${x}`;
	}
	static shrug(x) {
		return x + '¯\\_(ツ)_/¯';
	}
	static tableflip(x) {
		return x + '(╯°□°）╯︵ ┻━┻';
	}
	static unflip(x) {
		return x + '┬─┬ ノ( ゜-゜ノ)';
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
	static emojiName(x) {
		try {
			return x.match(/^<a?:(.+):(\d+)>$/)[1];
		} catch (e) {
			return '';
		}
	}
	static emojiID(x) {
		try {
			return x.match(/^<a?:(.+):(\d+)>$/)[2];
		} catch (e) {
			return '';
		}
	}
	static atUser(user, discriminator) {
		return `@${user.username||user}#${user.discriminator||discriminator}`;
	}
	static atChannel(channel) {
		return `#${channel.name||channel}`;
	}
	static atRole(role) {
		return `@${role.name||role}`;
	}
	
	/**
	 * Parse markdown text into an object that holds the title and sections.
	 * @param {String} text - the contents in markdown format
	 * @returns An object with a title string and an array of sections, each with a type, title, indexStart, indexEnd, and text value.
	 */
	static parse(text) {
		let titleRgx  = /^# (.+)$/m;
		let headerRgx = /^(#{2,3}) (.+)$/gm;
		
		let doc = {
			title: text.match(titleRgx),
			sections: []
		};
		
		let match, nextMatch, type, titleStart, titleEnd, sectionStart, sectionEnd;
		
		nextMatch = headerRgx.exec(text);
		while (nextMatch) {
			match     = nextMatch;
			nextMatch = headerRgx.exec(text);
			
			titleStart   = match.index;
			titleEnd     = match.index + match[0].length;
			sectionStart = titleEnd + 1;
			sectionEnd   = nextMatch === null ? text.length : nextMatch.index;
			
			doc.sections.push({
				type: match[1].length,
				title: match[2],
				indexStart: sectionStart,
				indexEnd: sectionEnd,
				text: text.substring(sectionStart, sectionEnd)
			});
		}
		
		return doc;
	}
	
	/**
	 * Look up the contents of a section in a markdown-formatted string, and return the results as an embed.
	 * @param {String|Object} text - the markdown contents
	 * @param {String} [sectionName] - the section to look for by title, else the first section is used
	 * @returns An embed object containing the contents of the section, truncated to fit within Discord's limits.
	 */
	static getSection(text, sectionName) {
		// parse the text into an object
		if (typeof(text) === 'string') {
			text = this.parse(text);
		}
		
		// find the hoisted section
		let sectionIdx = -1;
		if (sectionName) {
			sectionIdx = text.sections.findIndex(sec => substrcmp(sec.title, sectionName));
		} else {
			sectionIdx = 0;
		}
		if (sectionIdx < 0) {
			throw 'Invalid section: ' + sectionName;
		}
		
		let section = text.sections[sectionIdx];
		let hoistedType = section.type;
		
		// create the base embed using the hoisted section
		let embed = {
			title: truncate(section.title, 100),
			description: truncate(section.text, 2000),
			fields: []
		};
		
		// keep count of how many chars were used to avoid an oversized payload
		let totalChars = embed.title.length + embed.description.length;
		let field;
		
		// add subsections
		while ((section = text.sections[++sectionIdx]) && (section.type > hoistedType)) {
			field = {
				name: truncate(section.title, 100),
				value: truncate(section.text, 1000)
			};
			totalChars += field.name.length + field.value.length;
			if (totalChars < 5000) {
				embed.fields.push(field);
			} else break;
		}

		return embed;
	}
}

module.exports = {Markdown};
