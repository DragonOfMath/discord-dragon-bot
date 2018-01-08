const DragonBot = require('./src/DragonBot');

(function (bot) {
	bot.commands.load(__dirname + '/src/commands');
	bot.sessions.load(__dirname + '/src/sessions');
	bot.database.load(__dirname + '/database');
	bot.connect();
} (new DragonBot(require('./init.json'))));
