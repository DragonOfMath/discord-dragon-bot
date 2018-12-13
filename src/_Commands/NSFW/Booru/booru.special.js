const booru = {
	e621: require('./e621'),
	e926: require('./e926')
};

const {Markdown:md} = require('../../../Utils');

const POST_REGEX = /(e621|e926)\.net\/post\/show\/(\d+)/;
const POOL_REGEX = /(e621|e926)\.net\/pool\/show\/(\d+)/;
const DIRECT_REGEX = /(e621|e926).net\/.*\/([0-9a-f]{32})/;

module.exports = {
	id: 'booru-source-helper',
	data: {
		host: '',
		id: '',
		hash: ''
	},
	permissions: 'public',
	resolver({message}) {
		try {
			this.data.host = '';
			this.data.id   = '';
			this.data.hash = '';
			
			this.data.id = message.match(POST_REGEX);
			if (this.data.id) {
				this.data.host = this.data.id[1];
				this.data.id   = this.data.id[2];
			}
			
			this.data.hash = message.match(DIRECT_REGEX);
			if (this.data.hash) {
				this.data.host = this.data.hash[1];
				this.data.hash = this.data.hash[2];
			}
			
			if (this.data.id && !this.data.hash) {
				return 'getPostFromID';
			}
			if (this.data.hash && !this.data.id) {
				return 'getPostFromHash';
			}
			
			this.data.id = message.match(POOL_REGEX);
			if (this.data.id) {
				this.data.host = this.data.id[1];
				this.data.id   = this.data.id[2];
				return 'getPoolInfo';
			}
		} catch (e) {}
	},
	events: {
		getPostFromID({client, userID}) {
			return booru[this.data.host].getPost(this.data.id)
			.then(post => {
				return {
					message: md.mention(userID) + ' here\'s more info about that post',
					embed: post.embed('Post Assist')
				};
			});
		},
		getPostFromHash({client, userID}) {
			return booru[this.data.host].reverseSearch(this.data.hash)
			.then(post => {
				return {
					message: md.mention(userID) + ' here\'s the source for that image',
					embed: post.embed('Reverse Search')
				};
			});
		},
		getPoolInfo({client, userID}) {
			return booru[this.data.host].getPool(this.data.id)
			.then(pool => {
				return {
					message: md.mention(userID) + ' here\'s more info about that pool',
					embed: pool.embed()
				};
			});
		}
	}
};

