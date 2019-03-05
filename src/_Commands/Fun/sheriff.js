const Asset = require('../../Structures/Asset');
const {Markdown:md} = require('../../Utils');
const EmojiNames    = Asset.require('Text/emoji.json');

const SHERIFF = `⠀ ⠀ ⠀  🤠\n　   ???\n    ?   ?　?\n   👇   ?? 👇\n  　  ?　?\n　   ?　 ?\n　   👢     👢`;

module.exports = function sheriff(emoji = random(Object.keys(EmojiNames))) {
	return SHERIFF.replace(/\?/g, emoji)
		+ '\nhowdy. i\'m the sheriff of '
		+ (EmojiNames[emoji] || md.emojiName(emoji) || emoji);
};
