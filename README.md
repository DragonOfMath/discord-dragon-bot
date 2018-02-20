# discord-dragon-bot
NodeJS Discord client featuring flexible commands, custom permissions, and easy setup. Requires discord.io ^2.5.0 and bluebird ^3.5.0.

# Installation
To install DragonBot:
`npm install DragonOfMath/discord-dragon-bot`

# Setup
To setup DragonBot, include the following data in a file called `init.json`:
```js
{
	"token":   "...",
	"ownerID": "...",
	"version": "1.x.x",
	"permissions": 268790902,
	"source":  "https://github.com/DragonOfMath/discord-dragon-bot/",
	"prefix":  "!"
}
```
* `token` contains the Discord OAuth token you get from [here](https://discordapp.com/developers/applications/me). It is required for running the bot.
* `ownerID` is your Discord user ID. It is required for identifying you for certain settings.
* `version` is the current version of the bot. At the time of this typing, DragonBot runs 1.5.16.
* `permissions` is the permission data the bot is given when it is added to a server. You can calculate this number [here](https://discordapp.com/developers/tools/permissions-calculator).
* `source` is the GitHub repository of the bot's code. As it is licensed under MIT, anyone may use and change the code, but should always give credit where it is due.
* `prefix` identifies commands apart from regular text. It can be any character or string but it must go before the actual commands you give it.
# Run the Bot
```bat
node discord-dragon-bot
```
