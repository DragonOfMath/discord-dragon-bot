const puppeteer = (function () {
    try {
        return require('puppeteer');
    } catch (e) {
		console.error(e);
        return null;
    }
});

// https://gist.github.com/aanton/b4c9cedc0dd2437703d86507c69cdffe
async function screenshot(url, dynamicLoading = false) {
    // startup the browser
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        timeout: 1000
    });

    // open a new page
    const page = await browser.newPage();

    // prepare the page for request interception
    await page.setRequestInterceptionEnabled(true);
    page.on('request', request => {
        if (request.resourceType === 'Script' && !dynamicLoading) {
            request.abort();
        } else {
            request.continue();
        }
    });

    // open the URL in the page
    await page.goto(url);

    // screenshot a 1024x800 window of the page
    let ss = await page.screenshot({
        clip: {x: 0, y:0, width: 1024, height: 800},
        fullPage: false
    });

    // close the browser and return the screenshot buffer (PNG)
    await browser.close();
    return ss;
}

module.exports = {
    'screenshot': {
        aliases: ['ss'],
        title: 'Screenshot',
        info: 'Take a screenshot of a website. Use the `-s` or `-scripts` flag to enable dynamic loading.',
        parameters: ['url'],
        flags: ['s|scripts'],
        permissions: 'inclusive',
        enabled: false,
        fn({client, arg, flags}) {
            if (!puppeteer || !puppeteer.launch) throw 'Feature not supported!';
            return screenshot(arg, flags.has('s') || flags.has('scripts'))
            .then(file => {
                return {
                    file,
                    filename: 'screenshot.png'
                };
            });
        }
    }
};
