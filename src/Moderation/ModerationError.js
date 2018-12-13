/**
 * @class ModerationError
 * @extends Error
 */
class ModerationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ModerationError';
	}
}

module.exports = ModerationError;
