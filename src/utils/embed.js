class DiscordEmbed {
	constructor() {
		this.message = "";
		this.embed = {
			color: 0x006fff,
			title: "",
			description: "",
			fields: []
		};
	}
	embedThumbnail(url,width,height) {
		this.embed.thumbnail = {url,width,height};
		return this;
	}
	embedImage(url,width,height) {
		this.embed.image = {url,width,height};
		return this;
	}
	embedVideo(url,width,height) {
		this.embed.video = {url,width,height};
		return this;
	}
	embedProvider(name,url) {
		this.embed.provider = {name,url};
		return this;
	}
	setAuthor(name,url,icon_url) {
		this.embed.author = {name,url,icon_url};
		return this;
	}
	setMessage(x) {
		this.message = x;
		return this;
	}
	setColor(x) {
		this.embed.color = Number(x);
		return this;
	}
	setTitle(x) {
		this.embed.title = x;
		return this;
	}
	setDescription(x) {
		this.embed.description = x;
		return this;
	}
	setFooter(text,icon_url) {
		this.embed.footer = {text,icon_url};
		return this;
	}
	setURL(url) {
		this.embed.url = url;
		return this;
	}
	addField(name,value,inline) {
		inline = !!inline;
		this.embed.fields.push({name,value,inline});
		return this;
	}
}

module.exports = {DiscordEmbed};
