module.exports = {
	id: 'owo-whats-this',
	permissions: 'public',
	resolver({message}) {
		if (/what'?s this.?$/gi.test(message)) return 'OwO';
	},
	events: {
		OwO() {
			return [
				'OwO what\'s this?',
				'H-hewwo uwu',
				'https://i.imgur.com/BQF2obV.jpg',
				'https://i.imgur.com/IMEQszs.jpg',
				'https://i.imgur.com/BLl3XbK.jpg',
				'https://i.imgur.com/dZbtTFk.jpg',
				'https://i.imgur.com/Iybh3I8.jpg',
				'https://i.imgur.com/UTTOnyM.jpg',
				'https://i.imgur.com/2nuYAn8.jpg',
				'https://i.imgur.com/36te7u9.jpg',
				'https://i.imgur.com/quKWPrI.jpg', // from https://imgur.com/a/3jehv
				'https://i.imgur.com/GDq8pWE.png', // https://imgur.com/a/3jehv
				'https://i.imgur.com/tsgGtP8.jpg', // https://imgur.com/a/3jehv
				'https://imgur.com/YE5EQyb'        // https://imgur.com/a/3jehv
			]
		}
	}
};

