const e621 = require('./e621');
const {Markdown:md} = require('../../Utils');

module.exports = {
	id: 'e621-assist',
	data: {
		id: '',
		hash: ''
	},
	permissions: {
		type: 'public'
	},
	resolver({message}) {
		try {
			this.data.id   = message.match(e621.postRegex);
			if (this.data.id) {
				this.data.id = this.data.id[1];
			}
			
			this.data.hash = message.match(e621.directRegex);
			if (this.data.hash) {
				this.data.hash = this.data.hash[1];
			}
			
			if (this.data.id && !this.data.hash) {
				return 'getPostFromID';
			}
			if (this.data.hash && !this.data.id) {
				return 'getPostFromHash';
			}
		} catch (e) {}
	},
	events: {
		getPostFromID({client, userID}) {
			return e621.search([`id:${this.data.id}`])
			.then(response => {
				if (response.length == 0) {
					throw `Invalid post ID: ${this.data.id}`;
				} else {
					return response[0];
				}
			})
			.then(post => e621.embed(post, 'Post Assist'))
			.then(embed => {
				return {
					message: md.mention(userID) + ' here\'s more info about that post',
					embed
				};
			}).catch(console.error);
		},
		getPostFromHash({client, userID}) {
			return e621.reverseSearch(this.data.hash)
			.then(embed => {
				return {
					message: md.mention(userID) + ' here\'s the source for that image',
					embed
				};
			})
			.catch(console.error);
		}
	}
};




