# discord-dragon-bot
My personal Node.js Discord bot featuring a vast library of commands with near-endless customization. Its main prefix is `🐉`.

## Installation
```bat
npm install DragonOfMath/discord-dragon-bot
```


## Setup
Pass an object to the client constructor with the following keys:
```js
{
	"token":   "...", // Discord auth token
	"ownerID": "...", // your Discord ID, not your name or discriminator
	"permissions": 268790902, // or some other value
	"apiKeys": {...} // additional API keys
}
```

### Links
 * [Here is where you get your OAuth token](https://discordapp.com/developers/applications/me).
 * [Here is where you can calculate the permissions you need](https://discordapp.com/developers/tools/permissions-calculator).

### Database
 * `analytics` for counting command usage
 * `block` for the client's block list
 * `permissions` for storing permission settings for commands
 * `moderation` for moderation housekeeping
 * `client` for keeping global data for the bot; used by the Mandelbrot and Reminder modules
 * `servers` is required for moderation, and is used by the CAH, blacklist, and greeting modules
 * `channels` is unused for now
 * `roles` is used by the Roles module
 * `users` is used by the Fishing and Pokemon modules

 
## Commands
 * DragonBot's main prefix is the dragon emoji "🐉", but can also have custom prefixes.
 * There are over 500 commands built into the client, and many more on the way.
 * Commands are broken into categories, subcommands, and even metacommands.
 * Commands can be restricted to privileged users, the bot owner, or to any whitelist/blacklist of users/servers/channels.

See `src/Commands/README.md` for an in-depth guide on command usage.


## Sessions
 * These are multi-purpose data structures made to retain data or provide special responses.
 * They can be loaded from modules and remain active while the bot is online.
 * They can be generated on the fly and expire after a period of time.
 * They can receive messages and respond if necessary.
 * They can trigger events or be called each 1-second cycle.

See `src/Sessions/README.md` for more information on sessions.


## Database
 * DragonBot uses a homemade JSON database framework. It's not the best for large-scale use, but it's great for my experimenting.
 * The tables are loaded into memory during initialization and only writes to their files when called.
 * It requires many of the listed tables to function correctly.

See `src/Database/README.md` for more details about the database and how to use it.