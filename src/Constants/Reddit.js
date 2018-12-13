module.exports = {
	URL: 'https://www.reddit.com',
	STATUS_URL: 'https://reddit.statuspage.io/history.rss',
	COLOR: 0xd25a32,
	
	TYPES: ['','hot','new','rising','top','controversial','gilded'], // '' and 'hot' are the same
	TIME: ['hour','day','week','month','year','all'], // applicable to top, controversial, and gilded
	
	Post: {
		GILDED: '<:redditgold:303781934813675520>',
		
		VIDEO_DOMAINS: ['v.redd.it','gfycat.com','youtube.com','youtu.be'],
		VIDEO_FORMATS: ['.gifv','.mp4','.webm'],
		IMAGE_DOMAINS: ['i.redd.it','i.reddituploads.com','imgur.com','i.imgur.com'],
		IMAGE_FORMATS: ['.png','.jpg','.jpeg','.gif']
	},
	Subscription: {
		PER_PAGE: 24,
		TEMPLATE: {
			pollInterval: 60000,
			lastPollTime: (t) => t || Date.now(),
			active: true,
			options: {
				type: 'hot',
				time: 'all',
				limit: 200,
				threshold: 1, // must not be below 1 upvote
				crossposts: false, // keep crossposts from similar subs
				media: {
					text: true,
					image: true,
					video: true,
					other: true
				}
			},
			subs: {}
		}
	}
};
