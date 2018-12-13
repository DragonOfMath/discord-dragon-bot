const DragonBot = require('./src/Client/DragonClient');

(function (bot) {
	bot.commands.load('src/_Commands');
	bot.sessions.load('src/_Commands');
	bot.database.load('database');
	bot.connect();
} (new DragonBot(require('./init.json'))));
