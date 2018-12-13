const {fetch,truncate} = require('../../Utils');

function escape(x) {
	return x.replace(/\s/g,'_');
}

module.exports = {
	'bulbapedia': {
		aliases: ['pokemonwiki','pkmnwiki','pokewiki'],
		category: 'Web',
		title: 'Bulbapedia',
		info: 'Search for Pokemon articles on Bulbapedia.',
		parameters: ['[topic]'],
		permissions: 'inclusive',
		fn({client, arg}) {
			let page = arg ? escape(arg) : 'Special:Random';
			return fetch('https://bulbapedia.bulbagarden.net/wiki/' + page, {html: true})
			.then($ => {
				let title = $('h1#firstHeading').text();
				let url = 'https://bulbapedia.bulbagarden.net/wiki/' + escape(title);
				let description = truncate($('div#mw-content-text > p').text(), 1000);
				let img = $('a.image[href*="wiki/File:"] > img[alt]').attr('src');
				return { title, description, url, image: (img ? {url: 'https:'+img} : null) };
			})
			.catch(e => e.message || e);
		}
	},
	'minecraft': {
		aliases: ['minecraftwiki','mc','mcwiki'],
		category: 'Web',
		title: 'Minecraft Wiki',
		info: 'Search the Minecraft Wiki.',
		parameters: ['[topic]'],
		permissions: 'inclusive',
		fn({arg}) {
			let page = arg ? escape(arg) : 'Special:RandomRootpage';
			return fetch('https://minecraft.gamepedia.com/' + page, {html: true})
			.then($ => {
				let title = $('meta[property="og:title"]').attr('content');
				let url   = $('meta[property="og:url"]').attr('content');
				let img   = $('meta[property="og:image"]').attr('content');
				let description = truncate($('#bodyContent > #mw-content-text > p').text(), 1000);
				return { title, description, url, image: (img ? {url: img} : null) };
			})
			.catch(e => e.message || e);
		}
	},
	'terraria': {
		aliases: ['terrawiki'],
		category: 'Web',
		title: 'Terraria Wiki',
		info: 'Search the Terraria Wiki.',
		parameters: ['[topic]'],
		permissions: 'inclusive',
		fn({arg}) {
			let page = arg ? escape(arg) : 'Special:Random';
			return fetch('https://terraria.gamepedia.com/' + page, {html: true})
			.then($ => {
				let title = $('meta[property="og:title"]').attr('content');
				let url   = $('meta[property="og:url"]').attr('content');
				let img   = $('meta[property="og:image"]').attr('content');
				let description = truncate($('#bodyContent > #mw-content-text > p').text(), 1000);
				return { title, description, url, image: (img ? {url: img} : null) };
			})
			.catch(e => e.message || e);
		}
	},
	'yugioh': {
		aliases: ['ygo','yugiohwiki','ygowiki','yugipedia'],
		category: 'Web',
		title: 'Yu-Gi-Oh! Wiki',
		info: 'Get info about a Yu-Gi-Oh! card, archetype, character, etc.',
		parameters: ['[topic]'],
		permissions: 'inclusive',
		fn({arg}) {
			let page = arg ? escape(arg) : 'Special:Random';
			return fetch('http://yugioh.wikia.com/wiki/' + page,{html: true})
			.then($ => {
				let isACard = !!$('table.cardtable').length;
				let title = $('meta[property="og:title"]').attr('content');
				let url   = $('meta[property="og:url"]').attr('content');
				let img   = $('meta[property="og:image"]').attr('content');
				let description = !isACard ? truncate($('meta[property="og:description"]').attr('content'), 1000) : null;
				return { title, description, url, image: (img ? {url: img} : null) };
			})
			.catch(e => e.message || e);
		}
	}
};
