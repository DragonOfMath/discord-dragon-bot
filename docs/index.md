# DragonBot Commands
There are **517** commands in **13** categories.

## Catgories
 * [Admin](#admin) (43)
 * [Audio](#audio) (13)
 * [Discord](#discord) (81)
 * [Economy](#economy) (26)
 * [Fun](#fun) (106)
 * [Image](#image) (95)
 * [Meta](#meta) (17)
 * [Misc](#misc) (32)
 * [Moderation](#moderation) (41)
 * [NSFW](#nsfw) (28)
 * [Programming](#programming) (10)
 * [Text](#text) (16)
 * [Web](#web) (9)
## Admin

### `runjs ...code` *Private*

Aliases: `evaljs`

Run JavaScript code within the bot.

### `presence game [status]` *Private*

Aliases: `setpresence`, `botpresence`

Sets the bot's current presence.

### `stop` *Private*

Aliases: `stopbot`, `quit`, `abort`, `exit`, `ctrlq`, `die`

Stops execution of the bot.

### `suspend time` *Private*

Aliases: `pause`

Disconnects the bot for a period of time, then reconnects it.

### `proxy target ...message` *Private*

Aliases: `ghost`, `reply`

Send a message through the bot to another dimension.

### `alias ...command:alias` *Private*

Adds a temporary alias for a command.

### `ignore <users|bots|none>` *Private*

Toggles ignoring other users and bots (the owner is not affected).

### `embeds [boolean]` *Private*

Toggles the use of embeds in messages.

### `tts [boolean]` *Private*

Aliases: `text-to-speech`, `texttospeech`, `text2speech`, `t2s`

Toggles the use of text-to-speech in messages.

### `typing [boolean]` *Private*

Toggles typing simulation before each message.

### `errors <on|dm|off>` *Private*

Toggle handling of errors.

### `echo ...arguments` *Private*

Aliases: `print`, `display`

Display the arguments, which can be the output of an expression.

### `logging level` *Private*

Sets the logging level of the bot.
- 0 = Don't log anything
- 1 = Dont't log errors and warnings
- 2 = Normal logging
- 3 = Log everything

### `console` *Private*

Interface for printing information to the console window.

### `console.log ...data` *Private*

General logging of information.

### `console.info` *Private*

Information-level logging of information.

### `console.notice ...data` *Private*

Notice-level logging of information.

### `console.warn ...data` *Private*

Warning-level logging of information.

### `console.error ...data` *Private*

Error-level logging of information.

### `console.clear` *Private*

Clears the console.

### `memdump` *Private*

Aliases: `snapshot`

Takes a snapshot of the internal client data.

### `gendocs [<text|markdown|html>]` *Private*

Aliases: `generatedocs`

Generate documentation for the bot's commands.

### `register <cmd|command|spc|session|util|utility> path/to/js/file`

Aliases: `loadjs`

Load a JavaScript file from the application folder and apply it .

### `block user [...reason] -t/-time` *Private*

Blocks a user from using the bot. Additionally, you may set a reason for the block as well as a time limit for the block, after which the user is unblocked.

### `unblock user` *Private*

Unblocks a user and allows them to use the bot again.

### `database` *Private*

Aliases: `db`

Interface for database commands.

### `database.tables` *Private*

List the table names in the database.

### `database.records table` *Private*

List the records in the given table.

### `database.fields table record` *Private*

List the fields in the given record and table.

### `database.get table record field` *Private*

Retrieve a field from the specified table and record. The field can be nested.

### `database.set table record field value` *Private*

Set a field from the specified table and record to the JSON-able value. The field can be nested.

### `database.remove table record [field]` *Private*

Aliases: `delete`

Delete a field or record from the specified table.

### `database.count table` *Private*

Counts the number of records in a table.

### `database.backup` *Private*

Aliases: `copy`

Saves a backup of the database.

### `database.revert` *Private*

Aliases: `restore`, `undo`

Loads a backup of the database.

### `database.prune table` *Private*

Aliases: `gc`

Garbage collects unused entries in the given table.

### `ip website` *Private*

Aliases: `address`

Looks up the IP address and location of a website/domain.

### `roles.create ...roles` *Privileged*

Aliases: `make`, `new`

Create new self-assignable role(s), with no special permissions. You can assign a color to a role by appending it with `:color`, e.g. `artist:#FFFF00` (for yellow).

### `roles.rename oldname newname` *Privileged*

Aliases: `name`

Renames an existing role.

### `roles.recolor role color` *Privileged*

Aliases: `color`

Replaces color of an existing role.

### `roles.assign ...roles` *Privileged*

Aliases: `register`

Makes role(s) self-assignable.

### `roles.unassign ...roles` *Privileged*

Aliases: `unregister`

Makes role(s) un-self-assignable.

### `roles.permissions role ...flags` *Privileged*

Aliases: `perms`

Override role permissions. Use ! in front of permission flags to disable them.

## Audio

### `music`

Interface for playing music in Voice Channels. I will join your VC when called for and leave when you want me to or when I'm alone. (EXPERIMENTAL DISCLAIMER: This command is not totally working yet, due to problems with overriding audio streams)

### `music.search ...keywords`

Search my local library for music. (Note: this will be replaced with YouTube search eventually)

### `music.play [...keywords]`

Play/resume playing music (limited to local files atm).

### `music.pause`

Pause the current track. Use `play` to resume playing.

### `music.stop`

Stops playing music and leaves the VC.

### `music.skip [by]`

Skip the current track. Optionally, skip by a number of tracks.

### `music.playing`

Aliases: `nowplaying`, `np`

Displays the track that is currently playing.

### `music.playlist`

Aliases: `pl`, `songs`, `queue`

Get the current playlist.

### `music.replay`

Aliases: `restart`

Replay the current song from the start.

### `music.mute`

Aliases: `unmute`

Mute or unmute the bot.

### `music.remove idx|name`

Remove a song from the playlist.

### `music.loop [<song|playlist>]`

Aliases: `repeat`

Toggle looping the current song or entire playlist. (defaults to song)

### `music.shuffle`

Mix up the current playlist.

## Discord

### `analytics [...commands] [page] -a/-all/-global -t/-temp`

Display statistics about bot command usage in this server. Use the flag `-a` or `-all` for global analytics and `-t` or `-temp` for temporary analytics (since the bot was online).

### `analytics.delete ...items -a/-all` *Private*

Aliases: `remove`, `rem`, `del`

Deletes specific items from the analytics table.

### `analytics.merge dest [...src] -a/-all` *Private*

Merges two or more items in the analytics table, for cleaning up legacy commands. (You can use JSON to quickly merge multiple things, just do {keyToMerge: [...items to merge]})

### `analytics.sort [<key|key-desc|value|value-desc>] -a/-all` *Private*

Sorts analytics items alphabetically (or by any way specified)

### `analytics.toggle` *Private*

Aliases: `enable`, `disable`

Toggle command usage tracking.

### `membercount`

Aliases: `membergrowth`, `servergrowth`

Displays the server's growing member count over the past 100 days.

### `commands` *Privileged*

Aliases: `cmds`

Interface for enabling and disabling commands. *You should configure commands in a private channel to avoid mentioning users and roles.*

### `commands.enable ...commands [...targets]` *Privileged*

Aliases: `allow`

Enables command(s) for the current channel/channel(s)/user(s)/role(s).

### `commands.disable ...commands [...targets]` *Privileged*

Aliases: `deny`

Disables command(s) for the current channel/channel(s)/user(s)/role(s).

### `commands.clear ...commands` *Privileged*

Aliases: `reset`

Clears permission settings for the given commands in this server.

### `commands.copy src_command ...commands` *Privileged*

Copy permission settings from one command to one or more commands.

### `commands.invert ...commands` *Privileged*

Inverts the accessibility scope of permissions. Inclusive becomes exclusive, and vice versa. Public/private/privileged commands are not affected.

### `commands.check ...commands` *Privileged*

Retrieves the command permissions for the server.

### `commands.checkall command` *Private*

Retrieves ALL server permissions for a single command.

### `commands.move ...old:new` *Private*

Aliases: `replace`, `alias`, `rename`

Replace permission entry keys with new ones, in case the names of commands change and are no longer binded. :warning: Warning! This is a low-level command, it will create or delete data regardless of validation!

### `commands.create name code` *Privileged*

Aliases: `new`

Create a new temporary command. Surround the code in a code block for proper parsing. By default, unlimited arguments may be passed and all known context members are defined.

### `bot`

Aliases: `client`

Shows bot info, such as command count, uptime, ping, memory usage, and version, as well as a count of guilds, channels, and users.

### `bot.commands`

Aliases: `cmds`

Displays the number of commands currently registered.

### `bot.developer`

Aliases: `dev`, `owner`

Displays the bot's developer.

### `bot.performance`

Displays uptime, pint, and memory usage.

### `bot.uptime`

Aliases: `up`

Displays how long the bot has been running.

### `bot.ping`

Aliases: `ms`

Checks bot latency.

### `bot.memory`

Aliases: `mem`

Checks bot memory usage.

### `bot.version`

Shows bot and library versions.

### `bot.src`

Aliases: `source`, `sourcecode`, `repo`, `github`

Gives link to GitHub repository that has the bot's source code, for whatever reason.

### `bot.stats`

Shows how many guilds, channels, and users the bot is connected to.

### `bot.commits [commitID]`

Aliases: `commit`

Get commit history on the bot.

### `bot.shard`

Get shard ID, not that it really matters at the moment...

### `info`

Information interface for Discord resources.

### `info.message [messageID]`

Displays information about a message.

### `info.channel [channel]`

Displays information about a channel.

### `info.server [serverID]`

Aliases: `guild`

Displays information about a server.

### `info.user [userID]`

Aliases: `member`

Displays information about a user.

### `info.role roleID`

Displays information about a role.

### `info.invite invite`

Reveals information about a server invite. (doesn't work on vanity invites)

### `info.snowflake id` *Private*

Aliases: `id`

Analyze and identify information about a snowflake ID.

### `info.token token` *Private*

Analyze and identify information about a Discord Token

### `list`

Listing interface for all users, roles, and channels in this server.

### `list.users [page]`

Aliases: `members`

List members of this server.

### `list.roles [page]`

List roles of this server.

### `list.channels [page]`

List channels of this server.

### `list.all` *Private*

Aliases: `every`

Listing interface for all users, roles, channels, and servers the bot has access to.

### `list.all.users [serverID] [page]` *Private*

Aliases: `members`

List all users the bot has access to. Optionally, filter by server ID.

### `list.all.roles [serverID] [page]` *Private*

List all roles the bot has access to. Optionally, filter by server ID.

### `list.all.channels [serverID] [page]` *Private*

List all channels the bot has access to. Optionally, filter by server ID.

### `list.all.servers [userID] [page]` *Private*

Aliases: `guilds`

List all servers the bot has access to. Optionally, filter by servers that a user is in.

### `search [channel] ...keywords`

Aliases: `find`, `lookup`, `query`

Search a message in the current channel, up to 100 messages into history.

### `search.user discriminator | keyword [...more keywords]`

Aliases: `users`

Search for usernames with the given keywords in their name OR discriminator.

### `search.role ...keywords`

Aliases: `roles`

Search for roles with the given keywords in their name.

### `search.channel [...keywords]`

Aliases: `channels`

Search for channels with the given keywords in their name.

### `search.status <online|offline|idle|invisible|dnd>`

Search users with the given discriminator.

### `search.all` *Private*

Aliases: `every`, `global`

Search interface for finding a user, role, or channel in any server.

### `search.all.user discriminator | keyword [...more keywords]` *Private*

Aliases: `users`

Search all users with the given keywords in their name OR discriminator.

### `search.all.role ...keywords` *Private*

Aliases: `roles`

Search all roles with the given keywords in their name.

### `search.all.channel ...keywords` *Private*

Aliases: `channels`

Search all channels with the given keywords in their name.

### `search.all.server ...keywords` *Private*

Aliases: `servers`

Search all servers with the given keywords in their name.

### `quote [channel] [messageID]`

Quote a message in the channel. Or quote a random message by someone.

### `prefix [x]` *Privileged*

Aliases: `cprefix`, `customprefix`, `prefixes`, `cprefixes`, `customprefixes`

Add a custom prefix for the server or list the currently used prefixes.

### `prefix.remove x` *Privileged*

Aliases: `delete`

Remove a custom prefix from the server.

### `prefix.clear` *Privileged*

Aliases: `deleteall`, `removeall`

Remove all custom prefixes from the server.

### `roles`

Aliases: `role`

Manage roles on the server, and allow users to assign themselves roles or remove roles.

### `roles.add ...roles`

Aliases: `give`, `iama`, `iam`

Assigns roles to you.

### `roles.remove ...roles`

Aliases: `take`, `iamnota`, `iamnot`

Removes roles from you.

### `roles.list`

Aliases: `show`, `display`, `roles`

Lists all roles that may be assigned/removed.

### `ping [url]`

Basic heartbeat/latency checkup command, or ping an address.

### `invite`

Gives you a link to add the bot to your servers.

### `permcalc ...flags`

Aliases: `permissions`

Calculate the number that is masked by these permissions: `CREATE_INSTANT_INVITE`, `KICK_MEMBERS`, `BAN_MEMBERS`, `ADMINISTRATOR`, `MANAGE_CHANNELS`, `MANAGE_GUILD`, `ADD_REACTIONS`, `VIEW_AUDIT_LOG`, `VIEW_CHANNEL`, `SEND_MESSAGES`, `SEND_TTS_MESSAGES`, `MANAGE_MESSAGES`, `EMBED_LINKS`, `ATTACH_FILES`, `READ_MESSAGE_HISTORY`, `MENTION_EVERYONE`, `USE_EXTERNAL_EMOJIS`, `CONNECT`, `SPEAK`, `MUTE_MEMBERS`, `DEAFEN_MEMBERS`, `MOVE_MEMBERS`, `USE_VAD`, `CHANGE_NICKNAME`, `MANAGE_NICKNAMES`, `MANAGE_ROLES`, `MANAGE_WEBHOOKS`, `MANAGE_EMOJIS`

### `help [command]`

Aliases: `?`, `whatis`

Lists bot commands, or shows information about a command.

### `category [category]`

Aliases: `categories`

Lists bot categories, or shows commands under that category.

### `caniuse command [channel]`

Aliases: `allowed`

Checks your permissions to use a command. Optionally, you may specify which channel to use it in.

### `undo`

Aliases: `oops`

Removes the bot's last post in this channel (in case it posts something stupid).

### `redo [user]`

Aliases: `f5`

Re-runs the last command you or a specific user gave, except for `redo` and `undo`.

### `contact ...message`

Aliases: `message`, `feedback`, `bugreport`, `report`, `suggest`

Send a direct message to the bot owner. Let me know if you've encountered a bug, have an idea for the bot, or just wanted to say hi! :smiley:

### `dstatus`

Aliases: `discordstatus`

Get the health status of Discord.

### `nickname name`

Aliases: `nick`, `nickme`

Request a nickname change.

### `welcome` *Privileged*

Let your users feel welcome! Set a channel and message for which this bot may greet them.

### `welcome.message ...message` *Privileged*

Sets the server's welcome message for new users that join. To insert their name, type `$user`, and to mention them, type `$mention`.

### `welcome.channel [channel]` *Privileged*

Gets or sets the server's channel where welcome messages may be displayed.

### `welcome.role [role]` *Privileged*

Gets or sets the server's standard role for new members.

### `welcome.goodbye [...message]` *Privileged*

Gets or sets the server's goodbye message for users that leave the server. To insert their name, type `$user`, and to mention them, type `$mention`.

### `welcome.test` *Privileged*

Test the welcome/goodbye messages.

## Economy

### `bank`

The bank tracks the credits of all users on the server. Credits can be used to play games, like Blackjack, Slots, Fishing, and Lottery. Users can transfer their credits or make investments. Authorized bank staff may offer loans and custom bank amounts.

### `bank.auth user` *Privileged*

Aliases: `authorize`

Authorizes special privileges to a user, such as the ability to open others' accounts and deposit/withdraw at will.

### `bank.unauth user` *Privileged*

Aliases: `unauthorize`, `deauthorize`

Strips authorized privileges from a user.

### `bank.isauth [user]`

Aliases: `isauthorized`

Checks account for authorized privileges.

### `bank.open [user]`

Aliases: `create`, `new`

Opens an account to you or another user. If the account already exists, it reopens it if closed.

### `bank.close [user]`

Closes `user`'s account, which prevents transactions.

### `bank.delete user`

Aliases: `reset`

Deletes `user`'s account. (This effectively just resets their bank account...)

### `bank.view [user]`

Aliases: `check`, `summary`, `account`, `profile`

Returns a summary of the `user`'s account.

### `bank.add [user] amount`

Aliases: `loan`, `deposit`

Gives `amount` credits to the `user`'s account.

### `bank.remove [user] amount`

Aliases: `tax`, `confiscate`, `withdraw`

Takes `amount` credits from `user`'s account.

### `bank.transfer [user] recipient amount`

Aliases: `give`

Transfers `amount` credits `from user` -> `to user`.

### `bank.invest <help|start|stop|check> [amount|invID]`

Set aside some of your credits for investing. The longer you wait, the more cash you get out of it.

### `bank.history [user] [page]`

Provides a history of `user`'s transactions, in order from newest to oldest.

### `bank.history.save [user]`

Backs up your account as proof of value for future issues.

### `bank.history.load user timestamp` *Private*

Aliases: `revert`

Reverts an account's state back to a log entry with the given timestamp ID.

### `bank.history.purge user` *Private*

Deletes account history, just in case...

### `bank.ledger [page]`

Provides a history of all transactions in the server, in order from newest to oldest.

### `bank.credits [user]`

Aliases: `balance`

Checks your account balance.

### `bank.top [page]`

Aliases: `leaderboard`, `hiscore`

Displays the top ranking users with the highest bank balances.

### `casino`

Aliases: `gambling`, `gamble`

Assortment of fun and risky minigames. Place your bets and win big!

### `casino.dice [bet]`

Roll a pair of dice. Pair of 1's or 6's = x2. Other pair = x1. Sum of 6 = x0.5. Any other roll = loss.

### `casino.coin [bet] [heads or tails]`

Aliases: `cointoss`, `coinflip`

Toss a coin and call it right.

### `slots [bet]`

Aliases: `slotmachine`

3-column slot machine game!

### `slots.table`

Aliases: `info`, `payout`

Displays the multipliers and chances of the slot items.

### `blackjack [...co-players] [bet]`

Classic Blackjack card game, now with other players! Have the highest hand without going over 21 to win. For a more thorough explanation, see the Wikipedia page https://en.wikipedia.org/wiki/Blackjack

### `currency amount from [to]`

Convert an amount from any currency to another. Default target currency is USD.

## Fun

### `cah [count]`

Aliases: `cardsagainsthumanity`

Picks a random white answer card.

### `cah.black`

Aliases: `b`

Picks a random black template card.

### `cah.packs`

Aliases: `list`, `listpacks`

Lists CAH Packs by Name, ID, and Count (Black/White). Bolded packs are in use on the server.

### `cah.add ...packIDs`

Aliases: `use`, `pack`, `usepack`

Choose card packs to use for this server. See `cah.packs` for a list of pack codes (online packs cannot be added).

### `cah.remove <w|white|b|black> id` *Privileged*

Aliases: `delete`

Remove a single custom card from this server.

### `cah.customcards [page] [<w|white|b|black>]`

Aliases: `customlist`

Lists the custom cards for the server.

### `cah.new <w|white|b|black> ...text` *Privileged*

Aliases: `make`, `create`, `custom`

Create a new white or black card to use on the server.

### `cah.clear [<w|white|b|black>]` *Privileged*

Aliases: `reset`

Clears all custom white/black cards for this server. Can choose a type of card, otherwise all are cleared.

### `4chan [board]`

Aliases: `chan`, `4ch`, `4`

Gets a random post from one of the boards on 4chan.org (You can specify which board, else one is chosen at random)

### `8chan [board]`

Aliases: `8ch`, `infinichan`

Gets a random post from one of the boards on 8ch.net (You can specify which board, else one is chosen at random)

### `connectfour [opponent]`

Aliases: `connect4`, `4inarow`

Play a game of Connect Four against another user or the bot. The first turn player is randomly selected.

### `daily`

Aliases: `money`, `cash`, `freebie`, `welfare`, `877-cash-now`

Earn free money every day!

### `fish`

Aliases: `fishy`, `fishing`, `feesh`

Catch critters of the sea to win big prizes! Each try costs **5 credits** and you must wait **20 seconds** between tries. :new: Events are here! For a limited time, fish will be harder/easier to catch, or be more/less valuable!

### `fish.inventory [user] [category]`

Aliases: `inv`, `catches`

Displays how many of each type of fish you've caught.

### `fish.info [fishtype|fishname|:fish:]`

Aliases: `fish`

Displays information about a fish by its type, name, or emoji. If no argument is passed, displays the types of fish to catch.

### `fish.events`

Aliases: `evts`

Displays any fishing events on this server.

### `fish.event`

Aliases: `evt`, `artifact`

Consumes an Artifact in your inventory to generate a random Fishing Event.

### `fish.table [sortby]`

Displays the current catch rates of all fish types. Can sort by name, value, chance, or type.

### `fish.newevent [fish] [<rarity|value>] [multiplier] [expires]` *Private*

(Admin only) Starts a new fishing event, either from given parameters or randomized.

### `fish.hittable [user] [ammo]`

Calculates the probability of hitting a bird, given a few sample Ammo values and the current hit percentage.

### `fish.wait [time]` *Private*

Temporarily set the cooldown for `fish` usage.

### `rate`

Aliases: `outta10`

I will rate anything out of 10 points.

### `decide ...choices`

Aliases: `choose`, `choices`

Let me choose between your choices (use quotation marks/OR/`|` to separate mult-word choices; if left out, all words are choices)

### `eightball ...question`

Aliases: `8ball`, `8`

Ask me a yes-no question and I'll tell you the answer!

### `card [number]`

Aliases: `pickcard`, `pickacard`, `cardpick`

Pick a card (or number of cards, limit of 5) from a standard 52-card deck

### `coin [rolls]`

Aliases: `flipcoin`, `coinflip`, `tosscoin`, `cointoss`

Flip a coin.

### `dice [rolls]`

Aliases: `rolldice`, `diceroll`, `dice6`, `d6`

Roll a 6-sided die.

### `dice20 [rolls]`

Aliases: `rolldice20`, `diceroll20`, `d20`

Roll a 20-sided die.

### `roll ...XdXX * scale + offset + `

Advanced dice-roll command, using an expression of dice rolls in the form XdXX, plus modifiers.

### `rps <r|rock|✊|p|paper|✋|s|scissors|✌>`

Aliases: `rockpaperscissors`

A classic game of Rock Paper Scissors versus the bot!

### `bottle [...opt-in|opt-out|]`

Aliases: `messageinabottle`, `miab`

Send an anonymous message in a bottle to a random online user on the server. Or opt-in/opt-out from receiving bottles. (You automatically opt-in when sending)

### `xkcd [number]`

Shows you a random XKCD comic.

### `pressf [object]`

Aliases: `payrespects`, `pf2pr`

Press F to pay respects.

### `aaa`

Aliases: `aaaa`, `aaaaa`

Scream AAAAAAAAAAA!!!

### `random`

Aliases: `rand`, `rng`

Random

### `random.integer [lowerbound] [upperbound]`

Aliases: `int`, `i`

Get a random intger between two values. Default is in range of 0 to 10^10.

### `random.number [lowerbound] [upperbound]`

Aliases: `num`, `n`

Get a random real number between two values. Default is in range of 0 to 10^10.

### `random.letter [letters]`

Aliases: `let`, `l`

Get a random letter from the standard English alphabet, or your own charset.

### `random.string [length] [letters]`

Aliases: `str`, `s`

Generate a random string of letters. Default length of 10 and using the standard English alphabet.

### `random.user [<everyone|here|offline|role>] [rolename]`

Aliases: `member`, `mention`, `m`

Pick a random user on the server and mention them (lol). Optionally, you can specify if you want to pick from only online users, offline users, everyone, or those with a specific role.

### `random.role`

Aliases: `r`

Pick a random role on the server. (Warning: this might mention everyone!)

### `random.channel`

Aliases: `chan`, `c`

Pick a random channel on the server.

### `random.emoji [<discord|custom|any>]`

Aliases: `e`

Pick a random emoji, either from Discord emojis, custom emojis, or any.

### `random.command`

Aliases: `cmd`

Pick a random command. (gives you the usage, does not actually run it)

### `random.token`

Generate a random fake Discord Token.

### `gol [rules] -w/-wrap`

Aliases: `gameoflife`, `conway`

Simulate the Game of Life... in Discord! Set the rules in the format `B###/S###` where B is birth conditions and S is survival conditions, each followed by digits 0-8. The default rules are `B3/S23`.

### `maze [width] [height]`

Aliases: `labyrinth`

Play the maze runner game. You can set the maze size (limited from 10x10 up to 100x100).

### `lottery amount`

Participate in the global lottery. Specify how many tickets you wish to by at **:dragon:$50.0** each, up to **100** tickets. Every **12 hours** the bot will pick a number, and if one of your tickets includes that number, you win the jackpot! Tickets will be reset at that time, so the jackpot can keep growing.

### `lottery.tickets`

Aliases: `numbers`

List the ticket numbers you've purchased.

### `lottery.info`

Get the current jackpot, the total number of tickets purchased globally, the time remaining, and the last winning number of the Lottery.

### `lottery.time`

Aliases: `countdown`

Get the time left until the lottery round is over.

### `lottery.winner`

Aliases: `last`

Get the winning number of the last lottery round.

### `lottery.jackpot`

Aliases: `jp`, `total`

Check the current jackpot of the lottery.

### `lottery.end` *Private*

Aliases: `finish`

End the lottery round before it is officially over.

### `lottery.cancel [resetJackpot]` *Private*

Aliases: `forfeit`

Cancel the current lottery and refund all participants. Specify whether to reset the jackpot or not.

### `lottery.custom amount` *Private*

Aliases: `override`

Set a custom jackpot for the Lottery.

### `markov [iterations] [seed]`

Aliases: `mchain`

Produce a sentence using a Markov chain of words and phrases. Can use a seed to start a sentence off.

### `markov.add ...text`

Aliases: `input`, `in`

Add custom input to the Markov chain.

### `markov.read channel [count]` *Privileged*

Aliases: `messages`

Read a number of messages in a channel and add them to the Markov chain. Default is 100 messages (ignores command messages)

### `markov.clear` *Private*

Clears all Markov chain data.

### `minesweeper [...co-players]`

Play the classic Minesweeper game, with additional multiplayer!

### `pokemon`

Aliases: `pkmn`

Catches a random Pokémon. Cooldown: **2 hours**

### `pokemon.pokedex [query]`

Aliases: `pokeinventory`, `pinventory`, `pinv`

Displays your Pokémon. Optionally include a search term to filter Pokémon.

### `pokemon.legendaries`

Aliases: `lgds`

Displays your legendary Pokémon. (Shortcut for `pokemon.pokedex -legendary`)

### `pokemon.favorites`

Aliases: `faves`

Displays your faved Pokémon. (Shortcut for `pokemon.pokedex -favorites`)

### `pokemon.shinies`

Aliases: `shinys`

Displays your shiny Pokémon. (Shortcut for `pokemon.pokedex -shiny`)

### `pokemon.inventory [user]`

Aliases: `items`, `iteminventory`, `iinventory`, `iinv`

Displays your inventory items.

### `pokemon.info pokemon`

Displays info about a Pokémon from your inventory.

### `pokemon.gif [pokemon]`

Embeds a GIF of a Pokémon.

### `pokemon.rename pokemon name`

Give one of your Pokémon a new name (limit 40 characters).

### `pokemon.howmany`

Aliases: `count`, `progress`

Shows how many Pokemon you've caught out of the total.

### `pokemon.refresh [user]` *Private*

Aliases: `f5`

Skip cooldown for catching, scavenging, and training.

### `pokemon.reset [user]` *Private*

Aliases: `clear`

Reset Pokémon data.

### `pokemon.free pokemon`

Aliases: `release`

Remove one Pokémon from your inventory by its ID, then decrease your cooldown by up to 1 hour.

### `pokemon.trade user pokemon`

Aliases: `give`, `exchange`

Trade a Pokémon with a friend! (Name is reset upon trading)

### `pokemon.sell pokemon`

Sell a Pokémon for its value. Leveled Pokémon are worth more.

### `pokemon.fave pokemon`

Aliases: `fav`, `favorite`, `favourite`

Favorite one of your Pokémon.

### `pokemon.unfave pokemon`

Aliases: `unfav`, `unfavorite`, `unfavourite`

Un-favorite one of your Pokémon.

### `pokemon.battle [opponent]`

Aliases: `duel`, `fight`

Battle against the bot or another player, using your active pokémon!

### `pokemon.item`

Aliases: `scavenge`

Scavenge for items that you can use in battle or sell for cash! Cooldown: **1 hour**

### `pokemon.candy pokemon`

Use a Rare Candy from your inventory on one of your Pokémon.

### `pokemon.active [pokemon]`

Gets or sets your Active Pokémon, which you can use for training and battling.

### `pokemon.train [pokemon]`

Give **5 XP** to one Pokémon of your choice, or one at random. Cooldown: **30 minutes**

### `pokemon.shop`

The PokéShop sells Pokéballs, battle items, and rare candies.

### `pokemon.shop.browse [item]`

Aliases: `view`, `inventory`, `inv`

View the current inventory and prices of the PokéShop.

### `pokemon.shop.buy item [amount]`

Aliases: `purchase`

Purchase an item from the PokéShop.

### `pokemon.shop.sell item [amount]`

Sell an item to the PokéShop.

### `pokemon.identify [imageURL]`

Identify a pokémon based on its picture. Either link the image or upload it.

### `bulbapedia [topic]`

Aliases: `pokemonwiki`, `pkmnwiki`, `pokewiki`

Search for Pokemon articles on Bulbapedia.

### `reddit [subreddit]`

Retrieve a random reddit post from a sub of your choice or one at random.

### `reddit.new [subreddit]`

Get the newest posts of a subreddit.

### `reddit.rising [subreddit]`

Get the rising posts of a subreddit.

### `reddit.top [subreddit] [filter]`

Get the top posts of a subreddit from the last __day__, __week__, __month__, __year__, or from __all__ time.

### `reddit.controversial [subreddit] [filter]`

Get the controversial posts of a subreddit from the last __day__, __week__, __month__, __year__, or from __all__ time.

### `reddit.gilded [subreddit] [filter]`

Aliases: `golden`

Get gilded posts of a subreddit from the last __day__, __week__, __month__, __year__, or from __all__ time.

### `reddit.subbed [page]`

Aliases: `listsubs`, `listsubscriptions`, `listsubbed`, `subbed`, `subscribed`

List subreddits this channel is currently subscribed to.

### `reddit.sub ...subreddits`

Aliases: `subscribe`, `add`

Subscribe to new posts from a subreddit and see them posted in this channel periodically.

### `reddit.unsub ...subreddits`

Aliases: `unsubscribe`, `remove`

Unsubscribe from a subreddit this channel is subscribed to.

### `reddit.enable`

Aliases: `disable`, `toggle`

Toggle the use of the subscription service for this channel.

### `reddit.polling time`

Aliases: `pollinterval`, `polltime`

Sets the polling time in seconds for retrieving new posts. Lower means shorter waiting but higher traffic.

### `reddit.options type [timespan] [limit]`

Aliases: `subopts`

Set subscription options for this channel, which include what type of posts to get, in what time span, and how many posts to poll for.

### `reddit.status`

Aliases: `isitdown`

Check the health status of reddit.

### `sudoku [difficulty]`

Play a game of Sudoku. Enter a number from 0 to 100 to set the difficulty.

### `call [user]`

Aliases: `telephone`, `ringring`

Pick up the phone and see who answers! As this is a rather privacy-sensitive command, you should use this in DMs with the bot. You can call a specific user and I will try to contact them, otherwise, I will hook you up with anyone else also using `call` within 30 seconds. To end a call, use this command again.

### `tictactoe [<x|o>] [opponent]`

Aliases: `ttt`, `3inarow`

Play a game of Tic-Tac-Toe against another user or the bot. You can choose to be X or O. The first turn player is randomly selected.

### `towers [difficulty]`

Aliases: `hanoi`, `towersofhanoi`, `towerofhanoi`, `toh`

Play the Tower of Hanoi minigame. The difficulty value is the number of blocks to stack.

## Image

### `graph <line|scatter|bar|pie> ...(x,y) -w/-width -h/-height -t/-title -x/-xaxis -y/-yaxis -b/-borders -o/-origin -g/-grid`

Aliases: `chart`, `graphing`

Graph some data. Flags: image `w`idth, image `h`eight, graph `t`itle, `x`-axis label, `y`-axis label, draw all 4 `b`orders, draw `o`rigin, draw `g`rid

### `image`

Aliases: `img`, `picture`, `pic`

A variety of image-manipulating commands.

### `image.hash [imageURL] [base]`

Aliases: `phash`, `perceptualhash`

Get the perceptual hash of an image. Optionally, specify the base you wish to output in, default is 16.

### `image.test [<blank|grid|checkerboard|color|noise|random>] [size]`

Aliases: `testing`, `generate`

Creates a testing image. Specify what preset to use and at what size.

### `image.brailleify [imageURL] [threshold] [scale] [invert]`

Aliases: `braille`

Turns an image into a Braille text thing.

### `image.flip [imageURL] [<horizontal|vertical|both>]`

Aliases: `mirror`

Flips an image horizontally, vertically, or both.

### `image.symmetry [imageURL] [<left-right|right-left|top-bottom|bottom-top|top-left|top-right|bottom-left|bottom-right>]`

Aliases: `woow`, `waaw`, `hooh`, `haah`

Mirrors an image along a symmetry.

### `image.greyscale [imageURL]`

Aliases: `grayscale`, `grey`, `gray`

Make the image greyscale.

### `image.invert [imageURL]`

Invert the colors of an image.

### `image.normalize [imageURL]`

Aliases: `normal`

Normalize the color ranges of an image.

### `image.sharpen [imageURL]`

Sharpens color boundaries in an image.

### `image.unsharpen [imageURL]`

Applies unsharp masking to an image.

### `image.emboss [imageURL]`

Applies emboss filter to an image.

### `image.gradient [imageURL] [dir]`

Calculates the image gradient.

### `image.sepia [imageURL]`

Applies sepia filter to an image.

### `image.hue [imageURL] [value]`

Adjust the hue of an image.

### `image.saturation [imageURL] [value]`

Aliases: `saturate`, `sat`

Adjust the saturation of an image.

### `image.brightness [imageURL] [value]`

Aliases: `lightness`, `brighten`, `lighten`

Adjust the brightness of an image.

### `image.contrast [imageURL] [value]`

Adjust the contrast of an image.

### `image.posterize [imageURL] [colors]`

Posterize an image to fewer colors.

### `image.pixelate [imageURL] [pixels]`

Aliases: `8bit`, `pixelize`, `pixel`

Pixelate an image. Default is 32x32 pixels.

### `image.crop [imageURL] [tolerance]`

Crop an image. Tolerance is a percentage of pixel difference.

### `image.resize [imageURL] [width] [height] [fit]`

Resize or refit an image to new dimensions.

### `image.rescale [imageURL] [scale]`

Rescale an image by a factor.

### `image.rotate [imageURL] [degrees]`

Rotate an image clockwise.

### `image.blur [imageURL] [radius]`

Apply blur to an image.

### `image.motionblur [imageURL] [strength] [direction]`

Aliases: `motion`

Apply motion blur to an image.

### `image.circleblur [imageURL] [strength] [xpos] [ypos]`

Aliases: `circle`, `spin`

Apply rotational blur with the specified strength to an image.

### `image.radialblur [imageURL] [strength] [xpos] [ypos]`

Aliases: `intensify`, `intensifies`

Apply radial blur with the specified center and strength to an image. Makes for a neat [intensifies] effect.

### `image.bulge [imageURL] [strength] [xpos] [ypos]`

Aliases: `fisheye`, `eyefish`, `bubble`, `explode`

Add a bulge at the specified center and strength to an image.

### `image.gravity [imageURL] [strength] [xpos] [ypos]`

Aliases: `implode`, `potionseller`, `inversefisheye`

Implode the image at the specified center and strength.

### `image.swirl [imageURL] [strength]`

Aliases: `twist`

Swirl an image with the specified strength, rotation, and radius.

### `image.warp [imageURL] [strength]`

Aliases: `distort`

Warp the image with random vectors.

### `image.complex [imageURL] [power] [iterations]`

Aliases: `fractal`, `wtf`

Trace the image through iterations of the complex function `f(z) = z^p + c`.

### `image.transform [imageURL] ...function`

Put an image through a custom transformation function. Current supported variables are x, y, idx, and color, plus any members of Math. (return keyword is provided)

### `image.stereogram [imageURL] [strength] [walleyed]`

Aliases: `magiceye`, `autostereogram`

Generate an autostereogram using an image as a depth field. Normally generates for cross-eyed viewing, but you can specify if you want it to generate for wall-eyed viewing.

### `image.droste [imageURL] [xpos] [ypos] [scalefactor]`

Aliases: `recursion`

Apply the Droste effect, which is a recursion of the image itself.

### `image.magik [imageURL]`

Aliases: `magick`, `magic`

Apply seam-carving to an image.

### `maze.generate [width] [height] [scale]`

Aliases: `gen`, `make`, `create`

Generate a maze.

### `maze.solve [imageURL] [scale]`

Solve a maze generated by this bot. Might or might not work with other mazes.

### `meme [imageURL] [toptext]`

Aliases: `maymay`, `dankify`, `whenyou`

Make a simple text+image meme.

### `meme.deepfry [imageURL]`

Aliases: `needsmorefrying`, `needsmoredeepfrying`

Deep-fry an image.

### `meme.jpeg [imageURL] [compression]`

Aliases: `jpg`, `needsmorejpeg`, `needsmorejpg`

Adds JPEG compression to an image.

### `meme.mojo [imageURL] [title]`

Aliases: `watchmojo`, `top10`

Create a Top 10 meme from the Watchmojo template. Format: image, title.

### `meme.brain ...items`

Aliases: `expandingbrain`, `brains`

Create an expanding brain meme with 3 to 6 texts/images. Format: things ordered from worst to best.

### `meme.drake ...items`

Create a Drake choice meme with 2 texts/images. Format: disliked thing, liked thing.

### `meme.thanos ...items`

Create a Thanos meme with 2 texts/images. Format: object, subject.

### `meme.shaq ...items`

Aliases: `isleep`, `realshit`

Create a sleeping Shaq meme with 2 to 3 texts/images. Format: ignored thing, woke thing, [super woke thing].

### `meme.ohfuck text`

Aliases: `mindblown`

Create an "oh fuck" meme with text.

### `meme.fact text`

Create a fact meme with text.

### `meme.byemom text`

Aliases: `google`

Google something bad while mom is away.

### `meme.www thingleft thingright`

Aliases: `whowouldwin`

Display the ultimate showdown between two things (text or images).

### `meme.note [noteitem]`

Aliases: `notepass`, `passingnote`

Pass a note in class.

### `meme.watermark [imageURL] [watermark] [text]`

Aliases: `whodidthis`, `ifunny`, `9gag`, `funwaa`, `smartphowned`, `weedbro`, `thisissosad`, `xbox`

Add one of these watermarks to an image (and optional text for some): `whodidthis`, `ifunny`, `9gag`, `funwaa`, `smartphowned`, `weedbro`, `thisissosad`, `xbox`. (Tip: you can use a command alias or a parameter to specify the watermark you want)

### `place [color] [xpos] [ypos]`

Aliases: `rplace`, `canvas`

A public canvas, where any user can paint pixels:
	* You may only choose one of these colors: red, green, blue, yellow, cyan, magenta, white, black.
	* The canvas dimensions are 256x256. X starts at the left, and Y starts at the top.
	* You may place one pixel every 30 seconds.

### `place.reset [size]` *Private*

Aliases: `clear`

Reset the canvas to a blank slate.

### `qr`

https://en.wikipedia.org/wiki/QR_code

### `qr.decode [imageURL]`

Aliases: `read`, `decrypt`, `unhack`

Read a QR code from the input image.

### `qr.encode ...text`

Aliases: `write`, `encrypt`, `hack`

Write input text to a QR image file. (Note: emojis will not be preserved)

### `mset [width] [height]`

Aliases: `mandelbrot`, `fractal`

Renders the current view of the Mandelbrot Set. Optionally, you may specify the width and height of the render (max 2000x2000).

### `mset.reset`

Aliases: `init`, `initial`, `default`

Resets all rendering options.

### `mset.aa [boolean]`

Aliases: `antialiasing`, `smoothing`

Gets or sets anti-aliasing.

### `mset.center [real] [imaginary]`

Aliases: `goto`, `position`, `pos`

Gets or sets center viewing position. Use `~` to leave a value unchanged.

### `mset.center.reset`

Aliases: `init`, `initial`, `default`

Resets center to (-0.5,0).

### `mset.center.move real imaginary [mode]`

Aliases: `change`

Moves the center viewing position of render by the offset specified. Use `~` to leave a value unchanged. Use the mode `pixels` to move by pixels, and `%` or `percent` to move by percentage of view width.

### `mset.center.random`

Moves the center to a random position.

### `mset.k [real] [imaginary]`

Aliases: `start`

Gets or sets the K-value (starting point) of the render. Use `~` to leave a value unchanged.

### `mset.k.reset`

Aliases: `init`, `initial`, `default`

Resets K-value to (0,0).

### `mset.k.random`

Randomizes K-value.

### `mset.zoom [value]`

Aliases: `mag`, `magnification`, `scale`

Gets or sets the magnification value.

### `mset.zoom.reset`

Aliases: `init`, `initial`, `default`

Resets magnification to x150.

### `mset.zoom.in mult`

Aliases: `enlarge`

Multiplies magnification.

### `mset.zoom.out mult`

Aliases: `shrink`

Divides magnification.

### `mset.depth [value]`

Aliases: `threshold`, `dwell`

Gets or sets the iteration depth.

### `mset.depth.reset`

Aliases: `init`, `initial`, `default`

Resets depth to 48.

### `mset.depth.add [value]`

Aliases: `change`, `increase`

Increases iteration depth by the specified amount, default is 32.

### `mset.depth.auto`

Aliases: `fix`, `adjust`

Auto-adjusts depth to current magnification value.

### `mset.presets [page]`

Lists stored render presets.

### `mset.presets.save [index]`

Save current render settings as a preset.

### `mset.presets.load index`

Load an existing render preset.

### `mset.presets.erase index`

Aliases: `delete`, `remove`

Delete a render preset.

### `mshader`

Aliases: `mstyle`, `mcolors`, `mcolor`

Displays the shader settings for rendering the Mandelbrot Set.

### `mshader.scale [value]`

Gets or sets the scale of the color palette index, which is the iteration values covered per color. Higher value means smoother color transitions.

### `mshader.reset`

Resets the color palette and other shader settings.

### `mshader.random [numcolors]`

Aliases: `randomize`

Generates a random color palette and scale. Optionally, specify number of colors to produce.

### `mshader.add [red] [green] [blue]`

Add a color to the color palette. If no arguments are provided, a random one is generated.

### `mshader.edit index red green blue`

Aliases: `set`, `replace`

Edit a color given the specified index.

### `mshader.swap index1 index2`

Exchange the place of two colors by their indices.

### `mshader.remove index`

Remove color at the specified index of the palette.

### `mshader.clear`

Remove all colors at once to start from a blank palette.

### `mshader.preview`

Displays a gradient of the current color palette.

### `mshader.presets [page]`

Lists stored shader presets.

### `mshader.presets.save id`

Save current shader settings as a preset. ID can be the name or index.

### `mshader.presets.load id`

Load an existing shader preset. ID can be the name or index.

### `mshader.presets.erase id`

Aliases: `delete`, `remove`

Delete a shader preset. ID can be the name or index.

## Meta

### `noop`

Aliases: `nop`, `nope`, `nothing`

Does nothing.

### `if condition {trueCommand} [{falseCommand}]`

If `condition` evaluates to *true*, it runs `trueCommand`; else, it runs `falseCommand` (if there is one).

### `while condition {command}`

Repeats a command while `condition` evaluates to *true*.

### `batch {...commands}`

Aliases: `bat`, `multi`

Runs a batch of commands sequentially (with a delay to prevent rate-limiting). If an error is raised, it will stop mid-execution.

### `repeat count {command}`

Aliases: `rept`, `loop`

Runs a command a specified number of times or until an error occurs.

### `delay delay [{command}]`

Aliases: `wait`, `timeout`

Wait a specified delay of time (in milliseconds), then run a command if provided.

### `interval repetition delay {command}`

Repeat a command with delay.

### `cancel [message]`

Aliases: `throw`, `error`

Intentionally throw an error, useful for stopping execution of metacommands.

### `try {command}`

Aliases: `catch`

Runs a command, and if it throws an error, continues rather than propagate the error.

### `async {command}`

Run a command asynchronously.

### `with context {...commands}`

Aliases: `using`

Run subcommands using the contextual ID of the parent command.

### `self {command}`

Run a command with the contextual user being the bot itself.

### `var name [value]`

Aliases: `variable`

Gets or sets a variable. *Hint: if you are assigning the result of an expression to a variable, use* `%(...)`

### `var.inc name [value]`

Aliases: `increment`

Increments a variable by 1, or by some amount.

### `var.dec name [value]`

Aliases: `decrement`

Decrements a variable by 1, or by some amount.

### `var.del name`

Aliases: `delete`

Deletes a variable.

### `foreach enumerable var {command}`

Aliases: `for`, `enumerate`, `enum`

Enumerates a range of values. If `enumerable` is a number, it iterates from 0 up to N-1 (hard limit of 10000). If it's a string, it iterates using each character.

## Misc

### `color [red] [green] [blue]`

View a color.

### `color.random`

Generate a random color.

### `color.hsl`

Generate a color from HSL format.

### `math [expression]`

Aliases: `maths`, `calculate`, `calc`

Mathemathical! A handy pocket calculator for Discord!

### `math.sum from to ...function-of-x`

Aliases: `summation`

Sums the result of f(x) where x is an integer from a to b, and f is your function. For example, `1 5 x*x` would give you 55.

### `math.prod from to ...function-of-x`

Aliases: `product`

Multiplies the result of f(x) where x is an integer from a to b, and f is your function. For example, `1 5 x` would give you 120.

### `math.factorial number`

Calculates the factorial of an integer.

### `math.factor number`

Find the prime factors of a number.

### `math.isprime number`

Determine if a given number is prime (limit is 10^8, or 100 million)

### `math.gcd number1 number2`

Aliases: `greatestdivisor`, `greatestfactor`, `greatestmultiple`, `gcf`, `gcm`

Find the GCD of two numbers.

### `math.pow base [exponent]`

Aliases: `power`, `powerof`, `^`, `exp`, `exponent`, `exponentiation`

Calculate a base number raised to an exponent. Default is the square n = 2.

### `math.root base [n]`

Aliases: `sqrt`, `cbrt`, `nthroot`, `nroot`

Calculate the nth root of a number. Default is the square root n = 2.

### `math.fraction [number]`

Aliases: `decimal2fraction`, `d2f`

Convert a floating-point number to its approximated ratio (Experimental, might not work!)

### `math.pascal [N]`

Aliases: `pascaltri`, `pascaltriangle`

Calculate a few rows of Pascal's Triangle. You can specify the *Nth* row to display.

### `math.combination n [k]`

Aliases: `combinations`, `nchoosek`

Calculate the k-combinations of n items.

### `math.permutation n [k]`

Aliases: `permutations`

Calculate the k-permutations of n items.

### `math.constant name`

Aliases: `const`

Get a known mathematical constant.

### `roman number`

Aliases: `romannums`, `romannumerals`

Converts to and from Roman Numerals.

### `todo [id|objective]`

Aliases: `checklist`

Gets your to-do list or adds a new item to it. (limited to 100 chars/item and 20 items)

### `todo.next`

Aliases: `random`

Picks a random thing from your to-do list.

### `todo.done id|objective`

Aliases: `check`, `finish`, `finished`, `complete`, `completed`

Complete an objective on your to-do list.

### `todo.clear`

Aliases: `reset`, `redo`

Clear all objectives from your to-do list.

### `yugioh [topic]`

Aliases: `ygo`, `yugiohwiki`, `ygowiki`, `yugipedia`

Get info about a Yu-Gi-Oh! card, archetype, character, etc.

### `poll topic ...emoji=choice -m/-mention` *Privileged*

Aliases: `polling`, `vote`, `voting`

Start a poll in the channel. Specify a topic and 2-10 choices. Optionally, you can specify the emoji for a choice by prepending it with the emoji and a `=`, otherwise it defaults to 0-9

### `reminder ...time ...text`

Aliases: `remindme`, `setreminder`, `note`

Set a reminder to be sent to your DMs after a specified time. After setting, you will be given the ID of the reminder in case you want to cancel it.

### `reminder.cancel reminderID`

Aliases: `stop`, `ignore`, `end`, `fulfill`

Cancel a reminder to you using its ID.

### `timer ...time`

Aliases: `stopwatch`

Set a timer. Format example: 3 hours 2 minutes 5 seconds OR 00:30:10.00.

### `timezone [tzcode]`

Aliases: `tz`

Get the current time in another timezone, either using the timezone abbreviation ("EST") or the IANA region code ("America/New York").

### ~~`screenshot url -s/-scripts`~~

Aliases: `ss`

Take a screenshot of a website. Use the `-s` or `-scripts` flag to enable dynamic loading.

### ~~`tag`~~

Aliases: `t`



### ~~`auto`~~

Aliases: `autoresponse`, `reply`



### ~~`weather city|city,region|zip,region|lat,lon`~~

Aliases: `forecast`

Gets the current weather at a city/zip code. If specifying a city of a specific region, use `city,region` format.

## Moderation

### `dehoist user` *Privileged*

Aliases: `unhoist`

Change a user's nickname such that they are no longer hoisted (e.g. using a "!" in their name) in the member list.

### `archive count -b/-bot -c/-cmds -t/-text -m/-media -p/-pinned` *Privileged*

Aliases: `move`

Move messages in the current channel to an archive channel. Use flags to specify the kinds of messages to target: `-cmds`, `-bot`, `-media`, `-text`, and `-pinned`.

### `archive.id [channel]` *Privileged*

Aliases: `channel`, `channelid`

Gets or sets the archive channel ID.

### `cleanup [count] -b/-bot -c/-cmds -t/-text -m/-media -p/-pinned` *Privileged*

Aliases: `delete`, `nuke`, `prune`, `purge`, `tidy`

Delete messages in the current channel. Use flags to specify the kinds of messages to filter out.

### `snipe [user]` *Privileged*

Find the most recent deleted message in the channel.

### `vckick channel` *Privileged*

Kick users out of a voice channel.

### `warn ...users reason` *Privileged*

Warn a user (or several) and give a reason why.

### `mute ...users reason` *Privileged*

Mute a user (or several) to prevent them from sending messages or using voice channels.

### `unmute ...users [reason]` *Privileged*

Unmute a user (or several) to enable them to read messages and join voice channels once again.

### `kick ...users reason` *Privileged*

Kick a user (or several) from the server and give a reason why.

### `ban ...users reason` *Privileged*

Ban a user (or several) from the server and give a reason why.

### `unban ...users [reason]` *Privileged*

Aliases: `pardon`

Unban a user.

### `softban ...users reason` *Privileged*

Aliases: `tempban`

Softban (ban+unban) a user (or several).

### `strike ...users reason` *Privileged*

Aliases: `x`

Issue a strike to a user (or several). Each strike will dispatch the assigned action.

### `unstrike user` *Privileged*

Aliases: `unx`

Remove a strike from a user. This is if they display continuous good behavior.

### `lockdown <on|off|1|0|true|false>` *Privileged*

Aliases: `codered`

In the event of a raid/attack, lockdown mode will delete recent invites, set the server to maximum verification level (TODO: monkey-patch this in discord.io?), and observe new members. Should any user spam messages in a short amount of time or mention anyone, they will be kicked immediately.

### `mods`

Aliases: `moderators`, `admins`, `staff`

List the server staff and their statuses.

### `mod` *Privileged*

Aliases: `moderation`, `modsettings`

Displays moderation settings for the server. Also assumes the interface for modifying these settings.

### `mod.actions` *Privileged*

Lists automod actions.

### `mod.log` *Privileged*

Aliases: `modlog`

Get information regarding the moderation log.

### `mod.log.id [channel]` *Privileged*

Aliases: `channel`, `channelid`

Gets or sets the modlog channel ID. The modlog contains information about bans, kicks, and other moderation actions.

### `mod.log.case caseID [notes]` *Privileged*

Aliases: `reason`, `notes`

Get or edit a modlog case.

### `mod.log.revoke caseID` *Privileged*

Aliases: `undo`

Revoke a case from the modlog.

### `mod.log.checkuser userID` *Privileged*

Aliases: `userincidents`, `checkincidents`

Gets a list of incidents pertaining to a user.

### `mod.strikes [user]` *Privileged*

Aliases: `checkstrikes`, `checkx`, `getx`

Get the strike count for a given user.

### `mod.strikes.clear` *Privileged*

Aliases: `pardon`

Pardons all users that have strikes.

### `mod.strikes.actions [action1] [action2] [action3]` *Privileged*

Aliases: `xactions`

Get or set the actions assigned when 1, 2, and 3+ strikes are reached.

### `mod.vulgarity` *Privileged*

Display the current vulgarity level and actions.

### `mod.vulgarity.level [<0|none|1|low|2|medium|3|high>]` *Privileged*

Allow the bot to filter messages containing certain words and phrases that are vulgar, offensive, lewd, racist, etc.

### `mod.vulgarity.actions [...actions]` *Privileged*

Get or apply settings for how the bot responds to vulgar messages.

### `mod.spam` *Privileged*

Display the current spam filters and actions.

### `mod.spam.filters [...<mentions|links|letters|caps|emojis|newlines>]` *Privileged*

Allow the bot the filter spam messages, including all caps, repetitive letters, global mentions, and untrusted links.

### `mod.spam.actions [...actions]` *Privileged*

Get or apply settings for how the bot responds to spam messages.

### `mod.urls` *Privileged*

Aliases: `url`

Display the current URL banlist.

### `mod.urls.clear` *Privileged*

Clears the URL banlist.

### `mod.urls.add ...urls` *Privileged*

Aliases: `ban`

Add URLs to the banlist.

### `mod.urls.remove ...urls` *Privileged*

Aliases: `unban`

Remove URLs from the banlist.

### `mod.names` *Privileged*

Aliases: `usernames`, `bannednames`

Display the current usernam banlist.

### `mod.names.clear` *Privileged*

Clears all banned username filters.

### `mod.names.add` *Privileged*

Aliases: `ban`

Add username filters to the name banlist.

### `mod.names.remove` *Privileged*

Aliases: `unban`

Remove username filters from the name banlist.

## NSFW

### `blacklist` *Privileged*

Aliases: `bl`

Manage the tag blacklist for e621 content. Tags are separated by spaces; tags that *would* have spaces in them, use an underscore `_` instead (e.g. `sonic_(series)`.

### `blacklist.replace [...tags]` *Privileged*

Aliases: `set`

Replace the current blacklist with the given `tags` (no tags given will clear the blacklist)

### `blacklist.add ...tags` *Privileged*

Add `tags` to blacklist when retrieving content from e621.

### `blacklist.remove ...tags` *Privileged*

Remove `tags` from the blacklist.

### `blacklist.getblacklist` *Privileged*

Aliases: `get`

Display the current blacklist.

### `blacklist.clearblacklist` *Privileged*

Aliases: `clear`

Removes all tags in the blacklist.

### `e621 tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `e6`, `porn`, `pr0n`, `yiff`

Search something on e621.net, maximum of 5 tags. (The `order:random` specifier will be automatically added)

### `e621.source hash|imagelink`

Aliases: `src`, `sauce`, `saucepls`, `reverseimagesearch`

When given only the direct link to an image on e621, it can be tough locating the source. This command will help to locate a post with only its hash, usually given in the filename.

### `e621.new tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `newest`, `recent`, `latest`

Search the newest posts on e621.

### `e621.top tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `best`, `bestof`

Search the best posts on e621.

### `e621.old tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `oldest`

Search the oldest posts on e621.

### `e621.bad tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `worst`, `worstof`

Search the *worst* posts on e621. Beware these treacherous waters, because your blacklist won't apply!

### `e926 tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `e9`, `sfwporn`, `sfwpr0n`

Search something on e926.net (the SFW alternative of e621.net), maximum of 5 tags. (The `order:random` specifier will be automatically added)

### `e926.source hash|imagelink`

Aliases: `src`, `sauce`, `saucepls`, `reverseimagesearch`

When given only the direct link to an image on e926, it can be tough locating the source. This command will help to locate a post with only its hash, usually given in the filename.

### `e926.new tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `newest`, `recent`, `latest`

Search the newest posts on e926.

### `e926.top tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `best`, `bestof`

Search the best posts on e926.

### `e926.old tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `oldest`

Search the oldest posts on e926.

### `e926.bad tag1 [tag2] [tag3] [tag4] [tag5]`

Aliases: `worst`, `worstof`

Search the *worst* posts on e926. Beware these treacherous waters, because your blacklist won't apply!

### `fa ...query [...option:value]`

Aliases: `furaffinity`

Search FurAffinity. Options you may set include: `page`, `perpage`, `order_by`, `order_direction`, `range`, `mode`, `rating`, and `type`.

### `fa.user user`

Aliases: `artist`, `creator`, `username`

View information about a user.

### `fa.gallery user [page]`

Aliases: `submissions`

List a user's submissions.

### `fa.scraps user [page]`

List a user's scrapped submissions.

### `fa.favorites user [page]`

Aliases: `faves`

List a user's favorite submissions. (currently only works for the first page)

### `fa.journals user [page]`

List journals by a user.

### `fa.watchers user [page]`

Aliases: `followers`

List users watching a user

### `fa.watching user [page]`

Aliases: `watchlist`, `following`

List users that a user is watching.

### `fa.view id`

Aliases: `submission`, `content`

Display a submission and its stats.

### `fa.read id`

Aliases: `journal`

Display a journal. (broken at the moment)

## Programming

### `ddocs [topic]`

Aliases: `discorddocs`

Too lazy to look for a specific piece of documentation on the Discord API? Search it here and get the relevant stuff instantly.

### `brainfuck [code] [input] -d/-debug -s/-strict`

Run a Brainfuck program. You may type your code in a code block or upload a file to run. https://en.wikipedia.org/wiki/Brainfuck

### `befunge [code] [input] -d/-debug -v/-version`

Run a Befunge program. You may type your code in a code block or upload a file to run. You can specify a version such as 93 or 98. https://en.wikipedia.org/wiki/Befunge

### `malbolge [code] [input] -d/-debug`

Run a Malbolge program. You may type your code in a code block or upload a file to run. https://en.wikipedia.org/wiki/Malbolge

### `whitespace [image] [input] -d/-debug`

Run a Whitespace program (use S for space, T for tab, and L for newline). You may type your code in a code block or upload a file to run. https://en.wikipedia.org/wiki/Whitespace_(programming_language)

### `piet [image] [input] -d/-debug -t/-trace -cs/-codelsize`

Run a Piet program. Since all Piet programs are images, you must upload a file or link one. Optional flags include `-t` for tracing (for simpler programs), and `-cs:value` for codel size. http://www.dangermouse.net/esoteric/piet.html

### `npm package [version]`

Aliases: `npmjs`, `nodejs`, `node`

Get information about a Node.js package.

### `npm.search keywords`

Aliases: `s`

Search packages on the npm registry.

### `npm.install package [version]` *Private*

Aliases: `i`

Install a node package into your default `node_modules` folder.

### `npm.version package` *Private*

Aliases: `v`

Gets the version of a node module.

## Text

### `emoji ...emojiNames`

Aliases: `emojis`, `nitro`, `nitropls`

Use a custom emoji found on any server this bot is in.

### `b ...text`

Aliases: `bemoji`, `🅱`

Adds :b: emojis to your text fam.

### `regional ...text`

Aliases: `reg`, `remoji`

Turns your text into :regional_indicator_a: emojis.

### `clap ...text`

Aliases: `clapemoji`, `clapping`, `preach`

:clap:Can:clap:you:clap:feel:clap:the:clap:memes:clap:tonight?:clap:

### `greentext ...text`

Aliases: `gt`, `tfw`, `mfw`, `mrw`

```css
>Turns your text into greentext
```

### `zalgo ...text`

Aliases: `justfuckmyshitup`, `zuul`

HE COMES

### `unzalgo ...text`

Aliases: `wtfdoesitsay`, `unzuul`

Removes the zalgo corruption from text.

### `caps ...text`

Aliases: `mixedcaps`, `mcaps`, `mock`

SuPer WacKY aND zAnY tExT!1!

### `owo ...text`

Aliases: `uwu`, `hewwo`, `babytalk`

H-hewwo?! 

### `leet ...text`

Aliases: `l33t`, `1337`

Change your text into leetspeak. -> Ch4ng3 y0ur +3x+ !n+0 13375p34k.

### `reverse ...text`

Aliases: `esrever`, `backwards`

Reverses your text.

### `sheriff [emoji]`

Aliases: `howdy`

Creates an Emoji Sheriff meme.

### `nato [from] ...text`

Convert to and from the NATO phonetic alphabet. (See <https://en.wikipedia.org/wiki/NATO_phonetic_alphabet>)

### `base64 [from] ...text`

Aliases: `b64`

Convert to and from Base 64.

### `hash [algorithm] ...text`

Aliases: `crypto`, `DSA`, `DSA-SHA`, `DSA-SHA1`, `DSA-SHA1-old`, `RSA-MD4`, `RSA-MD5`, `RSA-MDC2`, `RSA-RIPEMD160`, `RSA-SHA`, `RSA-SHA1`, `RSA-SHA1-2`, `RSA-SHA224`, `RSA-SHA256`, `RSA-SHA384`, `RSA-SHA512`, `dsaEncryption`, `dsaWithSHA`, `dsaWithSHA1`, `dss1`, `ecdsa-with-SHA1`, `md4`, `md4WithRSAEncryption`, `md5`, `md5WithRSAEncryption`, `mdc2`, `mdc2WithRSA`, `ripemd`, `ripemd160`, `ripemd160WithRSA`, `rmd160`, `sha`, `sha1`, `sha1WithRSAEncryption`, `sha224`, `sha224WithRSAEncryption`, `sha256`, `sha256WithRSAEncryption`, `sha384`, `sha384WithRSAEncryption`, `sha512`, `sha512WithRSAEncryption`, `shaWithRSAEncryption`, `ssl2-md5`, `ssl3-md5`, `ssl3-sha1`, `whirlpool`

Get the specified hash of some text. Specify the algorithm with a command alias or with a parameter, default is `md5`.

### `portmanteau word1|user1 word2|user2`

Aliases: `combine`

Combine two words into a portmanteau.

## Web

### ~~`google query`~~

Enter a basic search query for Google.

### ~~`bing query`~~

Enter a basic search query for Bing.

### ~~`yahoo query`~~

Enter a basic search query for Yahoo.

### ~~`duckduckgo query`~~

Aliases: `ddg`

Enter a basic search query for DuckDuckGo.

### ~~`wikipedia [query]`~~

Aliases: `wiki`

Enter a basic search query for Wikipedia. Or get a random Wikipedia page.

### ~~`youtube query`~~

Aliases: `yt`

Enter a basic search query for YouTube.

### ~~`vimeo query`~~

Enter a basic search query for Vimeo.

### ~~`soundcloud query`~~

Enter a basic search query for SoundCloud.

### ~~`lmgtfy query`~~

Enter a query.

*Documentation generated in 14 milliseconds.*