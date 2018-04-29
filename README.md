# discord-dragon-bot
My Node.js Discord bot featuring a vast library of commands with near-endless customization. Requires discord.io ^2.5.0 and bluebird ^3.5.0. Additional libraries may be required for certain commands, but may be ignored if you plan on running your own version.

# Installation
`npm install --save DragonOfMath/discord-dragon-bot`

# Setup
You will need to create a file called `init.json` with the following contents:
```js
{
	"token":   "...",
	"ownerID": "...",
	"permissions": 268790902,
}

```
* `token` contains the Discord OAuth token you get from [here](https://discordapp.com/developers/applications/me). It is required for running the bot.
* `ownerID` is your Discord user ID. It is required for identifying you for certain settings.
* `permissions` is the permission data the bot is given when it is added to a server. You can calculate this number [here](https://discordapp.com/developers/tools/permissions-calculator).

If you plan on using a database, create a folder in the root called `database` with the following .json files:
* `analytics.json` for counting command usage
* `permissions.json` for storing permission settings for commands
* `client.json` for keeping global data for the bot; used by the Mandelbrot and Reminder modules
* `servers.json`, `channels.json`, `roles.json`, and `users.json` for general data pertaining to those resources
  * `servers.json` is required for moderation, and is used by the CAH, blacklist, and greeting modules
  * `channels.json` is unused for now
  * `roles.json` is used by the Roles module
  * `users.json` is used by the Fishing and Pokemon modules

Additional setup may require more folders to be made.

# Run the Bot
```bat
node discord-dragon-bot
```
