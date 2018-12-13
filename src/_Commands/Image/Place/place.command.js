const Place = require('./Place');
const {Markdown:md,Format:fmt} = require('../../../Utils');

const COLORS = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'black'];

module.exports = {
	'place': {
		aliases: ['rplace','canvas'],
		category: 'Image',
		title: 'Place',
		info: `A public canvas, where any user can paint pixels:
	* You may only choose one of these colors: ${COLORS.join(', ')}.
	* The canvas dimensions are ${Place.SIZE}x${Place.SIZE}. X starts at the left, and Y starts at the top.
	* You may place one pixel every ${fmt.time(Place.COOLDOWN)}.`,
		parameters: ['[color]','[xpos]','[ypos]'],
		permissions: 'inclusive',
		fn({client, userID, channelID, args}) {
			let userTable = client.database.get('users');
			return Place.load()
			.then(place => {
				if (args.length) {
					if (!COLORS.includes(args[0].toLowerCase())) {
						throw 'Invalid color: ' + args[0];
					}
					if (args.length < 3) {
						throw 'You must provide a color, x position, and y position.';
					}
					
					// check last placement time
					userTable.modify(userID, userData => {
						userData.place = userData.place || 0;
						let timeElapsed = Date.now() - userData.place;
						let timeRemaining = Place.COOLDOWN - timeElapsed;
						if (timeRemaining > 0) {
							throw 'You must wait ' + md.bold(fmt.time(timeRemaining)) + ' before placing a pixel.';
						}
						userData.place = Date.now();
						return userData;
					}).save();
					
					// update pixel
					place.set.apply(place, args);
					place.save();
				}
				return place.get();
			});
		},
		subcommands: {
			'reset': {
				aliases: ['clear'],
				title: 'Place | Reset',
				info: 'Reset the canvas to a blank slate.',
				parameters: ['[size]'],
				permissions: 'private',
				fn({client, args}) {
					return Place.load()
					.then(place => place.reset(args[0]).save())
					.then(() => 'The public canvas has been reset.');
				}
			}
		}
	}
};
