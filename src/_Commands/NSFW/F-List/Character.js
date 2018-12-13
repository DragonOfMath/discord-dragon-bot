const Kink = require('./Kink');
const {BBCode,truncate} = require('../../../Utils');

class Character {
	constructor(data) {
		Object.assign(this, data);
		this.created = new Date(this.created_at * 1000);
		this.updated = new Date(this.updated_at * 1000);
		//console.log(this);
	}
	embed(flist) {
		let embed = {
			title: 'Character: ' + this.name,
			description: truncate(BBCode.parse(this.description).toMarkdown(), 500),
			fields: [],
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
		let kinks = flist.mapKinks(this.kinks);
		let kinksByType = {fave:[],yes:[],maybe:[],no:[]};
		let customKinkField = {
			name: 'Custom Kinks',
			value: ''
		};
		for (let id in kinks) {
			let type = this.kinks[id];
			kinksByType[type].push(kinks[id].name);
		}
		for (let id in this.custom_kinks) {
			let kink = this.custom_kinks[id];
			let type = kink.choice;
			kinksByType[type].push(kink.name);
			customKinkField.value += `__${kink.name}__: ${kink.description}\n`;
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
