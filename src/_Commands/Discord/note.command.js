const {Markdown:md} = require('../../Utils');

module.exports = {
	'note': {
		title: 'Note',
		info: 'Get/set a user\'s note.',
		parameters: ['userID', '[...text]'],
		permissions: 'private',
		fn({client, args}) {
			let userID = md.userID(args[0]) || args[0];
			if (args.length > 1) {
				let note = args.slice(1).join(' ');
				return client.editNote({userID,note})
				.then(() => 'Saved note for ' + userID);
			} else {
				return client.getNote(userID)
				.then(note => {
					console.log(note);
					return note.note || note;
				});
			}
		}
	}
};
