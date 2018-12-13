class BooruError extends Error {
	constructor(booru, message) {
		super(message);
		this.name = booru.name + 'Error';
	}
}

module.exports = BooruError;
