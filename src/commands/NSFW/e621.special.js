const e621 = require('./e621');
const {Markdown:md} = require('../../Utils');

const POST_REGEX = /https?:\/\/e621\.net\/post\/show\/(\d+)/;
const POOL_REGEX = /https?:\/\/e621\.net\/pool\/show\/(\d+)/;
const DIRECT_REGEX = /e621.net\/.*\/([0-9a-f]{32})/;

module.exports = {
	id: 'e621',
	data: {
		id: '',
		hash: ''
	},
	permissions: 'public',
	resolver({message}) {
		try {
			this.data.id = message.match(POST_REGEX);
			if (this.data.id) {
				this.data.id = this.data.id[1];
			}
			
			this.data.hash = message.match(DIRECT_REGEX);
			if (this.data.hash) {
				this.data.hash = this.data.hash[1];
			}
			
			if (this.data.id && !this.data.hash) {
				return 'getPostFromID';
			}
			if (this.data.hash && !this.data.id) {
				return 'getPostFromHash';
			}
			
			this.data.id = message.match(POOL_REGEX);
			if (this.data.id) {
				this.data.id = this.data.id[1];
				return 'getPoolInfo';
			}
		} catch (e) {}
	},
	events: {
		getPostFromID({client, userID}) {
			return e621.get(this.data.id)
			.then(post => e621.embedPost(post, 'Post Assist'))
			.then(embed => {
				return {
					message: md.mention(userID) + ' here\'s more info about that post',
					embed
				};
			});
		},
		getPostFromHash({client, userID}) {
			return e621.reverseSearch(this.data.hash)
			.then(post => e621.embedPost(post, 'Reverse Search'))
			.then(embed => {
				return {
					message: md.mention(userID) + ' here\'s the source for that image',
					embed
				};
			});
		},
		getPoolInfo({client, userID}) {
			return e621.getPool(this.data.id)
			.then(e621.embedPool)
			.then(embed => {
				return {
					message: md.mention(userID) + ' here\'s more info about that pool',
					embed
				};
			});
		}
	}
};




