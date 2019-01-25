module.exports = {
	FILE_REGEX: /^[^\.]+\.special\.js$/,
	POLL_TIME: 1000,
	TEMPLATE: {
		id: '',
		category: '',
		title: '',
		info: '',
		enabled: true,
		settings: {
			expires: 0,     // how much time the session lasts
			reset:   false, // reset expiration time when an event fires
			max:     -1,    // max number of uses before the session closes
			cancel:  -1,    // max number of misses before the session closes
			silent:  true   // if a miss occurs, an error should not be displayed
		},
		data: {},
		permissions: {},
		resolver: null,
		events: {},
		manager: null,
		started: () => Date.now(),
		uses: 0,
		misses: 0,
		last_channel_id: ''
	}
};
