# Changelog

## Version 3.0 Coming soon...

I have made the decision to replace the core dependency on discord.io with discord.js instead. Due to the lack of maintenance, the old library is broken in newer versions of the Discord API. Besides, having an up-to-date library with 100% support of Discord features makes things a whole lot easier for me.

I will be archiving the current code in this repo before I begin overhauling it all to ES6 modules and cleaning things up for version 3...

## 2.1.0 Big Update

It has been a while since the last update, and this one brings tons of new features to the table as well as many bugfixes. I can't call this a major major update, though, as it just extends the command list some more without changing the core framework that much.

Commands now support a per-user cooldown feature that replaces the legacy method of storing cooldowns in the database. This prevents computationally-expensive features and freebie commands from being spammed.

### New Commands/Functions
 * `beg`: beg for small amounts of money
 * `checkers`: play a game of checkers
 * `chess`: play a game of chess
 * `color.palette`: now accepts multiple arguments to make a palette from CSS color values
 * `commands.alias`: add aliases to commands
 * `commands.cooldown`: set cooldowns for commands
 * `commands.settings`: admin command to modify a command's settings
 * `complex`: evaluate or graph a complex function
 * `df`: generate a Dwarf Fortress world (experimental until I can better tune its tax on my computer)
 * `e621.ify`: posterizes an image to the e621 color palette
 * `food`: order food from a variety of fast food restaurants (for fun, not a real ordering system)
 * `fractal`: replacement for `mset` that renders for any iterative complex function of z, not just z^2+c
 * `halloween`: transform your avatar/any image to Halloween colors!
 * `how`: a question command, e.g. "how X is Y", with numerous adjectives to use
 * `job/work`: make a fake living in your dream job
 * `mc.armor`: make an armor set from any blocks or items[4]
 * `mc.items`: display a list of all valid Minecraft items[4]
 * `pokemon.spawns`: assign a channel for spawning pokemon during activity[1]
 * `pokemon.hint`: provide a hint about a pokemon that has spawned
 * `reddit.comments`: read top-level comments on a post
 * `reddit.download`: use ripsave.com to get a downloadable link for reddit videos
 * `reminder -repeat`: receive a reminder at given intervals
 * `reminder.repeat`: modify an existing reminder to repeat or stop repeating
 * `reminder.upcoming`: list all your upcoming reminders in the order that you'll receive them
 * `retrowave`: transform your avatar/any image to the Retrowave/Outrun style!
 * `rolemenu`: new interface to create and manage interactable role selection menus
 * `sb`: render text in Scratchblocks[2]
 * `unzws`: obscure text command to remove hidden unicode characters from a string[3]
 * `vaporwave`: text command to write in "vaporwave" letters
 * `vslots`: video slots, a 5-column variant of slot machine with multiple ways of winning each spin

### New Utilities
 * `Generic`, a new abstract class for predictable serialization
 * `Complex`, `ComplexFunction`, `ComplexGraph`, `ComplexShader`, and `Ratio`
 * `Tokenizer` for parsing math expressions
 * `Object`, `Array`, `Function`, `String`, `Date`, and `Math` extended
 * `2d.js` extended
   * `Dimensions` renamed to `Area`
   * `Rectangle`, `Triangle`, and `Polygon` added
   * `Path` from `jimp.js` moved to here
 * `Jimp#posterize`, `Jimp#drawPolygon`, and `Jimp#fillPolygon` added
 * `Color#hex` and `Color#manhattan` added
 * `ColorGradient` constructor accepts an array of Colors
 * `ColorGradient#sample` to make getting a color simpler
 * `DiscordUtils.serializeReaction` and `DiscordUtils.emojifyReaction` (originally from `Poll.js`)

### Bugfixes/Misc changes
 * Client can open SyntaxError locations in Notepad++ during bootup.
 * `DragonClient#moveMessages` more flexible than ever
 * `Command#init` called when client first connects after startup, allowing certain features to persist.
 * fixed a crash when a command token was a non-string
 * `membercount` graph supports a dark mode setting
 * downtime duration is recorded
 * `info.snowflake` checks for role
 * `info.token` is public
 * fixed message search
 * updated user and role search results
 * `handleUserAction` method name change
 * `welcome.role` accepts a role name or ID
 * fixed transferring money
 * `slots.table` merged into parent command
 * slot machine payout rebalanced again for the last time
 * `rate` message improved
 * text commands moved into their own folder
 * `thesaurize` fixed
 * `portmanteau` improved when combining dissimilar things
 * `gif.spin` downsizes large images to 100x100
 * `graph` applies dark mode instead of `Graph`
 * `Graph` auto-fitting and interval marking greatly improved
 * `image-utils` simplified
 * `poly` supports dark mode
 * `Interpreter` debugging fixed
 * `Piet` interpreter fixed
 * `Piet` debug tracing avoids massively inflated output file dimensions
 * `Whitespace` interpreter/debugging fixed
 * `roman` numeral conversion fixed
 * url and username banlists fixed
 * `fa.user` embed fixed
 * `bank.leaderboard` fixed
 * `bank.invest check all` added
 * pokemon spawning events
 * reddit session cancels subscriptions for deleted channels
 * removing all subreddits from a subscription resets the polling time ref
 * `reminder` messages describe how long ago it should've been fulfilled when the bot is down for long periods
 * original principle invested is displayed in `Investment` embeds
 * `DARK_MODE` copied to client
 * more event handlers for guild updating, channels, and message deletion
 * better error logging for websocket responses
 * global mention filtering affects non-embed messages only
 * `DragonClient#getConstant` method added
 * choice parameters are case-sensitive, always
 * extended `RECONNECT_AFTER` from 1 minute to 5 minutes
 * added symbol constants for BOM, ZWS, and NBSP
 * `Parser` ignores hidden whitespace except in quoted arguments
 * `LiveMessage` and `Session` now use async/await
 * `LiveMessage`s have new `persistent` flag to save their data and remember a message after shutdown
 * `Asset.load` accepts encoding parameter
 * `FilePromise` directory deletion added (with failsafes)
 * `Handler.resolve` null handling fixed
 * `MessageContext` now has `links` and `images`
 * `DiscordUtils.getCreationTime` fixed for >32-bit values
 * `DiscordUtils.find` supports more search filters: by user, including text, and before/after a message ID
 * table embed fixed
 * `extend` util improved
 * `Markdown` ID resolution improved
 * `Date.parseDuration` fixed and more versatile
 * `MessageContext` now collects images from attachments and embeds correctly
 * `Array2D` removed
 * `pi` digit generator now uses native BigInt instead of a third-party library
 * `Sudoku` autosolver and randomizer properly implemented
 
