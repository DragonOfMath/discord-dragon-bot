# To-Do List

## Add
 * Dragon Pet Simulator
 * Pokemon battles
 * `weather` command, need to setup an API key and actually figure out how to use the API
 * `autoresponse` command, replaces many of the meme session thingies
 * `google`, `youtube`, `yahoo`, `bing`, `duckduckgo`, `wikipedia`, etc.
 * Google Translate
 * GIF features
	* `reverse`
	* `shake`
	* `triggered`
	* gif `magik`
	* `broken` / `corrupt`
 * Text rotation support
 * More meme templates?
 * Anime search?
 * `roast`, `insult`, `shakespeare`?
 * Logic/Boolean/Math metacommands?
 * Last time user was online
 * `music.volume`, `music.speed` still need to be implemented
 * user analytics
 * Some kind of MessageGame subclass that uses DMs for hidden game data (Synced/Managed/Linked/Distributed)
	 * UNO
	 * Mahjong
	 * Poker
	 * CAH Multiplayer
 * Chess?
 * Checkers?
 * Command export
 * A way to pin messages past the 50 pin limit (R. Danny's starboard feature?)
 * voice recording
 * BBCode parser
 * Session config
 
## Change
 * Modularize normalization
 * Possibly redo current request code in favor of a "bucket" for safer message sending?
 * Use a better database to handle large scale reads/writes (SQLite?)
 * Resolve unique subcommands
 * Make F-List character embed less verbose
 
## Fix
 * `ping` pings a web address, but the data returned is unexpected?
 * Music player not skipping or pausing at all
 * `image.magik` is only a homemade prototype, it's slow and broken
 * `info.token` - Timestamp conversion is incorrect
 * MessageGame timeout not working
 * Auto-solver for Sudoku
 * Reddit video embedding: find possible workaround?
 * gif rendering/optimization
 * `textbox` rendering for large buttons
 
## Remove
