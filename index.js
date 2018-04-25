const DragonBot = require('./src/DragonBot');

(function (bot) {
	bot.commands.load('src/commands');
	bot.sessions.load('src/commands');
	bot.database.load('database');
	bot.connect();
} (new DragonBot(require('./init.json'))));