### Removed Commands
 * `commands.enable`/`commands.disable`. The original functions have been merged with the supercommand. The new functions are now aliases for `commands.toggle` which is a private command for toggling commands globally.`
 * `fish.wait` removed with the push for a cooldown feature for all commands.
 * `alias` has been moved to a subcommand under `commands`.
 * `pokemon.identify` removed due to Pokecord shutting down.
 * `mandelbrot` has been replaced by `fractal`, a much more flexible IFS renderer.

### Footnotes:
[1] Pokecord is (later, was) a popular Discord Bot that spawned pokemon during times of activity in a server, which made for long term competitions to catch rare variants of them. Due to shutting down unexpectedly, I have implemented my own pokemon spawner into this bot. All pokemon are copyright of Nintendo:tm:.
[2] Parser and shader written by @blob8108 on GitHub. Scratch:tm: is a product of the LifeLong Kindergarten Group at MIT in Cambridge, Massachusetts.
[3] Dank Memer's minigames use an anti-cheat to detect copying and pasting. This command fulfills the role of circumventing it.
[4] As of Minecraft 1.15.2; Minecraft is a product of Mojang Studios.

## 2.0.3: Assets, Time, Minecraft, COTD, Pi, Last Online, many bugfixes

### Major Changes
 * Asset class for retrieving scripts and images from an asset directory
 * Time constants from several related scripts put into a constants script
 * Support server no longer needs more redundant setup, uses `supportID` in `init.json`
 * `online`: client periodically records the last online time of users
 * `random.uuid`: generates a random UUID
 * `image.tilt`: creates a 3D effect on images (WIP)
 * `mc.craft`: generates a crafting table recipe
 * `mc.furnace`: generates a furnace recipe
 * `mc.achievement`: generates a minecraft achievement
 * `color.oftheday`: retrieves the daily-randomized color
 * `color.palette`: generates a blend of colors, similar to the `mshader.preview` command
 * `exercise`: generates random sets of body exercises with scaled difficulty
   * subcommands for core body parts, generates a set of exercises for that part
 * `pi.find`: search for specific digits in pi
 * `pi.practice`: practice reciting digits of pi
 * `Color` utils redone
 * `Math` utils redone
 * `Jimp` can now read from and write to data URLs
 * `Jimp#getPixelColor()` and `Jimp#setPixelColor()` support `Color` (this simplifies a lot of things)

### Minor Changes
 * `welcome -clear` clears the server's welcome message, so it can be disabled.
 * fixed formatting in `welcome` help message.
 * removed redundant color constants from `mandelbrot.command.js`
 * fixed custom maze size in `maze.command.js`
 * fixed usage with `mirror` alias of `archive/move`
 * moved `levelToXP()` and `XPtoLevel()` as static methods of `Pokemon`
 * fixed `birthday`
 * `steam` command stub added
 * made Bank accessible through the client (probably not a good idea)
 * `storage` getter/setter for client, retrieves and saves the client's persistent data.
 * fixed command filtering for wildcard searches
 * fixed message archiving
 * fixed Sessions timer not stopping/starting properly
 * fixed embed utils
 * added spoiler markdown support
 * `PrototypeChain` merged with `Object`
 * `typecast` will leave numbers alone if they do not cast exactly to what they originally were (so that pi practice can work)


## 2.0.2: Battleship, Video, Roll, Bugfixes

### New and Improved Commands

 * New battleship classic minigame, play against the bot (or have the bot play against itself).
 * New video command, uses a discord hack to turn any voice channel you're in into a video call, as long as you remain in the server.
 * Roll command can be used for dubs, trips, and quads like on chan boards.
 * mirror alias for archive can duplicate specific messages to another channel.

### Fixes

 * membercount graph not sending
 * Bingo intensifies when reactions are clicked
 * new Bank Accounts start closed when they should be opened
 * Session resolvers start as empty functions when they should be null
 * mute/unmute commands failed
 * redundant cast in Parser.parseRaw()
 * avoid parallel timeouts when running message games
 * null resource template values replaced when possible
 * pixelate fails to expand to larger sizes

## 2.0.1: Bugfixes

 * toggling client settings without a flag value should negate the setting.
 * flags parameter missing for eval
 * super bad help command
 * f-list character error
 * f-list kinks/custom_kinks sometimes empty arrays instead of dictionaries
 * reddit thumbnails sometimes malformed
 * reddit subscriptions fail due to ENOTFOUND error
 * client always censoring its own links
 * parser expressions not working
 * replaced open eval with safer Math.eval utility for %(...)
 * circular recursion between Permissions classes
 * bbcode tokenization is iffy
 * message filtering and attachment serializing


## 2.0.0: Dragon Reborn

This is my *magnum opus* of updates. I have worked tirelessly for months to fix and add plenty of new features.

### Code Overhaul
In brevity, all of the original source code files have been meticulously organized and updated. But that's not all. I have modified `discord.io` to support `MESSAGE_REACTION_ADD` and `MESSAGE_REACTION_REMOVE`, which was important for the a new tech I call Live Messages.

In addition to its core being one file now (minus the PromiseClientMixin wrapper), DragonClient has these new features:
 * `vckick` to kick members out of a voice channel
 * `moveMessages` for moderation purposes
 * `setAvatar` to change the bot's avatar
 * `createRole` can now edit a role at the same time it creates one
 * `apiKeys` property object for future features involving web APIs

(**Note** - Main prefix changed from `db.` to `🐉`. This will be __permanent__.)

#### Database Overhaul
Database objects have been granted additional functionality through a new "Query" mixin. They can now parse and execute simple database commands. Also, to alleviate rapid immediate saves following multiple table modifications, each table will rate-limit so that it only needs to save to file once or twice.

#### Moderation Overhaul
Moderation utilities have been cleaned up and put into more files. The "Modlog" is now a useful tool to interact with the incidents that occur within the server. As a moderator, you can edit and retrieve individual cases, or lookup cases involving a certain user.

#### Bank Overhaul
Bank utilities have been refurbished and reworked. Bank Accounts are not limited to a single investment anymore, the user may now open as many as they have money for. Investments subtract from the account balance to put in a principle, and then over time they may gain interest.

### Live Messages
This allows interaction with the bot like never before. Certain things simply weren't possible or were cluttering up chat with redundant update messages. Live Messages utilize reactions so that only one message is needed, and they provide automatic handling of certain reactions. Many features using this are creatively displayed in Discord emojis.

Using this technology, I have already overhauled my old games and programmed several new games with it:
 * **Blackjack** - Now with multiplayer, splitting, and infinite replayability!
 * **Slots** - Now with infinite replayability, bet multipliers, and free spins!
 * **Tic-Tac-Toe** - Now just click the number reaction. No need for keyboard input.
 * **Connect Four** - The classic 4-in-a-row game, play against the bot or another player.
 * **Game Of Life** - Conway's Game of Life in Discord! Watch how the generations of automata change!
 * **Tower Of Hanoi** - Move all the blocks from one end to the other, in the same order they started with.
 * **Maze Runner** - Help Draggy navigate a maze! The exit coordinates are given to you.
 * **Minesweeper** - Play solo or up to 4 players, clear the area and defuse the mines by taking turns!
 * **Sudoku** - Select a difficulty or use a serialized board. See if you can solve the puzzle!
 * **Calculator** - A novelty pocket calculator that does basic arithmetic.
 * **Poll** - Lets your users vote on anything!

Another use case of this technology is a generic data browser. Each of these comes with navigation and sorting buttons for ease of use:
 * **Analytics** - Shows how many times each command is used, locally, globally, and/or temporarily.
 * **Entity Lists** - Listing/searching users, roles, channels, and servers no longer needs you to input the page number.
 * **Pokedex** - Using `pkmn.pokedex` displays, browses, and filters your Pokemon.
 * **Reddit Posts** - Browse posts on a subreddit, rather than retrieving a random post.
 * **Reddit Subs** - Using `reddit.subbed` displays the channel's subscriptions to subreddits.
 * **FA Browser** - Now displays and browses FurAffinity content rather than listing links.
 * **Booru Browser** - Now displays and browses e621 and e926 posts.

