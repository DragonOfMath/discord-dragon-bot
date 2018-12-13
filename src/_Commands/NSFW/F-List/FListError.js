class FListError extends Error {
	constructor(message) {
		super(message);
		this.name = 'FListError';
	}
}

module.exports = FListError;
