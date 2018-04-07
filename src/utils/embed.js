class DiscordEmbed {
	constructor(message = '', embed) {
		if (typeof(embed) == 'object' && (typeof (embed.message) === 'string' || typeof (embed.embed) === 'object')) {
			({message, embed} = embed);
		}
		
		this.message = message;
		this.embed   = embed;
	}
	embedThumbnail(url,width,height) {
		this.embed = this.embed || {};
		this.embed.thumbnail = {url,width,height};
		return this;
	}
	embedImage(url,width,height) {
		this.embed = this.embed || {};
		this.embed.image = {url,width,height};
		return this;
	}
	embedVideo(url,width,height) {
		this.embed = this.embed || {};
		this.embed.video = {url,width,height};
		return this;
	}
	embedProvider(name,url) {
		this.embed = this.embed || {};
		this.embed.provider = {name,url};
		return this;
	}
	setAuthor(name,url,icon_url) {
		this.embed = this.embed || {};
		this.embed.author = {name,url,icon_url};
		return this;
	}
	setMessage(x) {
		this.message = x;
		return this;
	}
	setColor(x) {
		this.embed = this.embed || {};
		this.embed.color = Number(x);
		return this;
	}
	setTitle(x) {
		this.embed = this.embed || {};
		this.embed.title = x;
		return this;
	}
	setDescription(x) {
		this.embed = this.embed || {};
		this.embed.description = x;
		return this;
	}
	setFooter(text,icon_url) {
		this.embed = this.embed || {};
		this.embed.footer = {text,icon_url};
		return this;
	}
	setURL(url) {
		this.embed = this.embed || {};
		this.embed.url = url;
		return this;
	}
	addField(name,value,inline) {
		this.embed = this.embed || {};
		this.embed.fields = this.embed.fields || [];
		inline = !!inline;
		this.embed.fields.push({name,value,inline});
		return this;
	}
	/**
		Ensures message + embed are within Discord's size limits
		https://discordapp.com/developers/docs/resources/channel#embed-limits
	*/
	checkPayloadLength() {
		if (typeof(this.message) === 'string' && this.message.length > 2000) {
			throw new Error('Message length exceeds Discord\'s limit: ' + this.message.length);
		}
		
		if (typeof(this.embed) === 'object') {
			let totalLength = 0;
			if (this.embed.title) {
				if (this.embed.title.length > 256) {
					throw new Error('Embed title length exceeds Discord\'s limit: ' + this.embed.title.length);
				} else {
					totalLength += this.embed.title.length;
				}
			}
			if (this.embed.description) {
				if (this.embed.description.length > 2048) {
					throw new Error('Embed description length exceeds Discord\'s limit: ' + this.embed.description.length);
				} else {
					totalLength += this.embed.description.length;
				}
			}
			if (this.embed.fields) {
				if (this.embed.fields.length > 25) {
					throw new Error('Number of embed fields exceeds Discord\'s limit: ' + this.embed.fields.length);
				} else {
					for (let f of this.embed.fields) {
						if (typeof(f.name) !== 'string') {
							f.name = String(f.name);
						}
						if (f.name.length > 256) {
							throw new Error('Embed field name length exceeds Discord\'s limit: ' + f.name.length);
						} else {
							totalLength += f.name.length;
						}
						if (typeof(f.value) !== 'string') {
							f.value = String(f.value);
						}
						if (f.value.length > 1024) {
							throw new Error('Embed field value length exceeds Discord\'s limit: ' + f.value.length);
						} else {
							totalLength += f.value.length;
						}
					}
				}
			}
			if (this.embed.footer && this.embed.footer.text) {
				if (this.embed.footer.text.length > 2048) {
					throw new Error('Embed footer text length exceeds Discord\'s limit: ' + this.embed.footer.text.length);
				} else {
					totalLength += this.embed.footer.text.length;
				}
			}
			if (this.embed.author && this.embed.author.name) {
				if (this.embed.author.name.length > 256) {
					throw new Error('Embed author name length exceeds Discord\'s limit: ' + this.embed.author.name.length);
				} else {
					totalLength += this.embed.author.name.length;
				}
			}
			
			if (totalLength > 6000) {
				throw new Error('Total embed text length exceeds Discord\'s limit: ' + totalLength);
			}
		}
		
		return true;
	}
	toString() {
		var str = this.message + '\n';
		if (this.embed) {
			if (this.embed.title) {
				str += '**' + this.embed.title + '**\n';
			}
			if (this.embed.url) {
				str += this.embed.url + '\n';
			}
			if (this.embed.description) {
				str += this.embed.description + '\n';
			}
			if (this.embed.fields) {
				for (var field of this.embed.fields) {
					str += '**' + field.name + '**\n' + field.value + '\n';
				}
			}
			if (this.embed.footer) {
				str += this.embed.footer.text + '\n';
			}
			if (this.embed.image && this.embed.image.url != this.embed.url) {
				str += this.embed.image.url + '\n';
			}
			if (this.embed.video && this.embed.video.url != this.embed.url) {
				str += this.embed.video.url;
			}
		}
		return str.trim();
	}
}

module.exports = {DiscordEmbed};
