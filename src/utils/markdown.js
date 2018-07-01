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
	static link(text, url) {
		return `[${text}](${url})`;
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
	static emoji(e,id) {
		if (typeof(e) === 'string' && e.startsWith(':') && e.endsWith(':')) {
			return e;
		} else {
			return id ? `<:${e.name||e}:${e.id||id}>` : `:${e.name||e}:`;
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
	static emojiID(x) {
		try {
			return x.match(/^<:(.+):(\d+)>$/).slice(1);
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
}

module.exports = {Markdown};
