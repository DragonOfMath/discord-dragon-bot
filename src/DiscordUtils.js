function find(o,a,x) {
	for (let id in o) {
		var k = o[id][a]
		if (k == x || (k instanceof Array && k.indexOf(x) > -1)) return id
	}
	return ''
}
function findAll(o,a,x) {
	let arr = []
	for (let id in o) {
		var k = o[id][a]
		if (k == x || (k instanceof Array && k.indexOf(x) > -1)) arr.push(id)
	}
	return arr
}

function hasContent(m) {
	return m.attachments.length > 0 || m.embeds.length > 0 || m.content.match(/https?:\/\//gi)
}

/**
	Creates an embed frame for the message object. Useful for testing previews of archives.
	@arg {Message} message object
*/
function embedMessage(message) {
	try {
		var embed = {
			title: `${message.author.username}#${message.author.discriminator}`,
			description: message.content,
			footer: {
				text: `ID: ${message.id}\nTimestamp: ${message.timestamp}`
			}
		}
		if (message.attachments.length || message.embeds.length) {
			embed.fields = []
			embed.fields.push({
				name: 'Attachments and Links',
				value: (messages.attachments.concat(messages.embeds)).map(x => x.url).join('\n')
			})
		}
		return embed
	} catch (e) {
		console.error(e)
	}
}

module.exports = {
	find,
	findAll,
	hasContent,
	embedMessage
}