### Flags and Regular Expressions
After rewriting the parser once again, I have added a couple new features to it. Flags are special arguments that get put into the `flags` object instead of the usual `args`, so they can be used anywhere in the command line. Regular expression support was added as well.

Flag syntax: `-name[:value]` where *name* is the flag name, and *value* is an optional data field to assign to it.

RE syntax: `%/expression/flags` where *expression* is the regular expression string, and *flags* are the flags such as `g`, `m`, `i`, etc.

### New Commands
This update brings *100+* new or replaced commands:
 * `aaa` - Scream!
 * `analytics` - Display the analytics table browser
 * `befunge` - Befunge interpreter
 * `blackjack` - Play Blackjack
 * `birthday` - Let the bot store your birthday so it can celebrate it with you!
 * `birthday.announce` - Get/set the channel for announcing your birthday.
 * `birthday.upcoming` - Get a schedule of upcoming birthdays in the server.
 * `birthday.today` - See who's celebrating their birthday today.
 * `birthday.remove` - Remove your birthday.
 * `bot.changelog` - View this changelog
 * `bot.readme` - View this bot's readme
 * `bot.todo` - View this bot's todo list
 * `brainfuck` - Brainfuck interpreter
 * `bulbapedia` - Search on the Pokemon wiki
 * `call` - Like Yggdrasil's phone command, lets you communicate with another user through the bot.
 * `connect4` - Play Connect Four
 * `dehoist` - De-hoist a member, if possible
 * `dstatus` - Get the Discord Status RSS feed
 * `e621.pool` - Uses the new MessageBrowser tech.
 * `e926.pool` - Uses the new MessageBrowser tech.
 * `fa.*` - Uses the new MessageBrowser tech.
 * `fancy` - Generate fancy text.
 * `flist` - Get a character from F-List.
 * `flist.kink` - Get info about a F-List kink.
 * `flist.kinks` - Get a list of F-List kinks.
 * `flist.search` - Search F-List kinks.
 * `games` - Displays top 10 games being played in the server.
 * `gendocs` - My command to auto-generate the documentation for commands
 * `gif.reverse` - Reverse a GIF
 * `gif.spin` - Spin an image as a GIF
 * `gol` - Play Game of Life
 * `graph` - Graph some data; supports line, bar, scatter, and pie graphs
 * `hanoi` - Play Tower of Hanoi
 * `image.crop` - Crop an image
 * `image.magik` - Prototype image magik, still a WIP
 * `info.permissions` - Get the permission flags from a number.
 * `ip` - Lookup information about an IP or web address
 * `list.*` - Uses the new MessageBrowser tech.
 * `malbolge` - Malbolge interpreter
 * `math` - Use the novelty pocket Calculator
 * `math.permutation` - Calculate permutations
 * `math.combination` - Calculate combinations
 * `math.constant` - Get a mathematical constant
 * `maze` - Play Maze Runner
 * `maze.generate` - Generates a maze image
 * `maze.solve` - Solve a maze image (only works with images from `maze.generate`)
 * `meme.www` - Who Would Win? meme
 * `meme.note` - Note-passing meme
 * `meme.smile` - That Damned Smile meme
 * `minecraft` - Search the Minecraft Wiki
 * `minesweeper` - Play Minesweeper
 * `mod.log.case` - Get a modlog case
 * `mod.log.revoke` - Revoke a modlog case
 * `mod.log.checkuser` - Get modlog case ID's for a given user
 * `mods` - List the server staff/admins/moderators and their statuses
 * `mute` - Mute a user, preventing them from sending messages
 * `nickname` - Sets your nickname
 * `npm` - Get information about a package on the NPM registry
 * `npm.install` - My command to install a package locally
 * `npm.search` - Search for packages on the NPM registry
 * `npm.version` - Get the latest version of a package
 * `pi` - Pi digit counter
 * `pi.digits` - Get a range of pi digits
 * `piet` - Piet interpreter
 * `ping` - Alternatively, ping a web address
 * `place` - Like /r/place but with Discord
 * `pokemon.pokedex` - Display the Pokedex browser for your pokemon
 * `pokemon.active` - Get or set your active pokemon (used for training/battles)
 * `pokemon.identify` - Identify a Pokemon in its image, only works with Pokecord :^(
 * `poll` - Start a new poll
 * `poly` - Solve for a polynomial's roots
 * `portmanteau` - Combine two similar words
 * `prefix` - Simplified and limited per server
 * `quote` - Quotes a message by its ID or author
 * `random.command` - Get a random command usage
 * `random.role` - Get a random role
 * `reddit` - Browse posts from a subreddit.
 * `reddit.options` - Get/set the reddit subscription settings in a channel
 * `register` - My command to load modules without restarting the bot
 * `roman` - Convert to and from Roman Numerals
 * `search.*` - Uses the new MessageBrowser tech. 
 * `self` - Metacommand to run a command using the bot as the context user, useful for certain games
 * `slots` - Play the Slot Machine
 * `sudoku` - Play Sudoku
 * `support` - Get the invite link to the bot's support server
 * `tag` - Get a server tag
 * `tag.clear` - Clear server tags
 * `tag.delete` - Delete a server tag
 * `tag.list` - List server tags
 * `tag.set` - Set a server tag
 * `terraria` - Search the Terraria Wiki
 * `textbox` - Generate a unicode box with text inside
 * `todo` - Manage your personal to-do list
 * `todo.clear` - Clear your to-do list
 * `todo.done` - Finish an item off your to-do list
 * `todo.next` - Pick a random thing from your to-do list
 * `toggle` - Admin command to make changing internal client settings more easily
 * `ttt` - Play Tic-Tac-Toe
 * `unmute` - Unmute a user
 * `unzalgo` - Removes the corruption
 * `vckick` - Moderation tool to kick users out of a voice channel
 * `whitespace` - Whitespace interpreter
 * `with` - Metacommand to run subcommands as if they were top-level
 * `xkcd` - Get an XKCD comic
 * `yugioh` - Search the Yu-Gi-Oh! Wiki

### Obsolete Commands
 * `analytics.all`, `analytics.session` ➡ `analytics -all/-temp`
 * `bank.view` ➡ `bank`
 * `embeds`, `tts`, `typing`, `logging`, `errors`, `invites` ➡ `toggle`
 * `list.all.servers` ➡ `list.servers`
 * `mod.warn`, `mod.strike`, `mod.unstrike`, `mod.kick`, `mod.ban`, `mod.unban`, `mod.softban` - These are top-level now
 * `pokemon.legendaries`, `pokemon.shinies`, `pokemon.favorites` ➡ `pokemon.pokedex`
 * `reddit.new`, `reddit.rising`, `reddit.top`, `reddit.controversial`, `reddit.gilded` ➡ `reddit -type/-time/-limit`
 * `reddit.polling` ➡ `reddit.options`
 * `search.status` ➡ `list.users`, has status filters
 
### New Utilities
 * 2D - simple 2d graphics helper classes
 * Array
   * `union`
   * `diff`
   * `groupBy`
   * `shuffle`
   * `range`
   * `forEachAsync`
   * `mapAsync`
 * DiscordUtils
   * `getDefaultAvatarURL`
   * `getServerVoiceChannels`
   * `getUsersByGame`
   * `getReactions`
   * `getServersInCommon`
 * fetch
   * returns a `cheerio` wrapper object for HTML bodies
   * returns a `xml2js` wrapper for XML bodies
 * Format
   * `coordinates` - latitude and longitude
 * Jimp
   * `getBufferAs` - resolves the MIME buffer and filename
   * `hashDistance` - calculate the hamming distance between two hashes
   * `rescale` - alias of `scale`
   * `print` - hotfix for bad text alignment
   * `circleCrop` - crop tool for a circular mask
   * `fill` - fills a given region with a new color
   * `bucket` - replaces like colors with a new color
   * `drawCircle` - draws a circle using the Midpoint circle algorithm
   * `fillCircle` - fills a circle
   * `fillTriangle` - fills a triangular region
   * `drawPath` - draws a path connecting points
   * `fillPath` - fills a path connecting points
   * `liquid_rescale` - prototype of image magik
 * Math
   * `step` - the step function
   * `combo` - combination
   * `perm` - permutation
   * `manhattan` - the manhattan distance function
   * `eval` - "safe" eval method for math expressions
 * Pointer2D
   * `Pointer2D` - 2D generic point/pointer
   * `Pathfinder` - routes paths between points
   * `PathNode` - used by the Pathfinder
   * `PointStore` - used for fast storage and lookup of coordinates

### Bugfixes
 * Client will no longer fail to send a message to DMs on the first try
 * Timezone offset mostly fixed, still doesn't account for DST though
 * Temporary fix for updated Jimp library breaking a couple things

Still, many many bugs remain to be fixed.

### Support Server
Finally, the bot has its own support server so I can freely use and improve it. Built almost entirely without intervention, and permissions and commands are already configured for it.


## 1.7.8: Smarter parse, DM permission, Custom prefixes, Currency conversion, etc.

### Smarter parsing
 * the Parser has been improved so that it only requires one prefix per message instead of per command. In metacommands, this means the user no longer has to prefix every nested command, as the first interpreted token will always be the command identifier.

### New commands
 * `prefix` - list, add, remove, and clear custom prefixes for the server. Usable by privileged users only.
 * `currency` - convert an amount in one currency to another currency. Both must be valid currency abbreviations, currency symbols, or currency names.
 * `pressf` - pay respects (this saves a counter for the number of respects you paid)

### New DM permission
 * permits a command only in DMs with the bot.

### Misc changes
 * explode alias for `image.bulge`
 * Better warping for `image.warp`
 * Title override for `mod.names`
 * `newline` spam filter for moderation
 * Debug logging for moderation
 * Disclaimer for usage of `music` command
 * Permissions handling optimized
 * `DragonBot#getCustomPrefixes()` - retrieves the custom prefixes used in a server

### Bugfixes
 * DragonBot had connection issues recently which caused it to receive `GUILD_REMOVE` events that killed it instantly. Mitigated this with some more careful logging.
 * `Moderation#deleteInvitesByUser()` would not work if the client did not have the proper permissions. But it is not required for banning so its errors are ignored.

 
## 1.7.7: More image/math commands, misc changes and fixes

### Additions
 * `image.pixelate` and `image.warp`
 * `math.pow` and `math.root`
 * mitigation for outages (thanks a lot discord)
 * `DebugClient#sendTemp()` for expirable messages

### Changes
 * `meme.when` command is now the default meme command
 * Avatar retrieving is now at 512x512 resolution
 * `Song.toString()` removes the .mp3 part
 * Sending a bottle now only works for users who opted in
 * Reddit subscriptions will filter out posts with a nonpositive score
 * DiscordUtils will now return higher-res guild icons/splashes and user avatars, plus emoji links
 * better debugging in MapBase
 * `math` utilities merged with functions in `math.command.js`
 * `Subscription.js` removed, dunno why it was still in there

### Bugfixes
 * moderation message filtering fixed
 * `ddocs` command fixed
 * `qr` utils fixed
 * username in `Context#debug()` fixed
 * regex in `DiscordUtils.getCreationTime()` fixed
 * missing `mentionspam` event handler in `moderation.special.js` fixed


## 1.7.6: New Prefix, Audio, Discord Docs, Lockdown

**Prefix change: ! ➡ db!**
(this is for avoiding clashes with other bots; in the future I will make this dynamic)

### Audio is almost here!
 * New AudioPlayer class for streaming music to voice channels, and a DJClient wrapper class to manage them
 * For the moment, it plays whatever local songs I have saved. In the future I hope to include YouTube search and streaming
 * music command interface for searching, playing, shuffling, etc.
 * IMPORTANT NOTE: pause, speed, volume, and goto do not work. somehow I can't get the readableStream to pause, might be because discord.io is forcing it to read.

### Discord Docs
 * an extensive new command, ddocs, which pulls links to relevant documentation given some search terms. Doesn't actually do searching online, just uses a local file that I painstakingly wrote to store keywords.
 * i.e. using it to search "gateway heartbeat" brings up topics about the gateway heartbeat event and usage.

### New Moderation features
 * Lockdown mode, activated with mod.lockdown. Server security is heightened until turned off. If a user sends two messages in a short time, abuses mentions, or uploads a file, they are instantly kicked and their message is terminated. This is my solution to raids.
 * Spam filters instead of a spam level. New spam filters include mentions and emojis.
 * Softban, which bans and unbans a user to remove their recent messages.
 * Clarification in the zip command: "for securing evidence" (the logs are encrypted so the are not in violation of the ToS)
 * Messages by server admins and moderators are ignored.

### Misc
 * Image commands have their own category now
 * Context now has `timestamp` (Date), `attachments` (Array), `embeds` (Array), `mentions` (Array), and `messageObj` (message object)
 * DebugClient `heartbeat` and `ping` properties, plus latency checker
 * Client names simplified when requiring
 * `Moderation.modify()` returns a Promise that resolves before saving changes to the database table.
 * `Date#difference` for the difference of two Dates in milliseconds


 1.7.5: 20+ new commands

### Misc
 * `ping` - quick ping/pong thingy
 * `color` - view and generate colors
 * `timer` - set a duration
 * `timezone` - get the current time in another timezone (needs work)
 * `permcalc` - calculate the permission mask from permission flags

### Fun
 * `random.emoji` - get a random emoji from the server or from discord
 * `random.command` - get a random command usage
 * `random.token` - generate a random fake discord token
 * `meme.byemom` - quick, google something ilegal
 * `qr` - read and write QR codes

### Text (new category)
 * many commands from fun moved here
 * `nato` - use the NATO phonetic alphabet
 * `base64` - convert to and from base64
 * `hash` - generate the hash of some text

### Info
 * `bot.commits` - get the bot's commit history
 * `bot.shard` - get the bot's shard ID (useless for now)
 * `info.snowflake` - analyze and match an ID
 * `info.token` - analyze and match a token (does not attempt to use it, please don't kill me)
 * `search.status` - search for users with a specific status (online, offline, etc.)

### Moderation
 * `zip` - collect channel message history and zip it up in a file

### Admin
 * `role.permissions` - sets the permissions of a role (very difficult to use atm)
 * `errors` - configure how fatal errors are messaged

### Bugfixes and improvements
 * `math`, `random`, and other "useless" commands have analytics disabled
 * DiscordUtils used for random selection of things
 * `Context.debug()`, useful for generating a readable format of the context
 * `DiscordUtils.getCreationTime()`, `DiscordUtils.debugMessage()`, `DiscordUtils.decodeToken()`, and `DiscordUtils.generateFakeToken()`
 * `Moderation.collectMessages()`
 * `Parameter.toChoice(array)`
 * `PromiseClient._censorPrivateInfo()`, also replaces the client's token if it ever shows up (luckily it hasn't)
 * `Color#hex` property, returns a CSS format hex string
 * `Markdown.emoji()` passes on emojis
 * `Format.timestamp()` will display sign when negative


## 1.7.4: Better Moderation, Meme Image Commands

### Better Moderation
 * Usernames can be filtered upon joining a guild. If a username has an offensive word in it, the user may be banned immediately. USE THIS CAREFULLY!!!
 * Banning multiple users at once is now possible.
 * Banning users not in the server is now possible.
 * Modlogging is fixed and updated; case #'s are incremented
 * Archiving works finally
 * When a user is banned, any invites they have made are deleted as well. (if the bot is allowed to do that...)

### Memes
 * New meme command group for images. Create memes from scratch, using existing images, and apply templates and watermarks.
 * `deepfry` and `jpeg` were moved under this command
 * New commands include: `when`, `watchmojo`, expanding `brain`, `drake`, `thanos`, `shaq`, `ohfuck`, `fact`, and `watermark`.
 * Many more memes to come! (and possible future merge of all meme commands to something more versatile)

### Misc
 * Despacito meme now plays any song name and responds more flexibly
 * More aliases for `caps`, `owo`, and `emoji`
 * `filterMessages` moved to DiscordUtils
 * Messages longer than 200 characters are not deleted even if the message expires
 * `forEachAsync` and `mapAsync` fixed for empty arrays
 * `DiscordEmbed.stringify()` static method added
 * `fetch` option `responseOnly` added
 * `Jimp.prototype.getBufferAsync` is now part of the Jimp library
 * `random()` rounding fixed
 * `capitalize` and `escapeRegExp` methods for `string.js`


## 1.7.3: Contacting, blocking, sniping, guild events, e926

 * `contact` command: send a message to me through the bot
 * `block` and `unblock` added to Admin: allows the bot to refuse users who try to use its commands, and politely messages them about it.
 * `snipe` command added to Moderation: allows searching for recently deleted messages in the channel (only works if it happened while the bot was online)
 * Guild joining/leaving events are now logged to console.
 * If/when the bot has connection issues, the resulting error will be logged.
 * Entire e621 codebase rewritten, with e621 and e926 inheriting from a booru class; Post, Pool, and Media classes added
 * `e926` counterpart command, which searches SFW-only content that can be found on e621


## 1.7.2 Misc new commands, bug fixes

 * `image.gravity` - it's like an inverse fisheye effect.
 * `lottery.info` displays the names of users in the server who won the last lottery round.
 * Despacito
 * Reminder time parser moved to a separate util
 * `sheriff` emojipasta generator
 * `MANAGE_GUILD` changed to `MANAGE_CHANNELS` for the privileged permissions
 * server strictness check, in case some of some leakage
 * Jimp utils fixed
 * `Markdown.emojiName` method


## 1.7.1: Lottery, more commands, many fixes

New Lottery system: entirely runs in the background, but has a command interface for purchasing "tickets". Tickets are fairly expensive, limited, and chances of winning are super low, but this makes winning the jackpot very rewarding.

### Other new commands
 * `suspend` - Admin command to temporarily halt the bot
 * `anayltics.toggle` - Admin command to enable/disable analytics globally
 * `random.user` and `random.channel` - Fun commands to mention a random user or channel, respectively
 * `mod.warn` - Moderation command to provide the lowest punishment

### Changes
 * `Bank._modify` for non-saving changes to an account
 * Subcommand listing honors my power to peer into hidden commands.
 * `Commands.toHelpEmbed()` renamed to `Commands.embed()`
 * Analytics now a property of the client
 * Semantic changes to several Fun commands
 * Image commands categorized as Fun
 * "X-ass Y" meme added
 * `blacklist.replace` title added
 * item argument removed from `pokeshop.inventory()` call
 * `invite` link message edited
 * `ConfigurablePermissions#changeType()` removed
 * DragonBot temp message lifespan increased to 10 seconds
 * Welcome message(s) aren't echoed upon change anymore
 * Logging level default is `All`
 * Record loading uses natural `Object.assign()`
 * Resource initialization rewritten (ugh, I almost lost all my fishing progress)
 * Subscription class prototype?
 * `Object.zip` util added

### Fixes
 * Inherited permissions not chaining correctly
 * Reddit subscriptions last poll time overridden upon starting bot
 * Sessions interval isn't cleared when the bot stops
 * Parser throwing error when newline not found for inline comment
 * `PromiseClient#deleteMessages()` has a bad variable when deleting a single message
 * `Format.time()` and `Format.timestamp()` 32-bit operation truncated the longer integers wrongly


## 🎉 1.7.0 Milestone!

This update brings a bunch of new commands, features, and overhauls.

### New Commands
* Admin
	* `prefix` - sets a custom prefix for the server (disabled for a later update)
* Moderation
	* `archive` has alias `move` now
	* `cleanup` has more aliases: `prune`, `purge`, and `tidy`
	* `mod.actions` - sets the bot's actions to take when a message is auto-filtered
	* `mod.vulgarity` - sets the vulgarity filter level for the server
	* `mod.spam` - sets the spam filter level for the server
	* `mod.urls` - display URLs that are allowed/disallowed on the server
	* `mod.urls.blacklist` - blacklists URLs from the server
	* `mod.urls.whitelist` - whitelists URLs for the server
	* `mod.urls.clear` - clears all blacklisted/whitelisted URLs on the server
* Text
	* `leet` - translates text to leetspeak
	* `reverse` - reverses the character order in text
* Fun
	* `rps` - Rock Paper Scissors
	* `rate` - bot rates something you give it
* Image
	* `droste` - create a droste effect in an image
	* `gradient` - calculate the gradient magnitude of an image
	* `magik` - use seam-carving to alter an image (not ready yet)

### New Permissions
* Instead of inter-server permissions, they are now intra-server. That is, permissions are unique for each server.
* New permission types:
	* **Privileged** - restricts a command to those with the `MANAGE_GUILD` ability. This makes it easier to assign moderation commands to those with moderator abilities.
	* **Inherited** - the subcommand's permissions are sync'ed with its supercommand's.
* Many commands' permissions are implied.
* Permission flags for the bit positions of Discord Permissions.
* Permission constant data put in Constants.

### Better Moderation
* Moderators can set the bot to filter messages that contain heavy vulgarity, spam, or unwanted/untrusted links.
* Moderation session for executing message filtering (prefixed with an underscore to have it be used first before any other sessions).
* Moderation data (archiveID, modlogID, strikes, etc.) grouped as a server resource in the database.
* Moderation cosntant data put in Constants.

### New Parser Features
* Array arguments (%[])
	* Syntax: %["elem1",123, ...]
	* The extire expression is one argument, but made into an array.
* Object arguments (%{})
	* Syntax: %{"key1":"value1","key2":123,...}
	* The entire expression is one argument, but parsed as a JS object.

### Misc Changes
* More `markdown`, `string`, `array`, `color`, and `jimp` utilities.
* Moderation stuff moved to a new folder.
* Markov stuff moved to a new folder.
* URLs from Reddit posts are unescaped.
* Reminder error catching.
* Emotional help special added.
* greentext special removed forever.
* PromiseClient#getLastMessage() fixed for DMs.
* context.roles made into an empty array for DMs.
* More memes.


## 1.6.17: Redo, Markov Chains, Temp Commands

 * `redo` - repeats the user's last command message, excluding `redo` and `undo`. Useful to avoid copying and pasting a long command.
 * `markov` - create markov chains that take in sentences from messages and channels, then spits out randomly generated sentences. Nodes (words and phrases) are weighted by  how frequently they're found.
 * Temporary commands may be created with `commands.create`. They are deleted when the bot is shut down.

### Changes/Fixes
 * list of commands is sorted and shortened to save space
 * `e621.source` fixed
 * e621 hash string coercion
 * FA scraps and favorites APIs were missing
 * reddituploads image domain added
 * reddit embedding properly formats selfposts
 * reddit embedding uses the timestamp
 * reddit subscription cache fixed
 * constant added for message limit to search for a command
 * Context constructor no longer requires a message string argument, can be a message object too.
 * Handler avoids resolving its own kind due to redo.
 * PromiseClient getMessages fixed when there are no more messages found despite a higher limit


## 1.6.16: FA Commands, Stereograms

 * FurAffinity commands added to the NSFW category. utilizes FAExport by boothale
 * `stereogram` - Autostereogram generator added to Image module
 * Cross-posts are filtered out of reddit subscriptions to avoid reposting (though reposts are much more complicated to avoid altogether)
 * slight change to reddit subscription embedding
 * removed promise requirement from `fetch`
 * added link markdown
 * add innerHTML function to string utilities
 * metacommand progress logging added
 * `bufferize()` embed utility added, lists as many items as can fit into fields
 * `paginate`, `tableify` merged with `embed.js`


## 1.6.15: More e621 + reddit commands, reddit subscribing

 * `fetch.js` was fixed in that it was not converting responses to JSON correctly. all uses of it were fixed to use querystring format instead of appending to the URL.
 * `e621` module has new commands for oldest and worst posts, to contrast the newest and best post commands.
   * Note: `e621.worst` does not use the blacklist to filter its post results
 * `Reddit.js` added to encapsulate reddit API usage
 * `reddit.gilded` command added, finds gilded posts
 * Reddit Subscription feature: you can now "subscribe" to subreddits via the bot's commands. Subscription allows the bot to periodically check the subreddits for good posts and send them to the channel. This effect lasts indefinitely unless the subscription is deactivated or the subreddits are unsubscribed from.
 * Resource object field copied upon instancing to avoid duplicate pointers
 * Async methods for `Array#forEach` and `Array#map`


## 1.6.14: More database commands, e621 pool embedding

 * New database commands, tables, records, and fields, which lists the keys/names for tables, records, and fields, respectively
 * a special embed is automatically generated when a user posts a link to an e621 pool


## 1.6.13: Database commands

New database commands that make it easy to retrieve, assign, debug, and garbage collect things in the bot's database.
 * `backup` moved from Admin module to Database module
 * `revert` to complement backup
 * `roles` getter for client
 * name fix for backup directory


## 1.6.12: Block quotes, image transform anti-aliasing

 * `CommandParser` treats code blocks as a single string argument. This makes executing experimental js easier.
 * `applyTransform` of the Image module uses smoothing for in-between pixels.
 * color preset for testing image has a random saturation level
 * `Color` class has static methods for averaging and interpolating colors.
 * various bug fixes


## 1.6.11: Test images, more utility modules, message chunkify

 * `Image` module has command for generating example images for testing: `blank`, `grid`, `checkerboard`, `color`, `noise`, and `random`.
 * `Math` utility module extends the current Math object for additional functions.
 * `Perlin` utility module generates Perlin noise fields.
 * `Color` utility module can convert HSL to RGB; fixed issue caused by 32-bit integer silent cast which caused 0xFFFFFFFFF to be -1
 * `PromiseClient` can send messages that exceed the normal limit, but has a hard limit of 10000 characters per message. Now some of the longer subcommand listings can be sent.
 * Selling Pokemon fixed
 * Searching users fixed
 * Removed `comedy.json` because it's useless at the moment


## 1.6.10: More image effects, bulk message workarounds, and debug commands merged

 * Debug module and search command merged into Admin and Info modules.
 * New info commands for searching and listing locally (this server) or globally (all servers).
 * PromiseClient's getMessages and deleteMessages workaround the 100-message limit.
 * Image post-processing module has new variants: motionblur, circleblur, radialblur, bulge, swirl, and complex, which use differential smoothing, transformations, and even fractal  tracing.
 * resolve and search methods added to DiscordUtils. resolve takes an object and a number of ID keys to try, returns the value of the first valid key (useful for resolving command args + default IDs).
 * tableify accepts any multiple of 3 columns, max 24.
 * Pokemon sell value nerfed and leveling-value curve fixed.
 * greentext is slightly less greedy


## 🍆 1.6.9: More Message Settings, Commands, Cleanup, & Bug Fixes

 * New settings for simulating typing and text-to-speech with every message. Supplementary commands provided.
 * Client can ignore other bots separately from other users.
 * `ignore` command extended for that.
 * `memdump` and `backup` moved to Admin module.
 * Slot machine reworked so that it only uses one message object. Fixed so that it also takes away the cost of losing.
 * More `.indexOf()` instances replaced with `.includes()`.
 * `console.log` commands don't record usage count.
 * `greentext` re-introduced now that bots can be ignored.
 * Client will type before processing images.
 * `progress` alias added to `pokemon.howmany`.
 * `analytics` field and explanation added to command base file.
 * Reddit embedding fixed for deleted posts.
 * Role module uses DiscordUtils now.
 * Text module uses the random utility now.
 * `substrcmp` moved from Tools module to `string.js`.
 * Context throws new errors for undefined `user` and `channel`.
 * DiscordUtils now has utilities for finding objects by name.
 * DragonBot ignores webhook messages, has extra error catching, and logs messages more cleanly.
 * `Handler.response` made into a class
 * `Handler.response.embed` case now catches more standard fields such as color, image, and video.
 * Logger given a notice method, colored cyan
 * PromiseClient does not override `Discord.Client#simulateTyping` due to callback irregularity; instead given new methods edit and type, to workaround this.
 * DiscordEmbed defaults message property to an empty string.


## 1.6.8: New debugging commands, several bug fixes

### Additions
 * New commands in the debug category: logging and list. Can only be used by me. Logging sets the logging level (see below) of the client to allow certain kinds of messages to appear. The list command group displays all servers, channels, users, or roles in a list format.
 * New logging level feature, filters the types of messages to log. Set between 0 (nothing) to 3 (everything).
 * New per-command analytics setting. Commands can be made to avoid saving analytical information for it. Used primarily on the .? subcommands.
 * New `welcome.role` command, sets a role that is assigned to users when they join.

### Improvements
 * `Handler` has a property for the `command`.
 * `slots` minigame nerfed after a long streak of high rolling
 * `image.brailleify` now auto-adjusts scale
 * `welcome` commands have titles now
 * DiscordUtils now made into a fully-featured class
 * Various logging edits in DragonBot
 * `paginate` utility has an extra argument for the enumerated item

### Bug fixes
 * CommandParser does not throw an error if the first token is a non-string.
 * `proxy` works finally
 * `reddit` no longer throws an unknown error related to a post's domain
 * `Markdown.emoji` now recognizes named emojis properly


## 1.6.7: More Discord Utilities, Cleanup and Fixes

 * `init.json` no longer requires the version number and source. The version is taken from the package.json, and source is hard-coded now.
 * `Command.prototype.toUsageString()` renamed to `Command.prototype.toString()`
 * CommandParser typecasts tokens more intuitively, with intended number values, booleans, and other constructs being casted when possible, or left as strings.
 * `debug.command.js` has been cleaned up and given a new command, backup, which saves a backup of the database.
 * DiscordUtils has methods to create embeds for not only messages, but channels, servers, users, invites, etc. that debug commands used. The embeds are more nicely formatted  than before.
 * New `image.brailleify` command, using my `brailliefy.js` module.
 * FilePromise given a bunch of new features, and no longer relies on bluebird's Promise library. For all intended purposes, it is a useful substitute for `fs` + `path`.
 * Logger classes have colored logging methods now (todo: find a use for them)
 * Parameters no longer give a type-casting error
 * Markdown methods improved, new methods for appending `shrug`, `tableflip`, and `unflip` emotes; plus new methods for textual mentions


## 1.6.6: Temp Analytics, New Commands, Bug Fixes

Temporary analytics tracks command usage for the current application runtime.
New commands:
 * `analytics.session` - display session analytics for the server
 * `analytics.session.all` - display all session analytics
 * `presence` - the bot's game and status can be set manually
 * `cah.remove` - you can now remove a CAH custom card by its ID
 * `interval` - metacommand that combines repeat and wait

Bug fixes:
 * Memes should return arrays
 * Moderation commands do not need titles
 * Pokemon commands fixed (again)
 * FilePromise uses the application directory rather than `__dirname`
 * Handler does not insert title when it does not need to
 * MapBase does comparison with a string
 * DiscordEmbed ensures fields are strings
 * Outdated version number removed from `fetch`


## 1.6.4-1.6.5: Image commands, Handler class, Promisification

### 1.6.4
New image processing commands. Deepfry, add JPEG, invert, mirror, and more!
New debug.invite command, displays information about an invite.
New slots.table command, displays the payout table.
New math.pascal command, calculates Pascal's Triangle.
Moderation setup commands merged with their respective getters.
NSFW commands publicized. Yay.

### 1.6.5
Handler.js is the new DRY solution to orderly responses from the client. Originally coded as a singleton with no methods, it provides an easier way for me to resolve promises, reject errors, and insert titles into responses, from both Commands and Sessions. With it, I have cleaned and promisified the chain of work between running the command and sending its result. The new code should properly handle asynchronous operations such as processing images and fetching stuff, without a bunch of command-side workarounds.

### Other changes
 * `Readme.md` updated with a disclaimer
 * `Command.js` resolve method simplified
 * `CommandParser.js` keeps links
 * `Commands.js` resolve method reorganized
 * `blackjack` insurance check fixed
 * `slotmachine` alias for `slots`
 * `slots` payout for most items buffed
 * `dice` roll improved
 * `mandelbrot` rendering chain simplified
 * `math` command titles changed
 * WHAT?
 * `async` propagation fixed
 * Moderation `cleanup`/`archive` now more flexible
 * Reddit assist less annoying
 * Pokemon, text, welcome commands fixed
 * user removed handler fixed
 * Parameters fixed


## 1.6.3: Blackjack, Slots, Async

New minigames: Blackjack and Slots. New async metacommand.
 * Moved out of the casino subcommands for now.
 * `blackjack` does not have splitting or bonuses yet
 * `slots` is a brand new take, so it might be fair or unfair, will have to test it thoroughly.
 * Video slots game on the way?
 * `async` runs a command without waiting for it to resolve. May be useful for running a batch command of timed things.


## 1.6.2: TicTacToe, Debugging

### Main changes
 * New TicTacToe game, play against the bot, who is rather challenging.
 * More debugging commands for console logging
 * Snapshot of client data now properly fixes circularities and redundant keys, and also pretty-prints to the file
 * Echo now acts more like print rather than a useless cowsay.
 * ResponseError handling expanded, fixed
 * 'start' event fired when a Session is successfully loaded and added.

### Minor changes
 * Fun commands fixed
 * reddit link assist fixed (mostly)
 * checking for card in pile/hand skips hidden cards
 * Blackjack being worked on

## 1.6.1: Variables and more metacommands

New variable construct: allows simple data to be stored per-server, deleted, and changed via commands. Retrieval is done using `$` followed by the variable name, which can be done by itself or within expressions. Certain variables are readable but not writable by the user, such as `$server`. Variables are case-insensitive, however they are cast to lowercase when assigning. Variables cannot hold data types other than string, number, and boolean. If a variable is undefined, either it will not insert its value, or a proper error will be thrown.

### Example:
```
!batch {
	!var x 0;
	!repeat 5 {
		!var.inc x;
	};

	// or simply
	!foreach 5 x {!var x};

	!var.delete x;
}
```

### Changes:
 * New metacommands: var, foreach, while, cancel, and try
 * Metacommands handle errors properly now
 * Commands resolves rather than rejects
 * CommandParser tokenization improvements:
   * Arguments cast to Number when possible
   * Expression evaluation done during normalization instead
 * Arguments no longer throw errors if their value is defined but equivalent to false

### 1.6.1+: Various fixes, rate-limit handling

 * Comments are ignored for now to avoid snagging on the command runner.
 * Mandelbrot shader preset IDs are correctly casted now
 * More meme replies: Nice, society/deep, ayy lmao, and what?
 * Fixing invite command
 * Rate limit delay reduced
 * Rate limit handling introduced
 * WSMessage used for ID'ing new message because channel.last_message_id is unreliable.
 * Ignore catching errors inside PromiseClient
 * Garbage collection stub method added to Table


## 🎉 1.6.0 Milestone!

Complete rework of the message handling code, from the raw handle to sending a response.

Context data structure, fills in information about a message, the sender, the channel, and the server.
 * Passed to the run method to synthetically invoke commands
 * Normalizes strings that use special symbol variables.

Command running uses Promises to ensure stable command handling and chainability.
 * Error handling is cyclic but ensures safe propagation within the command invocation stack.
 * A short delay is added after a message is sent to prevent rate-limiting.
 * A "last resort" catch statement added.
 * A new message for denied commands
 * A new message for network errors 😂

Command parsing reworked to support several new features:
 * Command lambdas {...} (see Block)
 * Expressions %(...)
 * Comments //... and /* ... */
 * Block-like interpretation

New metacommand set:
 * batch: runs a set of commands sequentially
 * repeat: runs a command repetitively
 * if: runs a command conditionally
 * wait: runs a command after a set time
 * noop: a placeholder command

New Block construct:
 * A representation of a command
 * Used to run metacommands

Parameters updated:
 * Block argument syntax added; strict validation.
 * No more maximum limit to get rid of those annoying pointless errors

New Constants.js file:
 * Defines all the necessary constants, reserved keywords for parsing, etc.
 * Command files are now suffixed by `*.command` rather than prefixed with `cmd_.*`
 * Session files are now suffixed by `*.special` rather than prefixed with `spc_.*`

Misc Changes and Bug Fixes:
 * Command handler context is the Command object itself
 * Command fullID cast to lowercase.
 * Command.resolve changed to Command.validate
 * Mandelbrot rendering promisified
 * Moderation.cleanup uses the correct method depending on the number of messages
 * Moderation.archive waits after each deletion to avoid rate-limiting
 * ColorPalette embedding shows the scale
 * DiscordEmbed embed.author.name checked for existence
 * String helper functions lumped into string.js
 * Testing folder


## 1.5.22: Mandelbrot commands

New fractal exploration feature! Utilizes the Jimp library and a specialized iteration algorithm.
Other changes include:
 * limit to white card retrieval in CAH
 * commands correctly suppressed for `help`

### 1.5.22+: Critical fixes, improvements

 * BankAccount no longer writes to a history_undefined.log file (thank goodness!)
 * `array2.js` and `color.js` moved to utils folder
 * `mshader.preview` added
 * `mset` render size decreased
 * Pokemon pokedex search functionality added
 * Pokemon name and species ID shortened for smaller write size.
 * reddit session ignores reddit links, moved to reddit folder
 * conversion ignores link
 * bot presence fixed
 * Logger spacing fixed


## 1.5.21: Toggleable Embedding, Undo

 * `Client#send()` can now toggle embedding with `ENABLE_EMBEDS` property
 * Payload checking done with `DiscordEmbed`
 * Undo function made into `Client#undo()`
 * Redundant title bold removed
 * Reddit embedding fixes


## 1.5.20: Fishing update, reddit and presence fixes

 * Fishing cooldown can be changed.
 * Reddit posts that are too long are truncated correctly.
 * Client presence no longer caught in loop due to library update.
 * Deleting messages displays progress in console.


## 1.5.19: Reddit command

 * New reddit command with subcommands top, new, rising, and controversial. Retrieves and embeds a random post from a subreddit under one of its filters.
   * TODO: workaround videos not embedding
 * Analytics displays the sum of the command hits.
 * Reminders fixed, set to Misc category
 * Parameters fixed when stringifying them


## 1.5.18: Choice Parameters, Session API, Reminders

 * New parameter type, choice, which restricts input to a value in an array. Syntax: `<a|b|c>`
 * New special events for Session objects: `init` and `tick`. Init fires on loadout. Tick fires each second when the sessions are processed. Can be used to create idle actions before a Session resolves.
 * New reminder command, using the new tick event. Tell the bot when and what it should remind you, and when the time comes it will PM you. Can cancel anytime.
 * Pokemon training no longer requires an ID, will train a random one if no ID provided
 * delet this


## 1.5.17: Emoji, bug fixes

New `emoji` text command, gets a custom emoji from servers that the bot is in. (this is not emojipasta!)

Cards Against Humanity:
 * bug fixes for listing custom cards

Memes:
 * Loss added

Moderation:
 * fixed emoji

Sessions:
 * Fixed titled sessions returning an output without input


## 1.5.16: CAH game, investment change.

New Cards Against Humanity game.
 * Choose from several packs to use
 * Create custom cards for the server
 * TODO: allow removing individual custom cards rather than clearing them all

Bank investment nerfed.
 * Went from 2% hourly to 5% daily to prevent extreme interest gains from breaking the laws of economics.

Other:
 * Copying permissions fixed.


## 1.5.15: owo and pokemon.shinies

 * OwO UwU ???!!
 * `pokemon.shinies` - lists your shiny pokemon catches
 * text changes for brevity


## 1.5.14: Self-Assigning Roles + more

### New Role Commands
Roles can be made self-assignable, so users don't have to ask mods to do so. Authorized users may set/unset existing roles as self-assignable and create new ones with basic permissions. Colors may also be assigned to roles.

### Other Changes
 * The `?` subcommand now has the alias `help`.
 * Commands can have IDs that are identical to internal methods by capitalizing their first letters. The full identifiers are cast to lowercase when displayed.
 * Invalid commands no longer throw an error. This should've been the default but I got lazy.
 * Fixed the UTF-8 encoding of the zalgo text data. Added a new caps command that changes text to mixed uppercase and lowercase.
 * Added a test command for testing welcome messages.
 * Fishing inventory displays stat for artifacts activated.
 * Permission checking no longer requires user, channel, or server arguments.
 * PromiseClient covers EditRole now. Whoops.

### 1.5.14+: Various Hotfixes
 * Categories are optional/overridable (for subcommands).
 * Debug commands no longer private.
 * Search commands search by substrings rather than whole strings.
 * Role commands list properly.
 * guildMemberRemove handler fixed.
 * Cleanup command not limited to 100 messages anymore.
 * Various small changes to command categorization and titles.


## 1.5.13: Welcoming + Invite Permissions

Bot includes premissions in the invite URL.

New welcoming commands:
 * Assign custom welcome/goodbye messages for the server.
 * Uses special syntax keywords to insert names/mentions.

Pokemon:
 * Fixed spelling of Suicune


## 1.5.12: Conversions, Shinies, Resource

New background session that automatically converts imperial system to metric system and vice versa.

### Shiny Pokemon:
There is a low chance to catch a shiny pokemon. They're worth 10x as much as a normal one.

### Resources
New Resource API for guaranteeing a data-type from the database. So whenever a user's Bank account is needed, it goes through Resource to always produce a BankAccount object from its template. Bank, Fishing, and Pokemon have been updated for this.

### Misc Changes/Fixes
 * conversions actually finally fixed for real this time I swear
 * Database backup in case my Resource API has a major flaw
 * Missed moving the discord utils to the moderation module.
 * Resource initialization fixed; for empty init data, it would not initialize the values with callbacks in the template.
 * Empty command input, made by just typing "!"
 * PromiseClient payload check forces field names/values to strings.
 * Debug commands return inline embed fields
 * User debugging no longer reveals the servers they share, instead shows the date they joined the server.


## 1.5.11: Pokemon Update, Command Suppression

### Pokemon
 * Items! Users can now "scavenge" for items, such as pokeballs, fruit, and rare candy. For now, only rare candy can be used.
 * Training! Pokemon may now "level up" by training (which gives 5 XP), and with rare candy. In the future, I hope to include combat in the mix.
 * Shopping! User may now purchase items if they don't feel like scavenging,  or sell items back for some money.
 * Pokemon.howmany now displays a tally of the user's current collection of pokemon, both of the total and of legendaries.
 * Selling a pokemon becomes more valuable the more leveled up it is.
 
### Bank
 * Credits can now be changed more safely through a function call rather than changing the credits directly

### Command
 * Commands can now be suppressed, or hidden from the .? listing (many admin-only commands have been updated to reflect this). This was necessary to allow all the pokemon subcommands to fit under the 2000-byte message limit.
 * Command info embed fields are now inline for more compact display
 
### Client
 * Command tail supports quoted strings, so that they are no longer split only by spaces. (Many commands have been updated to allow this). Especially useful for fishing/pokemon commands which sometimes use mult-word names/identifiers/types.

### MapBase
 * Fixed mismatching identifier in some functions

### Hotfixes, minor improvements
 * Bank leaderboard should display nicknames first, then usernames.
 * Since !* returns a message too long for Discord, I eliminated the use of `code` markdown and cutoff the last 3 characters with an elipsis.
 * Pokemon XP will also display the amount needed to reach its next Lvl.


## 1.?-1.5.10
For information on changes before 1.5.11, see the commit history at https://github.com/DragonOfMath/discord-dragon-bot/commits/master?after=0059acde2250010c3d8445aede52204375b93f39+34



