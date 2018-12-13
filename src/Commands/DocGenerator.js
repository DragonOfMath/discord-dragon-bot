const FilePromise = require('../Structures/FilePromise');
const {Array,Markdown:md,Format:fmt} = require('../Utils');

class DocGenerator {
	constructor(outputPath) {
		this.path = FilePromise.resolve(outputPath);
	}
	generate(client, format = 'md') {
		switch (format.toLowerCase()) {
			case 'markdown':
			case 'md':
				return this.generateMarkdown(client);
			case 'html':
			case 'webdoc':
			case 'markup':
				return this.generateHTML(client);
			default:
				return this.generateText(client);
		}
	}
	generateText(client) {
		let docGenStart = Date.now();
		
		let topCommands = client.commands.toArray();
		let allCommands = client.commands.get().filter(cmd => !cmd.generated);
		let categories  = client.commands.categories.sort();
		let commandsByCategory = Array.groupBy(allCommands, 'category');
		
		let docs = 
`${client.username} Commands

There are ${allCommands.length} commands in ${categories.length} categories.\n\n
		
Categories:
`;
		docs += md.list(categories.map(cat => cat + ` (${commandsByCategory[cat].length})`));
		
		docs += '\n';
		
		for (let cat of categories) {
			docs += `\n${cat}:\n\n`;
			docs += commandsByCategory[cat].map(command => command.toText()).join('\n');
		}
		
		let docGenEnd = Date.now();
		
		let footer = `Documentation generated in ${fmt.time(docGenEnd-docGenStart)}.`;
		docs += '\n' + footer;
		
		return FilePromise.create(this.path + '.txt', docs).then(() => footer);
	}
	generateMarkdown(client) {
		let docGenStart = Date.now();
		
		let topCommands = client.commands.toArray();
		let allCommands = client.commands.get().filter(cmd => !cmd.generated);
		let categories  = client.commands.categories.sort();
		let commandsByCategory = Array.groupBy(allCommands, 'category');
		
		let docs = `# ${client.username} Commands\n`;
		docs += `There are ${md.bold(allCommands.length)} commands in ${md.bold(categories.length)} categories.\n\n`;
		
		docs += `## Catgories\n`;
		docs += md.list(categories.map(cat => md.link(cat, `#${cat.toLowerCase()}`) + ` (${commandsByCategory[cat].length})`));
		
		for (let cat of categories) {
			docs += `\n## ${cat}\n\n`;
			docs += commandsByCategory[cat].map(command => command.toMarkdown()).join('\n');
		}
		
		let docGenEnd = Date.now();
		
		let footer = `Documentation generated in ${fmt.time(docGenEnd-docGenStart)}.`;
		docs += '\n' + md.italics(footer);
		
		return FilePromise.create(this.path + '.md', docs).then(() => footer);
	}
	generateHTML(client) {
		let docGenStart = Date.now();
		
		let topCommands = client.commands.toArray();
		let allCommands = client.commands.get().filter(cmd => !cmd.generated);
		let categories  = client.commands.categories.sort();
		let commandsByCategory = Array.groupBy(allCommands, 'category');
		
		let docs = 
`<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Content-Type" charset="utf-8"/>
	<title>${client.username} Commands</title>
	<style></style>
</head>
<body>
<div class="index">
<h1>${client.username} Commands</h1>
<p>There are <b>${allCommands.length}</b> commands in <b>${categories.length}</b> categories.</p>`;

		docs += `\n<h2>Categories</h2>\n<ul id="categories">\n`;
		docs += categories.map(cat => `<li><a href="#${cat}">${cat}</a> <span>(${commandsByCategory[cat].length})</span></li>`).join('\n');
		docs += `\n</ul>\n</div>`;
		
		docs += `<div id="commands">`;
		for (let cat of categories) {
			docs += `\n<div class="category" id="${cat}">\n<h2>${cat}</h2>\n`;
			docs += commandsByCategory[cat].map(command => command.toHTML()).join('\n');
			docs += `\n</div>`;
		}
		docs += `\n</div>`;
		
		let docGenEnd = Date.now();
		
		let footer = `Documentation generated in ${fmt.time(docGenEnd-docGenStart)}.`;
		docs += '\n<footer>\n'+footer+'\n</footer>';
		docs += '\n</body>\n</html>\n';
		
		return FilePromise.create(this.path + '.html', docs).then(() => footer);
	}
}

module.exports = DocGenerator;
