const parse5 = require('parse5');
const {fetch,random} = require('../../Utils');

const ChanBoards = ['a','c','w','m','cgl','cm','f','n','jp','v','vg','vp','vr','co','g','tv','k','o','an','tg','sp','asp','sci','his','int','out','toy','i','po','p','ck','ic','wg','lit','mu','fa','3','gd','diy','wsg','qst','biz','trv','fit','x','adv','lgbt','mlp','news','wsr','vip','b','r9k','pol','bant','soc','s4s','s','hc','hm','h','e','u','d','y','t','hr','gif','aco','r'];

function parse(contents) {
	// create a root node for the post
	let postRoot = parse5.parseFragment('<div></div>');
	
	// create node fragments as children of the root
	let postContents = parse5.parseFragment(postRoot, contents);
	
	// serialize contents by separating <p> and <br> nodes by newlines
	function serialize(node) {
		let text = '';
		for (let child of node.childNodes) {
			if (child.value) { // is a text node
				text += child.value;
			} else {
				text += serialize(child);
			}
		}
		if (node.tagName == 'p' || node.tagName == 'br') {
			text += '\n';
		} else {
			text += ' ';
		}
		return text;
	}
	
	return serialize(postContents);
}

module.exports = class Chan {
	static get boards() {
		return ChanBoards;
	}
	static _4chan(board = random(ChanBoards)) {
		board = board.replace(/\//g,'');
		let op;
		return fetch(`http://api.4chan.org/${board}/1.json`)
		.then(({threads}) => random(threads))
		.then(({posts}) => {
			op = posts[0];
			return random(posts.filter(p => !!p.com));
		})
		.then(post => {
			let embed = {
				color: 0xfed6af,
				title: `4chan - /${board}/ | ${op.semantic_url||'Untitled'} | ${post.name} - #${post.no}`,
				description: parse(post.com).trim(),
				footer: {
					text: post.now
				},
				url: `http://boards.4chan.org/${board}/thread/${op.no}/#p${post.no}`
			};
			if (post.filename && ['.gif', '.png', '.jpg'].indexOf(post.ext) > -1) {
				embed.thumbnail = {
					url: `http://i.4cdn.org/${board}/${post.tim}${post.ext}`,
					width: post.tn_w,
					height: post.tn_h
				};
			}
			return embed;
		});
	}
	static _8chan(board = random(ChanBoards)) {
		board = board.replace(/\//g,'');
		let op;
		return fetch(`https://8ch.net/${board}/0.json`)
		.then(({threads}) => random(threads))
		.then(({posts}) => {
			op = posts[0];
			return random(posts);
		})
		.then(post => {
			let embed = {
				color: 0xd3d7ef,
				title: `8chan - /${board}/ | ${op.sub||'Untitled'} | ${post.name} - #${post.no}`,
				description: parse(post.com).trim(),
				footer: {
					text: post.now
				},
				url: `https://8ch.net/${board}/res/${op.no}.html#${post.no}`
			};
			if (post.filename && ['.gif', '.png', '.jpg'].indexOf(post.ext) > -1) {
				embed.thumbnail = {
					url: `https://media.8ch.net/file_store/${post.tim}${post.ext}`, // https://media.8ch.net/${board}/src/${post.tim}${post.ext}
					width: post.tn_w,
					height: post.tn_h
				};
			}
			if (post.embed) {
				try {
					embed.video = {
						url: post.embed.match(/"https:\/\/www\.youtube\.com\/\?watch=(.+)"/)[1],
						width: 240,
						height: 180
					};
				} catch (e) {
					embed.description += '\n**Contains embedded media that can\'t be displayed. Click the title link to view.**';
				}
			}
			return embed;
		});
	}
}