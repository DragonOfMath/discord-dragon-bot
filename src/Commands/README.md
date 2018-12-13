# Commands
As of November 2018, DragonBot holds more than 500 commands, over 150 which are top-level. Its command flexibility has improved tremendously over time, with awesome features added every major update.

## Basic Usage `!`
To invoke a command, add my prefix `🐉` / `:dragon:` (or a custom per-server prefix) at the start of your message. There can be space between the prefix and the command.

In case other bots on the server use the same prefix, you can @mention me before your command.

Example: `🐉 daily` uses the daily command to add credits to your bank account.

## Subcommands `.`
Commands have further divisions in their functionality as subcommands, which helps group related commands according to namespaces. To invoke a subcommand, you use dot notation for the command path: `command.subcommand`.

The built-in subcommand `?` lists all subcommands of a command.

Example: `🐉 fish.inventory` invokes the `inventory` subcommand of `fish`.

## Arguments `a`
To append arguments for a command, you type them out separated by spaces. For arguments that require several words, you should use quotation marks.

Example: `🐉 pkmn.rename 5 "Bob The Builder"` changes the name of your pokemon whose ID is 5 to "Bob The Builder".

## Expressions `%`
Besides basic text, command arguments can be evaluated prior to running the command. An expression starts with `%`, then it can be evaluated based on the following symbols:
 * `(...)` evaluates a raw expression which can include math, string concatenation, etc.
 * `[...]` evaluates to an array of elements. The elements must be formatted correctly for it to convert from JSON to an object.
 * `{...}` evaluates to an object of keys/values. The elements must be formatted correctly for it to convert from JSON to an object.
 * `/.../` evaluates to a regular expression. There can be flags after the closing slash.

Example: `🐉 math.sqrt %(25 * 25)` displays `25` as the square root of `625`.

## Flags `-`
As of 1.8, new types of arguments called flags can control command execution in more ways. Unlike regular arguments, flags can be in any order and do not take up room in the argument array, so that resolving the order and types of arguments is made so much easier. Furthermore, flags can hold values.

Flag syntax is as follows: `-name[:value]` where the value part is optional.

Example: `🐉 cleanup 100 -bots` removes all bot messages within the first 100 messages of the channel.

## Metacommands `{}`
Introduced in 1.6.0, metacommands allow running other commands under special conditions. Special commands use argument blocks, denoted by `{` and `}`, which treat their inner text as a runnable under the same context, thus allowing one to run commands in new ways. The prefix isn't needed inside argument blocks, and several commands may be chained one after another with `;`.

Some metacommands:
 * batch
 * repeat
 * wait

Example: `🐉 repeat 10 {say "hi"}` displays `hi` in 10 subsequent messages.

## Categories `&`
Commands are automatically grouped by the category they are assigned. If none is assigned, they are considered "Misc" commands. These do not serve a functional purpose besides organizing commands to make listing them simpler.

Some built-in categories:
 * Admin
 * Moderation
 * Fun
 * NSFW
 * Discord
 * Misc

## Symbols `$`
Your input isn't limited to what you can type: you can use symbols to insert values, such as the current date, the client's ID, or having to escape certain reserved characters. To use a symbol, put a `$` before the name of it, which is case-insensitive.

Some built-in symbols:
 * user
 * channel
 * server
 * time
 * date
 * avatar
 * icon

## Selectors `*`
You can list commands rather than run one, via selectors. The wildcard selector is `*` and the category selector is `&`.

List all commands: `🐉 *` (this literally displays every command in existence)

List all subcommands of a command: `🐉 meme.*`

List all commands of a category: `🐉 &fun`

There are few cases for using this besides finding new commands. However, this feature is versatile for analytics and permissions.

Example: `🐉 analytics &discord &admin` displays the server's analytical table for all "Discord" and "Admin" related commands.
