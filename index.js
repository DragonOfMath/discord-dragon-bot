try {
	const Client = require('./src/Client/DragonClient');
	const bot = new Client(require('./init.json'));
	bot.commands.load('src/_Commands');
	bot.sessions.load('src/_Commands');
	bot.database.load('database');
	bot.connect();
} catch (e) {
	if (e instanceof SyntaxError || e instanceof ReferenceError) {
		console.error(e);
		const [,seFile,lineNum] = e.stack.match(/(C:[\\\/\-_.\w\d ]+):(\d+)/);
		console.log('Opening file', seFile, 'at line', lineNum);
		require('child_process').exec(`"C:/Program Files (x86)/Notepad++/notepad++.exe" "${seFile}" -n${lineNum}`);
		debugger;
	} else {
		console.error(e);
	}
}
