const Kink = require('./Kink');
const FListError = require('./FListError');
const {BBCode,truncate} = require('../../../Utils');

class Character {
	constructor(data) {
		if (data.error) throw data.error;
		Object.assign(this, data);
		this.created = new Date(this.created_at * 1000);
		this.updated = new Date(this.updated_at * 1000);
	}
	get url() {
		return 'https://www.f-list.net/c/' + this.name;
	}
	embed(flist) {
		let bbc = BBCode.parse(this.description);
		let embed = {
			title: 'Character: ' + this.name,
			description: truncate(bbc.toMarkdown(), 500),
			fields: [],
			url: this.url,
			timestamp: this.updated
		};
		if (this.images.length) {
			let image = this.images[0];
			embed.image = {
				url: `https://static.f-list.net/images/charimage/${image.image_id}.${image.extension}`,
				width: image.width,
				height: image.height
			};
		}
		
		let kinksByType = {fave:[],yes:[],maybe:[],no:[],custom:[]};
		let customKinkField = {
			name: 'Custom Kinks',
			value: ''
		};
		
		if (this.kinks instanceof Array) {
			// Why the fuck is this an array?!
			//console.log(this);
		} else {
			let kinks = flist.mapKinks(this.kinks);
			for (let id in this.kinks) {
				let type = this.kinks[id];
				if (type in kinksByType) {
					kinksByType[type].push(kinks[id].name);
				} else {
					console.log('invalid kink:',id,type);
				}
			}
		}
		
		if (this.custom_kinks instanceof Array) {
			// Why the fuck is this an array?!
			//console.log(this);
		} else {
			for (let id in this.custom_kinks) {
				let kink = this.custom_kinks[id];
				let type = kink.choice;
				if (type in kinksByType) {
					kinksByType[type].push(kink.name);
					customKinkField.value += `__${kink.name}__: ${kink.description}\n`;
				} else {
					console.log('invalid kink:',kink);
					continue;
				}
			}
		}
		
		for (let choice of ['Fave','Yes','Maybe','No']) {
			embed.fields.push({
				name: choice,
				value: truncate(kinksByType[choice.toLowerCase()].join(', '), 500)
			});
		}
		if (customKinkField.value) {
			customKinkField.value = truncate(customKinkField.value, 1000);
			embed.fields.push(customKinkField);
		}
		
		return embed;
	}
}

module.exports = Character;
