const path = require('path');
const puppeteer = require('puppeteer');

async function scratchblocks(sb, v = '2') {
	var style = 'scratch3';
	switch (v) {
		case 'sb3':
		case 'scratch3':
		case 'scratchblocks3':
			style = 'scratch3';
			break;
		case 'sb2':
		case 'scratch2':
		case 'scratchblocks2':
			style = 'scratch2';
			break;
		case 'sb':
		case 'scratch':
		case 'scratchblocks':
			style = 'scratch2';
			break;
	}
	
	// open the scratchblocks tool
	const browser = await puppeteer.launch({
        headless: true,
        timeout: 10000
    });

    // open a new page
    const page = await browser.newPage();
	
	const url = 'file://' + path.resolve(process.cwd(), '../scratchblocks-png/scratchblocks.html');
	const response = await page.goto(url);
	
	var result;
	if (response.ok()) {
		var window = await page.evaluateHandle(() => window)
		//await page.evaluate(() => window.scratchblocks.)
		var data = await page.evaluate(x => window.parseAndExportPNG(x), sb)
		result = (function (dataURL) {
			var [,type,inBase64,data] = dataURL.match(/^(?:data:)?(image\/(?:png|jpe?g|gif))?;?(base64)?,?(.+)$/)
			return Buffer.from(data, inBase64)
		})(data)
	} else {
		result = response.statusText();
	}
	await browser.close();
	return result;
}

module.exports = {
	'sb': {
		aliases: ['scratch', 'scratchblocks'],
		categories: 'Programming',
		title: 'Scratchblocks',
		info: 'Render text as scratchblocks (as seen at <http://scratchblocks.github.io>). Version 2.0 supported only.',
		parameters: ['...blocks'],
		flags: ['v|version'],
		permissions: 'private',
		suppress: true,
		analytics: false,
		fn({client, arg, flags}) {
			return scratchblocks(arg, flags.get('v') || flags.get('version'))
			.then(buffer => {
				if (buffer && buffer instanceof Buffer) {
					return {
						file: buffer, 
						filename: 'scratchblocks.png'
					};
				} else {
					throw buffer;
				}
			});
		}
	}
};
