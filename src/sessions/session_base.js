/**
	Base structure for a session object
	
	A Session is like a miniature command handler.
	It has a resolver function which detects which event to use,
	using the message string, user ID, channelID, and time as
	factors.
	
	Some events, like close(), are already built in.
*/

// explanation of properties
const session = {
	// ID of the session must be unique.
	id: 'session',
	
	// A title to use for session event messages, like how command titles work
	title: 'Session',
	
	// A message to display when the session is in progress and requires valid input
	info: 'A session is in progress.',
	
	// Settings affect control of the session.
	// If left out, the session never expires.
	settings: {
		expires: null,  // how much time the session lasts; null or negative to never end
		reset:   false, // reset expiration time when an event resolves
		max:     -1,    // number of resolved uses before the session closes
		cancel:  -1,    // number of unresolved uses before the session closes
		silent:  true   // if the session closes or a message doesn't resolve, suppress warning messages
	},
	
	// Data for this session that remains until the session is closed or the bot stops
	data: {
		'...': {}
	},
	
	// See Permissions.js
	permissions: {
		type: 'inclusive'
	},
	
	// function which resolves to an event if the input is valid
	resolver({client, message, userID, channelID}) {
		if (message.toLowerCase() == 'attack') {
			return 'attack';
		}
	}
	
	// event handlers
	// default events include: open, close, restart, suspend
	events: {
		attack({client, message, userID, channelID}) {
			const md = client.utils.md;
			return md.mention(userID) + ' attacks!';
		}
	}
};

// copyable template
const session_template = {
	id: '',
	title: '',
	info: '',
	settings: {
		expires: null,
		reset:   false,
		max:     -1,
		cancel:  -1,
		silent: true
	},
	data: {
		
	},
	permissions: {
		type: 'public'
	},
	resolver({client, message, userID, channelID}) {
		
	},
	events: {
		
	}
};